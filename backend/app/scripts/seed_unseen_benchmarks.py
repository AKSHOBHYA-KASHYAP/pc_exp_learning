import asyncio
import time
from backend.app.models import ExperimentRunRequest, SchedulingStrategy
from backend.app.services.runner_service import runner_service
from backend.app.database import get_connection

async def main():
    print("========================================================================")
    print(" PARALLELX — Unseen Worker Benchmark Suite (Threads: 3, 6, 12)")
    print(" Executing real C/OpenMP benchmarks for ML Generalization Validation")
    print("========================================================================")

    sizes = [250, 500, 1000]
    unseen_threads = [3, 6, 12]
    repetitions = 5

    total = len(sizes) * len(unseen_threads)
    idx = 0

    for s in sizes:
        for t in unseen_threads:
            idx += 1
            print(f"\n[{idx}/{total}] Size: {s}x{s} | Threads: {t} | Repetitions: {repetitions}...")
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

    # Tag records with 'unseen_worker_test'
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE experiments SET notes = 'unseen_worker_test' WHERE threads IN (3, 6, 12) AND (notes IS NULL OR notes = '')")
    conn.commit()

    c.execute("SELECT COUNT(*) FROM experiments WHERE threads IN (3, 6, 12)")
    unseen_count = c.fetchone()[0]
    conn.close()

    print("\n========================================================================")
    print(f" Unseen Worker Benchmarks Complete! ({unseen_count} records recorded)")
    print("========================================================================")

if __name__ == "__main__":
    asyncio.run(main())
