import asyncio
import time
from pathlib import Path
from typing import Dict, Any
from ..config import (
    BIN_DIR,
    SCRIPTS_DIR,
    IS_WINDOWS,
    WSL_AVAILABLE,
    get_wsl_path,
)

REQUIRED_BINARIES = [
    "benchmark_all",
    "matrix_seq",
    "matrix_omp_static",
    "matrix_omp_dynamic",
    "matrix_omp_guided",
]

def check_binaries_exist() -> bool:
    """Checks whether the compiled C OpenMP binaries exist."""
    suffix = ".exe" if (IS_WINDOWS and not WSL_AVAILABLE) else ""
    for name in REQUIRED_BINARIES:
        binary_path = BIN_DIR / f"{name}{suffix}"
        if not binary_path.exists():
            return False
    return True

async def compile_c_engine() -> Dict[str, Any]:
    """Compiles the C computational engine via controlled subprocess."""
    start_time = time.time()
    
    if IS_WINDOWS and WSL_AVAILABLE:
        script_path = get_wsl_path(SCRIPTS_DIR / "build.sh")
        cmd = ["wsl", "bash", script_path]
    elif IS_WINDOWS:
        cmd = [str(SCRIPTS_DIR / "build.bat")]
    else:
        cmd = ["bash", str(SCRIPTS_DIR / "build.sh")]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        duration = round(time.time() - start_time, 3)

        success = (proc.returncode == 0)
        return {
            "success": success,
            "returncode": proc.returncode,
            "duration_sec": duration,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
            "binaries_present": check_binaries_exist(),
        }
    except Exception as e:
        return {
            "success": False,
            "returncode": -1,
            "duration_sec": round(time.time() - start_time, 3),
            "stdout": "",
            "stderr": f"Compilation failed to spawn: {str(e)}",
            "binaries_present": False,
        }
