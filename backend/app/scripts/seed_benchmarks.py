import asyncio
import time
from backend.app.models import ExperimentRunRequest, SchedulingStrategy
from backend.app.services.runner_service import runner_service
from backend.app.database import get_connection

async def main():
    print("========================================================================")
    print(" PARALLELX — Multi-Configuration Benchmark & SQLite Population")
    print(" Executing 5 repetitions + 1 warmup pass per configuration")
    print("========================================================================")

    # Matrix sizes & threads to cover
    sizes = [100, 250, 500, 1000]
    threads_list = [1, 2, 4, 8, 16]
    repetitions = 5

    total = len(sizes) * len(threads_list)
    idx = 0

    for s in sizes:
        for t in threads_list:
            idx += 1
            print(f"\n[{idx}/{total}] Executing Size: {s}x{s} | Threads: {t} | Repetitions: {repetitions}...")
            t0 = time.time()
            req = ExperimentRunRequest(
                matrix_size=s,
                threads=t,
                scheduling=SchedulingStrategy.ALL,
                chunk_size=16,
                repetitions=repetitions,
                run_sequential=True,
            )
            exp = runner_service.create_queued_experiment(req)
            await runner_service.execute_experiment_task(exp.id)
            elapsed = time.time() - t0
            print(f"    Completed in {elapsed:.2f}s | Speedup: {exp.speedup}x | Efficiency: {exp.efficiency}% | Valid: {exp.is_valid}")

    # Verify SQLite counts
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM experiments")
    total_exp_rows = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM experiment_runs")
    total_run_rows = c.fetchone()[0]
    c.execute("SELECT MAX(speedup), AVG(speedup), MAX(throughput_gflops) FROM experiments")
    stats = c.fetchone()
    conn.close()

    print("\n========================================================================")
    print(f" SQLite Population Complete!")
    print(f" Total Aggregate Experiments in DB: {total_exp_rows}")
    print(f" Total Individual Repetition Runs:  {total_run_rows}")
    print(f" Peak Measured Speedup:             {stats[0]:.2f}x")
    print(f" Average Speedup:                   {stats[1]:.2f}x")
    print(f" Peak Throughput:                   {stats[2]:.2f} GFLOPS")
    print("========================================================================")

if __name__ == "__main__":
    asyncio.run(main())
