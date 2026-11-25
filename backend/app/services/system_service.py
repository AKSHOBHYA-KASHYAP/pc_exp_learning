import platform
import subprocess
from typing import Dict, Any
import psutil
from ..config import IS_WINDOWS, WSL_AVAILABLE
from ..models import CPUInfoModel, SystemInfoModel

def get_cpu_model_name() -> str:
    """Detects CPU brand name across Windows and Linux."""
    try:
        if IS_WINDOWS and WSL_AVAILABLE:
            proc = subprocess.run(
                ["wsl", "bash", "-c", "lscpu | grep 'Model name:' | sed 's/Model name:[ \t]*//'"],
                capture_output=True, text=True, timeout=5
            )
            if proc.returncode == 0 and proc.stdout.strip():
                return proc.stdout.strip()
        if not IS_WINDOWS:
            with open("/proc/cpuinfo") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":")[1].strip()
    except Exception:
        pass
    return platform.processor() or "Multi-Core x86_64 Processor"

def get_gcc_version() -> str:
    """Inspects installed GCC version."""
    try:
        cmd = ["wsl", "gcc", "--version"] if (IS_WINDOWS and WSL_AVAILABLE) else ["gcc", "--version"]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if proc.returncode == 0 and proc.stdout:
            return proc.stdout.splitlines()[0].strip()
    except Exception:
        pass
    return "GCC (Not detected in PATH)"

def get_cpu_info() -> CPUInfoModel:
    physical = psutil.cpu_count(logical=False) or 4
    logical = psutil.cpu_count(logical=True) or 8
    
    freq = None
    try:
        f = psutil.cpu_freq()
        if f:
            freq = round(f.current, 1)
    except Exception:
        pass

    percent = psutil.cpu_percent(interval=0.1)

    return CPUInfoModel(
        physical_cores=physical,
        logical_cores=logical,
        max_threads=logical,
        current_frequency_mhz=freq,
        cpu_percent=percent,
        model_name=get_cpu_model_name(),
        architecture=platform.machine(),
    )

def get_system_info() -> SystemInfoModel:
    cpu = get_cpu_info()
    gcc = get_gcc_version()
    
    execution_mode = "Ubuntu WSL2 (GCC OpenMP)" if (IS_WINDOWS and WSL_AVAILABLE) else f"{platform.system()} Native"

    return SystemInfoModel(
        os=platform.system(),
        platform=platform.platform(),
        architecture=platform.machine(),
        processor=cpu.model_name,
        python_version=platform.python_version(),
        gcc_version=gcc,
        openmp_supported="gcc" in gcc.lower(),
        execution_mode=execution_mode,
        cpu=cpu,
        compiler_path="wsl gcc" if (IS_WINDOWS and WSL_AVAILABLE) else "gcc",
        engine_ready=True,
    )

def get_live_metrics() -> Dict[str, Any]:
    """Returns actual real-time OS hardware telemetry for CPU cores, RAM, and throughput."""
    per_cpu = psutil.cpu_percent(interval=None, percpu=True)
    total_cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()

    freq = None
    try:
        f = psutil.cpu_freq()
        if f:
            freq = round(f.current, 1)
    except Exception:
        pass

    return {
        "total_cpu": round(total_cpu, 1),
        "per_cpu": [round(c, 1) for c in per_cpu],
        "memory_percent": round(mem.percent, 1),
        "memory_used_gb": round(mem.used / (1024**3), 2),
        "memory_total_gb": round(mem.total / (1024**3), 2),
        "frequency_mhz": freq,
        "core_count": len(per_cpu)
    }

