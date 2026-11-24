#ifndef MATRIX_COMMON_H
#define MATRIX_COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <math.h>
#include <string.h>
#include <time.h>

#ifdef _OPENMP
#include <omp.h>
#endif

#define MAX_ALLOWED_DIM 4096
#define MIN_ALLOWED_DIM 2
#define DEFAULT_CHUNK_SIZE 16
#define VERIFY_EPSILON 1e-9

typedef struct {
    int rows;
    int cols;
    double *data;       /* Contiguous 1D buffer for cache locality and SIMD vectorization */
    double **rows_ptr;  /* Row pointer array enabling A[i][j] syntax */
} Matrix;

typedef struct {
    const char *method_name;
    int size;
    int threads;
    int chunk_size;
    int repetitions;
    double init_time_sec;
    double compute_time_sec;
    double gflops;
    double checksum;
    bool is_valid;
    double max_diff;
} BenchmarkResult;

/* High-resolution wall-clock timer */
static inline double get_wtime(void) {
#ifdef _OPENMP
    return omp_get_wtime();
#else
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (double)ts.tv_sec + (double)ts.tv_nsec * 1e-9;
#endif
}

/* Matrix Lifecycle Functions */
Matrix* matrix_allocate(int rows, int cols);
void matrix_free(Matrix *m);
void matrix_init_deterministic(Matrix *m, int seed);
void matrix_zero(Matrix *m);

/* Verification & Metrics */
double matrix_compute_checksum(const Matrix *m);
bool matrix_verify_equal(const Matrix *expected, const Matrix *actual, double epsilon, double *max_diff);
double calculate_gflops(int n, double elapsed_sec);

/* Printing & Reporting */
void print_benchmark_json(const BenchmarkResult *res);
void print_benchmark_human(const BenchmarkResult *res);

/* Input Validation */
bool validate_dimension(int dim);
bool validate_threads(int threads);

#endif /* MATRIX_COMMON_H */
