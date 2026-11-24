# ParallelX C Computational Engine
**Team 7 · Case Study 7: Parallel Program Scalability**

High-performance, modular C computational engine for dense matrix multiplication and OpenMP thread scalability analysis.

---

## 1. Architectural Design & Memory Layout

Dense matrix multiplication for dimension $N \times N$ represents an $O(N^3)$ computational workload performing:
$$C_{i,j} = \sum_{k=0}^{N-1} A_{i,k} \cdot B_{k,j}$$
Total floating-point operations: $2N^3$ (mult + add).

### Contiguous 1D Allocation with 2D Row Pointers
Traditional 2D arrays (`double **A`) created via multiple `malloc` calls for each row suffer from pointer indirection overhead, scattered non-contiguous heap memory, and severe cache thrashing. 

ParallelX allocates:
1. One single contiguous buffer of size $N \times N \times \text{sizeof}(\text{double})$ (cache-friendly, SIMD vectorization ready).
2. A row pointer table `double **rows_ptr` indexing each row offset $i \times N$.

This guarantees:
- Fast row access syntax: `A->rows_ptr[i][j]`
- Stride-1 sequential memory access along inner loops
- Zero heap fragmentation

### Loop Interchange ($i-k-j$)
The implementation uses loop interchange ($i-k-j$ instead of naive $i-j-k$):
- Naive ($i-j-k$): Inner loop accesses $B[k][j]$ with stride $N$, causing continuous L1/L2 cache misses.
- Interchanged ($i-k-j$): Scalar $r = A[i][k]$ is kept in register; inner loop iterates over $j$ accessing $C[i][j]$ and $B[k][j]$ with stride 1 (contiguous in memory).
- Each thread operates on independent row blocks $i$, completely eliminating write contention and data races on $C$.

---

## 2. Scheduling Policies Implemented

### 1. Sequential Baseline (`matrix_seq.c`)
- Single-threaded execution.
- Establishes the ground-truth baseline runtime ($T_{\text{seq}}$) and matrix values for speedup ($S = T_{\text{seq}} / T_{\text{par}}$) and efficiency calculations ($E = S / p$).

### 2. OpenMP Static Scheduling (`matrix_omp_static.c`)
```c
#pragma omp parallel for schedule(static, chunk_size) num_threads(threads)
```
- Loop iterations are partitioned into chunks of size `chunk_size` and assigned to threads in round-robin order prior to loop execution.
- **Overhead**: Minimal to zero runtime scheduling overhead.
- **Tradeoff**: Sensitive to load imbalance if iterations vary in work.

### 3. OpenMP Dynamic Scheduling (`matrix_omp_dynamic.c`)
```c
#pragma omp parallel for schedule(dynamic, chunk_size) num_threads(threads)
```
- Each thread executes a chunk of iterations, then requests another chunk from a centralized work queue until no work remains.
- **Overhead**: Atomic synchronization overhead per work-queue access.
- **Tradeoff**: Superior load balancing for non-uniform workloads, but chunk size must be sufficiently large to amortize dispatch cost.

### 4. OpenMP Guided Scheduling (`matrix_omp_guided.c`)
```c
#pragma omp parallel for schedule(guided, chunk_size) num_threads(threads)
```
- Chunks start large (proportional to $\text{remaining\_iterations} / p$) and exponentially decrease down to `chunk_size`.
- **Overhead**: Moderate.
- **Tradeoff**: Balances low initial scheduling overhead with fine-grained load-balancing near the end of the loop.

---

## 3. High-Resolution Timing & Verification

1. **Timer**: `omp_get_wtime()` measures wall-clock time with sub-microsecond precision.
2. **Initialisation Isolation**: Matrix deterministic generation is timed separately and excluded from compute benchmarks.
3. **Correctness Verification**: Every parallel run is compared element-wise against the sequential baseline:
   $$\max_{i,j} |C_{\text{par}}[i][j] - C_{\text{seq}}[i][j]| < 10^{-9}$$
4. **Frobenius Checksum**: $\sum_{i,j} |C[i][j]|$ is reported for fast checksum audit.

---

## 4. Building and Running

### Ubuntu / Linux (WSL)
```bash
# Build all binaries
bash backend/c_engine/scripts/build.sh

# Run unit and correctness test suite
bash backend/c_engine/scripts/test_correctness.sh

# Run unified benchmark across 100, 250, 500, 1000, 1500, 2000
bash backend/c_engine/scripts/run_benchmarks.sh
```

### Windows (GCC / MinGW)
```cmd
backend\c_engine\scripts\build.bat
backend\c_engine\bin\test_correctness.exe
backend\c_engine\bin\benchmark_all.exe 500 8 16 1
```

---

## 5. CLI Arguments

All binaries accept standard positional arguments:
```bash
./bin/benchmark_all [matrix_size] [threads] [chunk_size] [repetitions] [--json]
```
Example:
```bash
./bin/benchmark_all 1000 8 16 3 --json
```
