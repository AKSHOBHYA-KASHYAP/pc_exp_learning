import asyncio
import json
import uuid
import datetime
import psutil
from pathlib import Path
from typing import Dict, List, Optional, Any

from ..config import (
    BIN_DIR,
    HISTORY_FILE,
    EXECUTION_TIMEOUT_SECONDS,
    IS_WINDOWS,
    WSL_AVAILABLE,
    get_wsl_path,
)
from ..models import (
    ExperimentRunRequest,
    ExperimentResponse,
    ExperimentStatus,
    BenchmarkResultItem,
    SchedulingStrategy,
)
from ..database import get_connection
from .compiler_service import check_binaries_exist, compile_c_engine
from .websocket_manager import ws_manager

class RunnerService:
    def __init__(self):
        self._lock = asyncio.Lock()
        self.active_processes: Dict[str, asyncio.subprocess.Process] = {}
        self.experiments: Dict[str, ExperimentResponse] = {}
        self._load_history()

    def _load_history(self):
        """Loads historical experiments from SQLite database first, fallback to JSON."""
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM experiments ORDER BY created_at DESC LIMIT 100")
            rows = cursor.fetchall()
            for r in rows:
                req = ExperimentRunRequest(
                    workload=r["workload"],
                    matrix_size=r["matrix_size"],
                    threads=r["threads"],
                    scheduling=r["scheduling"],
                    chunk_size=r["chunk_size"],
                    repetitions=r["repetitions"],
                )
                res = ExperimentResponse(
                    id=r["id"],
                    status=ExperimentStatus.COMPLETED,
                    created_at=r["created_at"],
                    completed_at=r["created_at"],
                    config=req,
                    results=[],
                    sequential_time_ms=r["sequential_baseline_time_ms"],
                    parallel_time_ms=r["mean_time_ms"],
                    speedup=r["speedup"],
                    efficiency=r["efficiency"],
                    gflops=r["throughput_gflops"],
                    is_valid=bool(r["is_valid"]),
                )
                self.experiments[res.id] = res
            conn.close()
        except Exception as e:
            print(f"[Warning] Failed to load experiments from SQLite: {e}")

        # Fallback load from JSON store if SQLite was empty
        if not self.experiments and HISTORY_FILE.exists():
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        exp = ExperimentResponse(**item)
                        self.experiments[exp.id] = exp
            except Exception as e:
                print(f"[Warning] Failed to load experiment JSON history: {e}")

    def _save_history(self):
        """Saves current state to local JSON store."""
        try:
            HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump([exp.dict() for exp in self.experiments.values()], f, indent=2)
        except Exception as e:
            print(f"[Warning] Failed to save experiment history: {e}")

    def get_all_experiments(self) -> List[ExperimentResponse]:
        return sorted(
            list(self.experiments.values()),
            key=lambda x: x.created_at,
            reverse=True
        )

    def get_experiment(self, experiment_id: str) -> Optional[ExperimentResponse]:
        return self.experiments.get(experiment_id)

    async def cancel_experiment(self, experiment_id: str) -> bool:
        """Cancels a running experiment subprocess."""
        exp = self.experiments.get(experiment_id)
        if not exp or exp.status != ExperimentStatus.RUNNING:
            return False

        proc = self.active_processes.get(experiment_id)
        if proc:
            try:
                proc.terminate()
                await asyncio.sleep(0.2)
                if proc.returncode is None:
                    proc.kill()
            except Exception:
                pass

        exp.status = ExperimentStatus.CANCELLED
        exp.completed_at = datetime.datetime.now().isoformat()
        exp.error_message = "Execution cancelled by user."
        self._save_history()

        await ws_manager.broadcast_to_experiment(experiment_id, {
            "type": "cancelled",
            "status": "cancelled",
            "message": "Experiment was cancelled by user request."
        })
        return True

    def create_queued_experiment(self, req: ExperimentRunRequest) -> ExperimentResponse:
        """Creates a new experiment and stores it in queued status."""
        exp_id = f"EXP-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:6].upper()}"
        
        response = ExperimentResponse(
            id=exp_id,
            status=ExperimentStatus.QUEUED,
            created_at=datetime.datetime.now().isoformat(),
            config=req,
            results=[],
        )
        self.experiments[exp_id] = response
        self._save_history()
        return response

    async def execute_experiment_task(self, experiment_id: str):
        """Worker task processing the queued experiment with real CPU sampling and SQLite storage."""
        exp = self.experiments.get(experiment_id)
        if not exp:
            return

        await ws_manager.broadcast_to_experiment(experiment_id, {
            "type": "status",
            "status": "queued",
            "message": "Experiment queued for execution."
        })

        async with self._lock:
            # 1. Compilation verification
            if not check_binaries_exist():
                exp.status = ExperimentStatus.COMPILING
                await ws_manager.broadcast_to_experiment(experiment_id, {
                    "type": "status",
                    "status": "compiling",
                    "message": "Compiling C OpenMP engine binaries..."
                })

                compile_res = await compile_c_engine()
                if not compile_res["success"]:
                    exp.status = ExperimentStatus.FAILED
                    exp.error_message = f"Compilation failed: {compile_res['stderr']}"
                    exp.completed_at = datetime.datetime.now().isoformat()
                    self._save_history()
                    await ws_manager.broadcast_to_experiment(experiment_id, {
                        "type": "failed",
                        "status": "failed",
                        "error": exp.error_message
                    })
                    return

                await ws_manager.broadcast_to_experiment(experiment_id, {
                    "type": "status",
                    "status": "compiled",
                    "message": "C OpenMP engine binaries compiled successfully."
                })

            # 2. Execution Start
            exp.status = ExperimentStatus.RUNNING
            exp.started_at = datetime.datetime.now().isoformat()
            self._save_history()

            await ws_manager.broadcast_to_experiment(experiment_id, {
                "type": "status",
                "status": "running",
                "message": f"Executing OpenMP benchmark ({exp.config.matrix_size}x{exp.config.matrix_size}, {exp.config.threads}T)...",
                "config": exp.config.dict()
            })

            cmd = self._build_command(exp.config)

            # Background CPU sampler task (sampling real CPU percent during subprocess run)
            cpu_samples: List[float] = []
            is_sampling = [True]

            async def sample_cpu():
                while is_sampling[0]:
                    try:
                        cpu_samples.append(psutil.cpu_percent(interval=0.04))
                    except Exception:
                        pass
                    await asyncio.sleep(0.01)

            sampler_task = asyncio.create_task(sample_cpu())

            try:
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                self.active_processes[experiment_id] = proc

                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=EXECUTION_TIMEOUT_SECONDS
                )
                stdout = stdout_bytes.decode("utf-8", errors="replace")
                stderr = stderr_bytes.decode("utf-8", errors="replace")

                is_sampling[0] = False
                await sampler_task

                measured_cpu = round(sum(cpu_samples) / len(cpu_samples), 1) if cpu_samples else psutil.cpu_percent()

                if proc.returncode != 0:
                    exp.status = ExperimentStatus.FAILED
                    exp.error_message = f"Process exited with code {proc.returncode}: {stderr or stdout}"
                    exp.completed_at = datetime.datetime.now().isoformat()
                    self._save_history()
                    await ws_manager.broadcast_to_experiment(experiment_id, {
                        "type": "failed",
                        "status": "failed",
                        "error": exp.error_message
                    })
                    return

                # 4. Parse Results JSON and save into SQLite
                self._parse_and_finalize_results(exp, stdout, measured_cpu)
                exp.status = ExperimentStatus.COMPLETED
                exp.completed_at = datetime.datetime.now().isoformat()
                self._save_history()

                summary_msg = f"Benchmark finished successfully. Speedup: {exp.speedup:.2f}x, Parallel Time: {exp.parallel_time_ms:.2f}ms, GFLOPS: {exp.gflops:.2f}"
                await ws_manager.broadcast_to_experiment(experiment_id, {
                    "type": "completed",
                    "status": "completed",
                    "message": summary_msg,
                    "data": exp.dict()
                })

            except asyncio.TimeoutError:
                is_sampling[0] = False
                await sampler_task
                exp.status = ExperimentStatus.FAILED
                exp.error_message = f"Execution timed out after {EXECUTION_TIMEOUT_SECONDS} seconds."
                exp.completed_at = datetime.datetime.now().isoformat()
                self._save_history()
                await ws_manager.broadcast_to_experiment(experiment_id, {
                    "type": "failed",
                    "status": "failed",
                    "error": exp.error_message
                })
            except Exception as e:
                is_sampling[0] = False
                await sampler_task
                exp.status = ExperimentStatus.FAILED
                exp.error_message = f"Unexpected execution error: {str(e)}"
                exp.completed_at = datetime.datetime.now().isoformat()
                self._save_history()
                await ws_manager.broadcast_to_experiment(experiment_id, {
                    "type": "failed",
                    "status": "failed",
                    "error": exp.error_message
                })
            finally:
                self.active_processes.pop(experiment_id, None)

    def _build_command(self, config: ExperimentRunRequest) -> List[str]:
        """Builds controlled, safe argument arrays for subprocess execution."""
        binary_name = "benchmark_all"
        suffix = ".exe" if (IS_WINDOWS and not WSL_AVAILABLE) else ""
        
        args = [
            str(config.matrix_size),
            str(config.threads),
            str(config.chunk_size),
            str(config.repetitions),
            "1", # 1 warmup run
            "--json"
        ]

        if IS_WINDOWS and WSL_AVAILABLE:
            wsl_bin = get_wsl_path(BIN_DIR / f"{binary_name}{suffix}")
            return ["wsl", wsl_bin, *args]
        else:
            return [str(BIN_DIR / f"{binary_name}{suffix}"), *args]

    def _parse_and_finalize_results(self, exp: ExperimentResponse, stdout: str, measured_cpu: float):
        """Parses the JSON output emitted by benchmark_all, assigns metrics, and stores in SQLite."""
        try:
            json_start = stdout.find("{")
            json_end = stdout.rfind("}")
            if json_start != -1 and json_end != -1:
                raw_json = stdout[json_start : json_end + 1]
                data = json.loads(raw_json)

                benchmarks = data.get("benchmarks", [])
                exp.results = [
                    BenchmarkResultItem(
                        name=b["name"],
                        scheduling=b["scheduling"],
                        threads=b["threads"],
                        chunk_size=data.get("chunk_size", exp.config.chunk_size),
                        time_ms=b["time_ms"],
                        speedup=b["speedup"],
                        efficiency=b["efficiency"],
                        gflops=b["gflops"],
                        checksum=b["checksum"],
                        is_valid=b["is_valid"],
                        max_diff=b["max_diff"],
                    )
                    for b in benchmarks
                ]

                # Identify baseline
                seq_item = next((b for b in exp.results if b.scheduling == "none"), None)
                if seq_item:
                    exp.sequential_time_ms = seq_item.time_ms

                # Target scheduling
                target_sched = exp.config.scheduling.value
                target_item = None
                if target_sched == "all":
                    par_items = [b for b in exp.results if b.scheduling != "none"]
                    if par_items:
                        target_item = min(par_items, key=lambda x: x.time_ms)
                else:
                    target_item = next((b for b in exp.results if b.scheduling == target_sched), None)

                if target_item:
                    exp.parallel_time_ms = target_item.time_ms
                    exp.speedup = target_item.speedup
                    exp.efficiency = target_item.efficiency
                    exp.gflops = target_item.gflops
                    exp.is_valid = target_item.is_valid
                elif seq_item:
                    exp.parallel_time_ms = seq_item.time_ms
                    exp.speedup = 1.0
                    exp.efficiency = 100.0
                    exp.gflops = seq_item.gflops
                    exp.is_valid = seq_item.is_valid

                # Persist to SQLite
                self._persist_to_sqlite(exp, data, measured_cpu)

        except Exception as e:
            exp.error_message = f"Failed to parse engine output JSON: {e}. Output was: {stdout[:500]}"
            exp.is_valid = False

    def _persist_to_sqlite(self, exp: ExperimentResponse, raw_json_data: Dict[str, Any], measured_cpu: float):
        """Stores aggregate benchmark results and individual run repetitions into SQLite."""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            benchmarks = raw_json_data.get("benchmarks", [])
            warmup_runs = raw_json_data.get("warmup_runs", 1)
            repetitions = raw_json_data.get("repetitions", exp.config.repetitions)
            seq_time = exp.sequential_time_ms or 0.0

            for b in benchmarks:
                b_sched = b["scheduling"]
                b_threads = b["threads"]
                # For sequential, b_threads is 1
                row_id = f"{exp.id}-{b_sched}-T{b_threads}"

                cursor.execute("""
                INSERT OR REPLACE INTO experiments (
                    id, workload, matrix_size, threads, scheduling, chunk_size,
                    repetitions, warmup_runs, mean_time_ms, std_dev_time_ms, min_time_ms, max_time_ms,
                    sequential_baseline_time_ms, speedup, efficiency, cpu_utilization_percent,
                    throughput_gflops, sync_overhead_ms, checksum, is_valid, max_diff, created_at, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row_id,
                    exp.config.workload.value if hasattr(exp.config.workload, 'value') else str(exp.config.workload),
                    exp.config.matrix_size,
                    b_threads,
                    b_sched,
                    exp.config.chunk_size,
                    repetitions,
                    warmup_runs,
                    b.get("mean_time_ms", b["time_ms"]),
                    b.get("std_dev_ms", 0.0),
                    b.get("min_time_ms", b["time_ms"]),
                    b.get("max_time_ms", b["time_ms"]),
                    seq_time,
                    b["speedup"],
                    b["efficiency"],
                    measured_cpu,
                    b["gflops"],
                    b.get("sync_wait_ms", 0.0),
                    b["checksum"],
                    1 if b["is_valid"] else 0,
                    b["max_diff"],
                    exp.created_at,
                    f"Ubuntu WSL2 execution (Host CPU: {measured_cpu}%)"
                ))

                # Store individual run repetitions if emitted
                individual = b.get("individual_runs", [])
                for idx, r_time in enumerate(individual):
                    cursor.execute("""
                    INSERT INTO experiment_runs (
                        experiment_id, run_number, is_warmup, time_ms, cpu_utilization_percent, checksum, is_valid
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        row_id,
                        idx + 1,
                        0,
                        r_time,
                        measured_cpu,
                        b["checksum"],
                        1 if b["is_valid"] else 0,
                    ))

            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[SQLite Persistence Warning] Failed to insert results: {e}")

runner_service = RunnerService()
