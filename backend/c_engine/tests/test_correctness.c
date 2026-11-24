#define NO_MAIN_ENTRY
#include "../include/matrix_common.h"
#include <assert.h>

extern void multiply_matrix_seq(const Matrix *A, const Matrix *B, Matrix *C);
extern void multiply_matrix_omp_static(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size);
extern void multiply_matrix_omp_dynamic(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size);
extern void multiply_matrix_omp_guided(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size);

static int tests_passed = 0;
static int tests_failed = 0;

#define TEST_ASSERT(cond, msg) do { \
    if (cond) { \
        printf("  [PASS] %s\n", msg); \
        tests_passed++; \
    } else { \
        printf("  [FAIL] %s\n", msg); \
        tests_failed++; \
    } \
} while(0)

void test_matrix_lifecycle(void) {
    printf("\n=== Testing Matrix Lifecycle & Memory Allocation ===\n");
    Matrix *m = matrix_allocate(64, 64);
    TEST_ASSERT(m != NULL, "Allocation of 64x64 matrix succeeded");
    TEST_ASSERT(m->rows == 64 && m->cols == 64, "Matrix row and column dimensions match");
    TEST_ASSERT(m->data != NULL && m->rows_ptr != NULL, "Internal data buffers allocated");

    matrix_init_deterministic(m, 123);
    double cs1 = matrix_compute_checksum(m);
    TEST_ASSERT(cs1 > 0.0, "Checksum of initialized matrix is non-zero");

    /* Test deterministic repeatability */
    Matrix *m2 = matrix_allocate(64, 64);
    matrix_init_deterministic(m2, 123);
    double max_diff = 0.0;
    bool identical = matrix_verify_equal(m, m2, 1e-12, &max_diff);
    TEST_ASSERT(identical && max_diff == 0.0, "Deterministic initialization generates identical values for same seed");

    matrix_zero(m2);
    double cs_zero = matrix_compute_checksum(m2);
    TEST_ASSERT(cs_zero == 0.0, "matrix_zero clears all elements to 0.0");

    matrix_free(m);
    matrix_free(m2);
}

void test_bounds_and_error_handling(void) {
    printf("\n=== Testing Input Validation and Bounds Checking ===\n");
    TEST_ASSERT(!validate_dimension(1), "Dimension 1 rejected (< MIN_ALLOWED_DIM 2)");
    TEST_ASSERT(!validate_dimension(5000), "Dimension 5000 rejected (> MAX_ALLOWED_DIM 4096)");
    TEST_ASSERT(validate_dimension(100), "Dimension 100 accepted");
    TEST_ASSERT(validate_dimension(2000), "Dimension 2000 accepted");

    TEST_ASSERT(!validate_threads(0), "Thread count 0 rejected");
    TEST_ASSERT(!validate_threads(-4), "Negative thread count rejected");
    TEST_ASSERT(!validate_threads(500), "Thread count 500 rejected (> 256)");
    TEST_ASSERT(validate_threads(1), "Thread count 1 accepted");
    TEST_ASSERT(validate_threads(16), "Thread count 16 accepted");

    Matrix *null_dim = matrix_allocate(-10, 50);
    TEST_ASSERT(null_dim == NULL, "matrix_allocate returns NULL for invalid dimensions");
}

void test_numerical_correctness(int size, int threads) {
    printf("\n=== Testing Numerical Correctness (Size %dx%d, %d Threads) ===\n", size, size, threads);
    Matrix *A = matrix_allocate(size, size);
    Matrix *B = matrix_allocate(size, size);
    Matrix *C_seq = matrix_allocate(size, size);
    Matrix *C_static = matrix_allocate(size, size);
    Matrix *C_dynamic = matrix_allocate(size, size);
    Matrix *C_guided = matrix_allocate(size, size);

    matrix_init_deterministic(A, 42);
    matrix_init_deterministic(B, 99);

    /* Run sequential */
    matrix_zero(C_seq);
    multiply_matrix_seq(A, B, C_seq);

    /* Run static */
    matrix_zero(C_static);
    multiply_matrix_omp_static(A, B, C_static, threads, 16);
    double diff_static = 0.0;
    bool pass_static = matrix_verify_equal(C_seq, C_static, VERIFY_EPSILON, &diff_static);
    TEST_ASSERT(pass_static, "OpenMP Static results match Sequential baseline exactly");

    /* Run dynamic */
    matrix_zero(C_dynamic);
    multiply_matrix_omp_dynamic(A, B, C_dynamic, threads, 16);
    double diff_dynamic = 0.0;
    bool pass_dynamic = matrix_verify_equal(C_seq, C_dynamic, VERIFY_EPSILON, &diff_dynamic);
    TEST_ASSERT(pass_dynamic, "OpenMP Dynamic results match Sequential baseline exactly");

    /* Run guided */
    matrix_zero(C_guided);
    multiply_matrix_omp_guided(A, B, C_guided, threads, 16);
    double diff_guided = 0.0;
    bool pass_guided = matrix_verify_equal(C_seq, C_guided, VERIFY_EPSILON, &diff_guided);
    TEST_ASSERT(pass_guided, "OpenMP Guided results match Sequential baseline exactly");

    matrix_free(A);
    matrix_free(B);
    matrix_free(C_seq);
    matrix_free(C_static);
    matrix_free(C_dynamic);
    matrix_free(C_guided);
}

int main(void) {
    printf("=========================================================\n");
    printf(" PARALLELX — C Engine Unit & Correctness Test Suite\n");
    printf("=========================================================\n");

    test_matrix_lifecycle();
    test_bounds_and_error_handling();
    test_numerical_correctness(50, 4);
    test_numerical_correctness(200, 8);

    printf("\n=========================================================\n");
    printf(" Test Results: %d Passed, %d Failed\n", tests_passed, tests_failed);
    printf("=========================================================\n");

    return (tests_failed == 0) ? 0 : 1;
}
