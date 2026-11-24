from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class SchedulingStrategy(str, Enum):
    STATIC = "static"
    DYNAMIC = "dynamic"
    GUIDED = "guided"
    SEQUENTIAL = "sequential"
    NONE = "none"
    ALL = "all"  # Runs baseline and all 3 OpenMP strategies for full comparison

class WorkloadType(str, Enum):
    MATRIX_MULTIPLY = "matrix_multiply"
    VECTOR_ADD = "vector_add"
    MONTE_CARLO_PI = "monte_carlo_pi"
    MANDELBROT = "mandelbrot"

class ExperimentStatus(str, Enum):
    QUEUED = "queued"
    COMPILING = "compiling"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ExperimentRunRequest(BaseModel):
    workload: WorkloadType = WorkloadType.MATRIX_MULTIPLY
    matrix_size: int = Field(default=500, ge=2, le=4096, description="Matrix dimension N (N x N)")
    threads: int = Field(default=8, ge=1, le=128, description="Number of OpenMP worker threads")
    scheduling: SchedulingStrategy = Field(default=SchedulingStrategy.GUIDED, description="Scheduling policy")
    chunk_size: int = Field(default=16, ge=1, le=512, description="Loop iteration chunk size")
    repetitions: int = Field(default=1, ge=1, le=10, description="Repetitions for timing average")
    run_sequential: bool = Field(default=True, description="Compute sequential baseline for speedup ratio")

class BenchmarkResultItem(BaseModel):
    name: str
    scheduling: str
    threads: int
    chunk_size: int
    time_ms: float
    speedup: float
    efficiency: float
    gflops: float
    checksum: float
    is_valid: bool
    max_diff: float

class ExperimentResponse(BaseModel):
    id: str
    status: ExperimentStatus
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    config: ExperimentRunRequest
    results: List[BenchmarkResultItem] = []
    sequential_time_ms: Optional[float] = None
    parallel_time_ms: Optional[float] = None
    speedup: Optional[float] = None
    efficiency: Optional[float] = None
    gflops: Optional[float] = None
    is_valid: bool = True
    error_message: Optional[str] = None
    execution_environment: str = "Ubuntu WSL / Native GCC"

class CPUInfoModel(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    physical_cores: int
    logical_cores: int
    max_threads: int
    current_frequency_mhz: Optional[float] = None
    cpu_percent: float
    model_name: str
    architecture: str

class SystemInfoModel(BaseModel):
    os: str
    platform: str
    architecture: str
    processor: str
    python_version: str
    gcc_version: str
    openmp_supported: bool
    execution_mode: str
    cpu: CPUInfoModel
    compiler_path: str
    engine_ready: bool
