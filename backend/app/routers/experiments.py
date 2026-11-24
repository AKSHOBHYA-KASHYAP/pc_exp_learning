from fastapi import APIRouter, HTTPException, Path, BackgroundTasks
from typing import List, Dict, Any
from ..models import ExperimentRunRequest, ExperimentResponse
from ..services.runner_service import runner_service

router = APIRouter(prefix="/api/experiments", tags=["Experiments"])

@router.post("/run", response_model=ExperimentResponse)
async def run_experiment(req: ExperimentRunRequest, background_tasks: BackgroundTasks):
    """Enqueues and initiates a real C OpenMP benchmark experiment."""
    exp = runner_service.create_queued_experiment(req)
    background_tasks.add_task(runner_service.execute_experiment_task, exp.id)
    return exp

@router.get("", response_model=List[ExperimentResponse])
async def list_experiments():
    """Retrieves all past and active experiment runs."""
    return runner_service.get_all_experiments()

@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment_details(experiment_id: str = Path(..., description="The unique experiment ID")):
    """Retrieves the full results and metrics for a specific experiment."""
    exp = runner_service.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return exp

@router.get("/{experiment_id}/status")
async def get_experiment_status(experiment_id: str = Path(...)):
    """Retrieves lightweight status information for an experiment."""
    exp = runner_service.get_experiment(experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail=f"Experiment '{experiment_id}' not found.")
    return {
        "id": exp.id,
        "status": exp.status,
        "is_valid": exp.is_valid,
        "speedup": exp.speedup,
        "error_message": exp.error_message,
    }

@router.post("/{experiment_id}/cancel")
async def cancel_experiment(experiment_id: str = Path(...)):
    """Cancels a running experiment subprocess."""
    success = await runner_service.cancel_experiment(experiment_id)
    if not success:
        raise HTTPException(status_code=400, detail="Experiment cannot be cancelled or is not running.")
    return {"message": "Experiment cancellation requested."}
