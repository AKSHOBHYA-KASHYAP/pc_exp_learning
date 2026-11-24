import os
import platform
import shutil
from pathlib import Path

# Paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
C_ENGINE_DIR = BACKEND_DIR / "c_engine"
BIN_DIR = C_ENGINE_DIR / "bin"
SCRIPTS_DIR = C_ENGINE_DIR / "scripts"
DATA_DIR = APP_DIR / "data"
HISTORY_FILE = DATA_DIR / "experiments_store.json"

# Limits & Safety
MIN_DIM = 2
MAX_DIM = 4096
DEFAULT_DIM = 500

MIN_THREADS = 1
MAX_THREADS = 128
DEFAULT_THREADS = 8

DEFAULT_CHUNK_SIZE = 16
DEFAULT_REPETITIONS = 1
MAX_REPETITIONS = 10

EXECUTION_TIMEOUT_SECONDS = 180  # Max timeout for large matrix computations

# Host & Execution Mode
IS_WINDOWS = platform.system() == "Windows"
WSL_AVAILABLE = bool(shutil.which("wsl")) if IS_WINDOWS else False

def get_wsl_path(win_path: Path) -> str:
    """Converts a Windows Path to /mnt/c/... WSL path format."""
    resolved = win_path.resolve()
    drive = resolved.drive.replace(":", "").lower()
    rest = str(resolved)[len(resolved.drive):].replace("\\", "/")
    return f"/mnt/{drive}{rest}"
