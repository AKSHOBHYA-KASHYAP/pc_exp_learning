from fastapi import APIRouter, Query, BackgroundTasks, Response
from fastapi.responses import Response
from typing import Optional, List, Dict, Any
from ..services.analytics_service import AnalyticsService
from ..models import ExperimentRunRequest, SchedulingStrategy
from ..services.runner_service import runner_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
async def get_summary():
    """Retrieve high-level summary KPIs and parameter coverage from SQLite."""
    return AnalyticsService.get_summary_stats()

@router.get("/curves")
async def get_curves(
    matrix_size: Optional[int] = Query(None, description="Matrix dimension to filter curves"),
    scheduling: Optional[str] = Query(None, description="Scheduling strategy filter ('static', 'dynamic', 'guided', 'all')")
):
    """Retrieve empirical scaling curves for Recharts (Speedup, Efficiency, CPU Utilization, Sync Overhead)."""
    return AnalyticsService.get_curves(matrix_size=matrix_size, scheduling=scheduling)

@router.get("/raw")
async def get_raw_records(limit: int = Query(100, ge=1, le=500)):
    """Retrieve raw historical rows from the SQLite database."""
    return AnalyticsService.get_raw_records(limit=limit)

@router.get("/export.csv")
async def export_csv():
    """Stream all benchmark records from SQLite as an attachment CSV file."""
    csv_data = AnalyticsService.generate_csv_export()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=parallelx_benchmarks.csv"
        }
    )

@router.post("/batch")
async def trigger_batch_benchmark(
    background_tasks: BackgroundTasks,
    sizes: Optional[List[int]] = Query(None),
    threads_list: Optional[List[int]] = Query(None),
    repetitions: int = Query(5, ge=1, le=10),
):
    """Executes an automated multi-configuration benchmark grid and stores all data in SQLite."""
    sizes_to_run = sizes or [100, 250, 500, 1000]
    threads_to_run = threads_list or [1, 2, 4, 8, 16]

    async def run_batch():
        for s in sizes_to_run:
            for t in threads_to_run:
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

    background_tasks.add_task(run_batch)
    return {
        "message": "Automated batch benchmark enqueued",
        "matrix_sizes": sizes_to_run,
        "thread_counts": threads_to_run,
        "repetitions_per_config": repetitions,
    }
