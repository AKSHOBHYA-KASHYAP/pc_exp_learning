#include "../include/matrix_common.h"

Matrix* matrix_allocate(int rows, int cols) {
    if (rows <= 0 || cols <= 0 || rows > MAX_ALLOWED_DIM || cols > MAX_ALLOWED_DIM) {
        fprintf(stderr, "[Error] Invalid matrix dimensions requested: %d x %d (allowed range: %d to %d)\n",
                rows, cols, MIN_ALLOWED_DIM, MAX_ALLOWED_DIM);
        return NULL;
    }

    Matrix *m = (Matrix*)malloc(sizeof(Matrix));
    if (!m) {
        fprintf(stderr, "[Error] Memory allocation failed for Matrix struct\n");
        return NULL;
    }

    m->rows = rows;
    m->cols = cols;

    /* Allocate contiguous data buffer */
    size_t total_elements = (size_t)rows * (size_t)cols;
    m->data = (double*)malloc(total_elements * sizeof(double));
    if (!m->data) {
        fprintf(stderr, "[Error] Memory allocation failed for %zu doubles (~%.2f MB)\n",
                total_elements, (double)(total_elements * sizeof(double)) / (1024.0 * 1024.0));
        free(m);
        return NULL;
    }

    /* Allocate row pointer array for direct 2D indexed access: m->rows_ptr[i][j] */
    m->rows_ptr = (double**)malloc(rows * sizeof(double*));
    if (!m->rows_ptr) {
        fprintf(stderr, "[Error] Memory allocation failed for row pointers\n");
        free(m->data);
        free(m);
        return NULL;
    }

    for (int i = 0; i < rows; i++) {
        m->rows_ptr[i] = m->data + ((size_t)i * cols);
    }

    return m;
}

void matrix_free(Matrix *m) {
    if (m) {
        if (m->rows_ptr) {
            free(m->rows_ptr);
            m->rows_ptr = NULL;
        }
        if (m->data) {
            free(m->data);
            m->data = NULL;
        }
        free(m);
    }
}

void matrix_init_deterministic(Matrix *m, int seed) {
    if (!m || !m->data || !m->rows_ptr) return;

    int rows = m->rows;
    int cols = m->cols;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            /* Deterministic pseudo-random generation based on index & seed */
            long val = (((long)i + seed) * 37L + ((long)j + 1L) * 19L + (long)seed * 11L) % 1000L;
            m->rows_ptr[i][j] = ((double)val - 500.0) / 100.0;
        }
    }
}

void matrix_zero(Matrix *m) {
    if (!m || !m->data) return;
    size_t total_elements = (size_t)m->rows * (size_t)m->cols;
    memset(m->data, 0, total_elements * sizeof(double));
}

double matrix_compute_checksum(const Matrix *m) {
    if (!m || !m->data) return 0.0;
    double sum = 0.0;
    size_t total_elements = (size_t)m->rows * (size_t)m->cols;
    for (size_t i = 0; i < total_elements; i++) {
        sum += fabs(m->data[i]);
    }
    return sum;
}

bool matrix_verify_equal(const Matrix *expected, const Matrix *actual, double epsilon, double *max_diff) {
    if (!expected || !actual || expected->rows != actual->rows || expected->cols != actual->cols) {
        if (max_diff) *max_diff = -1.0;
        return false;
    }

    double local_max_diff = 0.0;
    bool match = true;
    size_t total = (size_t)expected->rows * (size_t)expected->cols;

    for (size_t idx = 0; idx < total; idx++) {
        double diff = fabs(expected->data[idx] - actual->data[idx]);
        if (diff > local_max_diff) {
            local_max_diff = diff;
        }
        if (diff > epsilon) {
            match = false;
        }
    }

    if (max_diff) {
        *max_diff = local_max_diff;
    }
    return match;
}

double calculate_gflops(int n, double elapsed_sec) {
    if (elapsed_sec <= 0.0) return 0.0;
    /* 2 * N^3 floating point operations */
    double ops = 2.0 * (double)n * (double)n * (double)n;
    return (ops / elapsed_sec) / 1e9;
}

void print_benchmark_json(const BenchmarkResult *res) {
    if (!res) return;
    printf("{\n");
    printf("  \"method\": \"%s\",\n", res->method_name);
    printf("  \"matrix_size\": %d,\n", res->size);
    printf("  \"threads\": %d,\n", res->threads);
    printf("  \"chunk_size\": %d,\n", res->chunk_size);
    printf("  \"repetitions\": %d,\n", res->repetitions);
    printf("  \"init_time_sec\": %.6f,\n", res->init_time_sec);
    printf("  \"compute_time_sec\": %.6f,\n", res->compute_time_sec);
    printf("  \"compute_time_ms\": %.2f,\n", res->compute_time_sec * 1000.0);
    printf("  \"gflops\": %.4f,\n", res->gflops);
    printf("  \"checksum\": %.6f,\n", res->checksum);
    printf("  \"is_valid\": %s,\n", res->is_valid ? "true" : "false");
    printf("  \"max_diff\": %.9e\n", res->max_diff);
    printf("}\n");
}

void print_benchmark_human(const BenchmarkResult *res) {
    if (!res) return;
    printf("------------------------------------------------------------\n");
    printf(" Method:       %s\n", res->method_name);
    printf(" Dimension:    %d x %d\n", res->size, res->size);
    printf(" Threads:      %d (Chunk Size: %d)\n", res->threads, res->chunk_size);
    printf(" Compute Time: %.4f sec (%.2f ms) across %d repetition(s)\n",
           res->compute_time_sec, res->compute_time_sec * 1000.0, res->repetitions);
    printf(" Performance:  %.3f GFLOPS\n", res->gflops);
    printf(" Checksum:     %.4f\n", res->checksum);
    printf(" Status:       %s (Max Diff vs Baseline: %.2e)\n",
           res->is_valid ? "PASS (Verified)" : "FAIL", res->max_diff);
    printf("------------------------------------------------------------\n");
}

bool validate_dimension(int dim) {
    if (dim < MIN_ALLOWED_DIM || dim > MAX_ALLOWED_DIM) {
        fprintf(stderr, "[Validation Error] Dimension %d out of allowed range [%d, %d]\n",
                dim, MIN_ALLOWED_DIM, MAX_ALLOWED_DIM);
        return false;
    }
    return true;
}

bool validate_threads(int threads) {
    if (threads < 1 || threads > 256) {
        fprintf(stderr, "[Validation Error] Thread count %d out of allowed range [1, 256]\n", threads);
        return false;
    }
    return true;
}
