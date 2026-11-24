#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Ensure binaries exist
if [ ! -f "${ENGINE_DIR}/bin/benchmark_all" ]; then
    bash "${SCRIPT_DIR}/build.sh"
fi

OUTPUT_CSV="${ENGINE_DIR}/benchmark_results.csv"
echo "matrix_size,threads,chunk_size,strategy,time_ms,speedup,efficiency_percent,gflops,status" > "${OUTPUT_CSV}"

echo "=========================================================================="
echo " PARALLELX — Automated Benchmark Suite Across Sizes & Thread Pools"
echo " Host Threads Detected: $(nproc)"
echo " Saving CSV Results to: ${OUTPUT_CSV}"
echo "=========================================================================="

# Benchmark sizes requested in Phase 2:
# 100x100, 250x250, 500x500, 1000x1000, 1500x1500, 2000x2000
SIZES=(100 250 500 1000 1500 2000)
THREADS=(1 2 4 8 16)
CHUNK_SIZE=16
REPETITIONS=1

for size in "${SIZES[@]}"; do
    echo ""
    echo "=========================================================================="
    echo " BENCHMARKING MATRIX SIZE: ${size} x ${size}"
    echo "=========================================================================="
    for t in "${THREADS[@]}"; do
        echo ">>> Running Matrix Size: ${size} | Threads: ${t} | Chunk: ${CHUNK_SIZE}..."
        "${ENGINE_DIR}/bin/benchmark_all" "${size}" "${t}" "${CHUNK_SIZE}" "${REPETITIONS}"
    done
done

echo ""
echo "=========================================================================="
echo " All benchmark sizes (100 to 2000) successfully executed!"
echo "=========================================================================="
