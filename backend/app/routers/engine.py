from fastapi import APIRouter
from typing import Dict, Any
from ..services.compiler_service import compile_c_engine, check_binaries_exist

router = APIRouter(prefix="/api/engine", tags=["Engine"])

@router.post("/compile")
async def trigger_compile() -> Dict[str, Any]:
    """Triggers compilation of the C computational engine."""
    return await compile_c_engine()

@router.get("/status")
async def read_engine_status() -> Dict[str, Any]:
    """Checks whether the compiled C OpenMP binaries exist and are ready."""
    return {
        "engine_ready": check_binaries_exist(),
        "compiler": "GCC OpenMP",
    }
