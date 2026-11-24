from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

class PredictRequest(BaseModel):
    matrix_size: int = Field(default=1000, ge=16, le=4096, description="Matrix dimension N (N x N)")
    threads: int = Field(default=8, ge=1, le=128, description="Worker thread count")
    scheduling: str = Field(default="guided", description="Scheduling policy (static, dynamic, guided)")
    chunk_size: int = Field(default=16, ge=1, le=512, description="Loop iteration chunk size")

class RecommendRequest(BaseModel):
    matrix_size: int = Field(default=1000, ge=16, le=4096, description="Matrix dimension N")

@router.get("/status")
def get_ml_status() -> Dict[str, Any]:
    """Returns training status, metrics for candidate models, and feature importances."""
    return ml_service.get_status()

@router.post("/train")
def train_ml_models() -> Dict[str, Any]:
    """Triggers retraining of Linear Regression, Decision Tree, and Random Forest on SQLite data."""
    try:
        return ml_service.train_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.post("/predict")
def predict_performance(req: PredictRequest) -> Dict[str, Any]:
    """
    Predicts parallel execution runtime and algebraically derives speedup and efficiency
    to avoid target leakage. Returns 95% tree confidence intervals and empirical verification delta.
    """
    try:
        return ml_service.predict(
            matrix_size=req.matrix_size,
            threads=req.threads,
            scheduling=req.scheduling,
            chunk_size=req.chunk_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@router.post("/recommend")
def recommend_configuration(req: RecommendRequest) -> Dict[str, Any]:
    """
    Analyzes scaling projections across all thread counts to identify the optimal thread count,
    strategy, and detects diminishing returns / parallel overhead bottlenecks.
    """
    try:
        return ml_service.recommend(matrix_size=req.matrix_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation analysis failed: {str(e)}")

@router.get("/generalization")
def get_generalization_records() -> Dict[str, Any]:
    """Returns empirical validation comparing actual C measured times vs predicted times on unseen worker counts."""
    status = ml_service.get_status()
    return {
        "unseen_records": status.get("unseen_records", []),
        "unseen_metrics": {
            "unseen_r2": status.get("unseen_r2"),
            "unseen_mae_ms": status.get("unseen_mae_ms"),
            "unseen_rmse_ms": status.get("unseen_rmse_ms"),
            "unseen_mape_percent": status.get("unseen_mape_percent"),
        }
    }

class RecommendObjectiveRequest(BaseModel):
    matrix_size: int = Field(default=1000, ge=16, le=4096)
    objective: str = Field(default="balanced", description="'min_time', 'max_speedup', 'high_efficiency', 'balanced'")

@router.post("/recommend-objective")
def recommend_by_objective(req: RecommendObjectiveRequest) -> Dict[str, Any]:
    """
    Phase 6: Recommends execution configurations under specified optimization objectives:
    - Minimum Execution Time
    - Maximum Speedup
    - Better Parallel Efficiency
    - Balanced Performance and Resource Utilization
    """
    try:
        return ml_service.recommend_with_objective(
            matrix_size=req.matrix_size,
            objective=req.objective
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Objective recommendation failed: {str(e)}")

class ExecuteRecommendedRequest(BaseModel):
    matrix_size: int
    threads: int
    scheduling: str
    chunk_size: int = 16
    objective: str = "balanced"
    predicted_time_ms: float
    predicted_speedup: float
    predicted_efficiency: float

@router.post("/execute-recommended")
async def execute_recommended_configuration(req: ExecuteRecommendedRequest) -> Dict[str, Any]:
    """
    Phase 6: Directly executes the AI-recommended configuration on the C/OpenMP engine,
    measures real execution time, validates against predictions, and persists comparison records.
    """
    from backend.app.models import ExperimentRunRequest, SchedulingStrategy
    from backend.app.services.runner_service import runner_service

    # Map scheduling string
    strat_map = {
        "static": SchedulingStrategy.STATIC,
        "dynamic": SchedulingStrategy.DYNAMIC,
        "guided": SchedulingStrategy.GUIDED,
    }
    sched_enum = strat_map.get(req.scheduling.lower(), SchedulingStrategy.GUIDED)

    exp_req = ExperimentRunRequest(
        matrix_size=req.matrix_size,
        threads=req.threads,
        scheduling=sched_enum,
        chunk_size=req.chunk_size,
        repetitions=3,
        run_sequential=True,
    )

    exp = runner_service.create_queued_experiment(exp_req)
    await runner_service.execute_experiment_task(exp.id)

    # Fetch results
    if exp.status.value == "failed":
        raise HTTPException(status_code=500, detail=f"Execution failed: {exp.error_message}")

    actual_time = float(exp.parallel_time_ms or (exp.results[0].time_ms if exp.results else 0.0))
    actual_speedup = float(exp.speedup or (exp.results[0].speedup if exp.results else 1.0))
    actual_efficiency = float(exp.efficiency or (exp.results[0].efficiency if exp.results else 100.0))
    throughput_gflops = float(exp.gflops or (exp.results[0].gflops if exp.results else 0.0))

    # Query latest SQLite experiment for real measured CPU utilization and sync overhead
    cpu_util = 75.0
    sync_overhead = 0.0
    try:
        import sqlite3
        from backend.app.database import DB_PATH
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        c.execute("SELECT cpu_utilization_percent, sync_overhead_ms FROM experiments WHERE id = ?", (exp.id,))
        row = c.fetchone()
        if row:
            cpu_util = float(row[0])
            sync_overhead = float(row[1])
        conn.close()
    except Exception:
        pass

    # Record validation in SQLite
    validation_res = ml_service.record_validation(
        experiment_id=exp.id,
        matrix_size=req.matrix_size,
        threads=req.threads,
        scheduling=req.scheduling,
        chunk_size=req.chunk_size,
        objective=req.objective,
        predicted_time_ms=req.predicted_time_ms,
        actual_time_ms=actual_time,
        predicted_speedup=req.predicted_speedup,
        actual_speedup=actual_speedup,
        predicted_efficiency=req.predicted_efficiency,
        actual_efficiency=actual_efficiency
    )

    return {
        "experiment_id": exp.id,
        "status": exp.status.value,
        "matrix_size": req.matrix_size,
        "threads": req.threads,
        "scheduling": req.scheduling,
        "chunk_size": req.chunk_size,
        "optimization_objective": req.objective,
        "predicted_time_ms": req.predicted_time_ms,
        "actual_time_ms": actual_time,
        "predicted_speedup": req.predicted_speedup,
        "actual_speedup": actual_speedup,
        "predicted_efficiency": req.predicted_efficiency,
        "actual_efficiency": actual_efficiency,
        "error_percent": validation_res["error_percent"],
        "throughput_gflops": throughput_gflops,
        "cpu_utilization_percent": cpu_util,
        "sync_overhead_ms": sync_overhead,
        "is_valid": exp.is_valid,
        "created_at": validation_res["created_at"]
    }

@router.get("/validations")
def get_recent_validations(limit: int = 20) -> List[Dict[str, Any]]:
    """Returns history of prediction validation records."""
    return ml_service.get_validations(limit=limit)
