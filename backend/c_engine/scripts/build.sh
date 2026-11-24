#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

CC="${CC:-gcc}"
CFLAGS="-O3 -fopenmp -Wall -Wextra -std=c99 -I${ENGINE_DIR}/include"
LDFLAGS="-lm"

mkdir -p "${ENGINE_DIR}/bin"

echo "=========================================================="
echo " Building ParallelX C Computational Engine"
echo " Compiler: $(${CC} --version | head -n 1)"
echo " Flags:    ${CFLAGS}"
echo "=========================================================="

echo "[1/6] Compiling shared matrix utilities (matrix_common.o)..."
${CC} ${CFLAGS} -c "${ENGINE_DIR}/src/matrix_common.c" -o "${ENGINE_DIR}/bin/matrix_common.o"

echo "[2/6] Compiling matrix_seq..."
${CC} ${CFLAGS} -DSTANDALONE_BUILD "${ENGINE_DIR}/src/matrix_seq.c" "${ENGINE_DIR}/bin/matrix_common.o" -o "${ENGINE_DIR}/bin/matrix_seq" ${LDFLAGS}

echo "[3/6] Compiling matrix_omp_static..."
${CC} ${CFLAGS} -DSTANDALONE_BUILD "${ENGINE_DIR}/src/matrix_omp_static.c" "${ENGINE_DIR}/bin/matrix_common.o" -o "${ENGINE_DIR}/bin/matrix_omp_static" ${LDFLAGS}

echo "[4/6] Compiling matrix_omp_dynamic..."
${CC} ${CFLAGS} -DSTANDALONE_BUILD "${ENGINE_DIR}/src/matrix_omp_dynamic.c" "${ENGINE_DIR}/bin/matrix_common.o" -o "${ENGINE_DIR}/bin/matrix_omp_dynamic" ${LDFLAGS}

echo "[5/6] Compiling matrix_omp_guided..."
${CC} ${CFLAGS} -DSTANDALONE_BUILD "${ENGINE_DIR}/src/matrix_omp_guided.c" "${ENGINE_DIR}/bin/matrix_common.o" -o "${ENGINE_DIR}/bin/matrix_omp_guided" ${LDFLAGS}

echo "[6/6] Compiling unified benchmark_all runner and correctness tests..."
${CC} ${CFLAGS} \
    "${ENGINE_DIR}/src/benchmark_all.c" \
    "${ENGINE_DIR}/src/matrix_seq.c" \
    "${ENGINE_DIR}/src/matrix_omp_static.c" \
    "${ENGINE_DIR}/src/matrix_omp_dynamic.c" \
    "${ENGINE_DIR}/src/matrix_omp_guided.c" \
    "${ENGINE_DIR}/bin/matrix_common.o" \
    -o "${ENGINE_DIR}/bin/benchmark_all" ${LDFLAGS}

${CC} ${CFLAGS} \
    "${ENGINE_DIR}/tests/test_correctness.c" \
    "${ENGINE_DIR}/src/matrix_seq.c" \
    "${ENGINE_DIR}/src/matrix_omp_static.c" \
    "${ENGINE_DIR}/src/matrix_omp_dynamic.c" \
    "${ENGINE_DIR}/src/matrix_omp_guided.c" \
    "${ENGINE_DIR}/bin/matrix_common.o" \
    -o "${ENGINE_DIR}/bin/test_correctness" ${LDFLAGS}

echo "=========================================================="
echo " Build successful! Binaries located in ${ENGINE_DIR}/bin:"
ls -lh "${ENGINE_DIR}/bin"
echo "=========================================================="
