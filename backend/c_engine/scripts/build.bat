@echo off
setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set ENGINE_DIR=%SCRIPT_DIR%..
set CC=gcc
set CFLAGS=-O3 -fopenmp -Wall -Wextra -std=c99 -I"%ENGINE_DIR%\include"
set LDFLAGS=-lm

if not exist "%ENGINE_DIR%\bin" mkdir "%ENGINE_DIR%\bin"

echo ==========================================================
echo  Building ParallelX C Computational Engine (Windows GCC)
echo ==========================================================

echo [1/6] Compiling matrix_common.o...
%CC% %CFLAGS% -c "%ENGINE_DIR%\src\matrix_common.c" -o "%ENGINE_DIR%\bin\matrix_common.o"

echo [2/6] Compiling matrix_seq.exe...
%CC% %CFLAGS% -DSTANDALONE_BUILD "%ENGINE_DIR%\src\matrix_seq.c" "%ENGINE_DIR%\bin\matrix_common.o" -o "%ENGINE_DIR%\bin\matrix_seq.exe" %LDFLAGS%

echo [3/6] Compiling matrix_omp_static.exe...
%CC% %CFLAGS% -DSTANDALONE_BUILD "%ENGINE_DIR%\src\matrix_omp_static.c" "%ENGINE_DIR%\bin\matrix_common.o" -o "%ENGINE_DIR%\bin\matrix_omp_static.exe" %LDFLAGS%

echo [4/6] Compiling matrix_omp_dynamic.exe...
%CC% %CFLAGS% -DSTANDALONE_BUILD "%ENGINE_DIR%\src\matrix_omp_dynamic.c" "%ENGINE_DIR%\bin\matrix_common.o" -o "%ENGINE_DIR%\bin\matrix_omp_dynamic.exe" %LDFLAGS%

echo [5/6] Compiling matrix_omp_guided.exe...
%CC% %CFLAGS% -DSTANDALONE_BUILD "%ENGINE_DIR%\src\matrix_omp_guided.c" "%ENGINE_DIR%\bin\matrix_common.o" -o "%ENGINE_DIR%\bin\matrix_omp_guided.exe" %LDFLAGS%

echo [6/6] Compiling benchmark_all.exe and test_correctness.exe...
%CC% %CFLAGS% "%ENGINE_DIR%\src\benchmark_all.c" "%ENGINE_DIR%\src\matrix_seq.c" "%ENGINE_DIR%\src\matrix_omp_static.c" "%ENGINE_DIR%\src\matrix_omp_dynamic.c" "%ENGINE_DIR%\src\matrix_omp_guided.c" "%ENGINE_DIR%\bin\matrix_common.o" -o "%ENGINE_DIR%\bin\benchmark_all.exe" %LDFLAGS%
%CC% %CFLAGS% "%ENGINE_DIR%\tests\test_correctness.c" "%ENGINE_DIR%\src\matrix_seq.c" "%ENGINE_DIR%\src\matrix_omp_static.c" "%ENGINE_DIR%\src\matrix_omp_dynamic.c" "%ENGINE_DIR%\src\matrix_omp_guided.c" "%ENGINE_DIR%\bin\matrix_common.o" -o "%ENGINE_DIR%\bin\test_correctness.exe" %LDFLAGS%

echo ==========================================================
echo  Build finished successfully.
echo ==========================================================
