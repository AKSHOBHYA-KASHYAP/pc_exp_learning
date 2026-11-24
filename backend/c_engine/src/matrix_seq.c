#include "../include/matrix_common.h"

void multiply_matrix_seq(const Matrix *A, const Matrix *B, Matrix *C) {
    int n = A->rows;
    double **a = A->rows_ptr;
    double **b = B->rows_ptr;
    double **c = C->rows_ptr;

    for (int i = 0; i < n; i++) {
        for (int k = 0; k < n; k++) {
            double r = a[i][k];
            for (int j = 0; j < n; j++) {
                c[i][j] += r * b[k][j];
            }
        }
    }
}

#ifdef STANDALONE_BUILD
int main(int argc, char *argv[]) {
    int n = 500;
    int repetitions = 1;
    bool output_json = false;

    if (argc > 1) {
        if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            printf("Usage: %s [matrix_size] [repetitions] [--json]\n", argv[0]);
            printf("Example: %s 500 3 --json\n", argv[0]);
            return 0;
        }
        n = atoi(argv[1]);
    }
    if (argc > 2) {
        repetitions = atoi(argv[2]);
    }
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--json") == 0) output_json = true;
    }

    if (!validate_dimension(n) || repetitions < 1) {
        return 1;
    }

    /* Initialize Matrices */
    double t_init_start = get_wtime();
    Matrix *A = matrix_allocate(n, n);
    Matrix *B = matrix_allocate(n, n);
    Matrix *C = matrix_allocate(n, n);

    if (!A || !B || !C) {
        matrix_free(A);
        matrix_free(B);
        matrix_free(C);
        return 1;
    }

    matrix_init_deterministic(A, 42);
    matrix_init_deterministic(B, 99);
    matrix_zero(C);
    double t_init_end = get_wtime();

    /* Benchmark Loop */
    double total_compute_time = 0.0;
    for (int r = 0; r < repetitions; r++) {
        matrix_zero(C);
        double t_start = get_wtime();
        multiply_matrix_seq(A, B, C);
        double t_end = get_wtime();
        total_compute_time += (t_end - t_start);
    }

    double avg_compute_time = total_compute_time / (double)repetitions;
    double gflops = calculate_gflops(n, avg_compute_time);
    double checksum = matrix_compute_checksum(C);

    BenchmarkResult res = {
        .method_name = "Sequential (Single-threaded)",
        .size = n,
        .threads = 1,
        .chunk_size = 0,
        .repetitions = repetitions,
        .init_time_sec = t_init_end - t_init_start,
        .compute_time_sec = avg_compute_time,
        .gflops = gflops,
        .checksum = checksum,
        .is_valid = true,
        .max_diff = 0.0,
    };

    if (output_json) {
        print_benchmark_json(&res);
    } else {
        print_benchmark_human(&res);
    }

    matrix_free(A);
    matrix_free(B);
    matrix_free(C);
    return 0;
}
#endif
