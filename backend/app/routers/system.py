from fastapi import APIRouter
from typing import Dict, Any
from ..models import SystemInfoModel, CPUInfoModel
from ..services.system_service import get_system_info, get_cpu_info, get_live_metrics

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/info", response_model=SystemInfoModel)
async def read_system_info():
    """Retrieve host hardware specifications, GCC compiler toolchain, and OS information."""
    return get_system_info()

@router.get("/cpu", response_model=CPUInfoModel)
async def read_cpu_info():
    """Retrieve active CPU topology, physical cores, logical processors, and utilization."""
    return get_cpu_info()

@router.get("/metrics")
async def read_system_metrics() -> Dict[str, Any]:
    """Retrieve real-time hardware telemetry (individual per-core CPU load, RAM usage, clock frequency)."""
    return get_live_metrics()

