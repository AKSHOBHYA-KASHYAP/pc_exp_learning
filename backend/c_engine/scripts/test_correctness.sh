#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo ">>> Compiling C engine test binary..."
bash "${SCRIPT_DIR}/build.sh"

echo ""
echo ">>> Executing correctness test suite..."
"${ENGINE_DIR}/bin/test_correctness"

echo ""
echo ">>> Testing standalone CLI binaries with sample execution..."
"${ENGINE_DIR}/bin/matrix_seq" 100 1
"${ENGINE_DIR}/bin/matrix_omp_static" 100 4 16 1
"${ENGINE_DIR}/bin/matrix_omp_dynamic" 100 4 16 1
"${ENGINE_DIR}/bin/matrix_omp_guided" 100 4 16 1

echo ""
echo ">>> Testing JSON output format..."
"${ENGINE_DIR}/bin/matrix_omp_guided" 100 4 16 1 --json

echo ""
echo ">>> ALL CORRECTNESS AND INTEGRATION TESTS PASSED."
