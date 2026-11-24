#define NO_MAIN_ENTRY
#include "../include/matrix_common.h"

extern void multiply_matrix_seq(const Matrix *A, const Matrix *B, Matrix *C);
extern void multiply_matrix_omp_static(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size);
extern void multiply_matrix_omp_dynamic(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size);
extern void multiply_matrix_omp_guided(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size);

#define MAX_RUNS 32

typedef struct {
    const char *name;
    const char *scheduling;
    int threads;
    int chunk_size;
    int repetitions;
    double run_times_ms[MAX_RUNS];
    double mean_time_ms;
    double std_dev_ms;
    double min_time_ms;
    double max_time_ms;
    double speedup;
    double efficiency;
    double gflops;
    double sync_wait_ms;
    double checksum;
    bool is_valid;
    double max_diff;
} DetailedRunStats;

static void compute_stats(const double *times, int n, double *mean, double *std_dev, double *min_v, double *max_v) {
    if (n <= 0) return;
    double sum = 0.0;
    double min_t = 1e9;
    double max_t = -1e9;

    for (int i = 0; i < n; i++) {
        sum += times[i];
        if (times[i] < min_t) min_t = times[i];
        if (times[i] > max_t) max_t = times[i];
    }
    *mean = sum / (double)n;
    *min_v = min_t;
    *max_v = max_t;

    double var = 0.0;
    for (int i = 0; i < n; i++) {
        var += (times[i] - *mean) * (times[i] - *mean);
    }
    *std_dev = (n > 1) ? sqrt(var / (double)(n - 1)) : 0.0;
}

/* Measure per-thread wall times to calculate barrier waiting time / load imbalance */
static double measure_sync_overhead(const Matrix *A, const Matrix *B, Matrix *C, int threads, int chunk_size, const char *strategy) {
    if (threads <= 1) return 0.0;
    
    double thread_durations[256];
    int n = A->rows;
    double **a = A->rows_ptr;
    double **b = B->rows_ptr;
    double **c = C->rows_ptr;

    for (int i = 0; i < 256; i++) thread_durations[i] = 0.0;

    if (strcmp(strategy, "static") == 0) {
        #pragma omp parallel num_threads(threads) default(none) shared(a, b, c, n, chunk_size, thread_durations)
        {
            int tid = omp_get_thread_num();
            double t0 = omp_get_wtime();
            #pragma omp for schedule(static, chunk_size) nowait
            for (int i = 0; i < n; i++) {
                for (int k = 0; k < n; k++) {
                    double r = a[i][k];
                    for (int j = 0; j < n; j++) c[i][j] += r * b[k][j];
                }
            }
            double t1 = omp_get_wtime();
            if (tid < 256) thread_durations[tid] = t1 - t0;
        }
    } else if (strcmp(strategy, "dynamic") == 0) {
        #pragma omp parallel num_threads(threads) default(none) shared(a, b, c, n, chunk_size, thread_durations)
        {
            int tid = omp_get_thread_num();
            double t0 = omp_get_wtime();
            #pragma omp for schedule(dynamic, chunk_size) nowait
            for (int i = 0; i < n; i++) {
                for (int k = 0; k < n; k++) {
                    double r = a[i][k];
                    for (int j = 0; j < n; j++) c[i][j] += r * b[k][j];
                }
            }
            double t1 = omp_get_wtime();
            if (tid < 256) thread_durations[tid] = t1 - t0;
        }
    } else {
        #pragma omp parallel num_threads(threads) default(none) shared(a, b, c, n, chunk_size, thread_durations)
        {
            int tid = omp_get_thread_num();
            double t0 = omp_get_wtime();
            #pragma omp for schedule(guided, chunk_size) nowait
            for (int i = 0; i < n; i++) {
                for (int k = 0; k < n; k++) {
                    double r = a[i][k];
                    for (int j = 0; j < n; j++) c[i][j] += r * b[k][j];
                }
            }
            double t1 = omp_get_wtime();
            if (tid < 256) thread_durations[tid] = t1 - t0;
        }
    }

    double max_t = 0.0;
    double min_t = 1e9;
    for (int t = 0; t < threads; t++) {
        if (thread_durations[t] > max_t) max_t = thread_durations[t];
        if (thread_durations[t] < min_t) min_t = thread_durations[t];
    }
    return (max_t - min_t) * 1000.0; /* in ms */
}

int main(int argc, char *argv[]) {
    int n = 500;
    int threads = 4;
    int chunk_size = DEFAULT_CHUNK_SIZE;
    int repetitions = 5;  /* Default 5 repetitions for reliable statistics */
    int warmup_runs = 1;  /* 1 warmup run separated from measurement */
    bool output_json = false;

#ifdef _OPENMP
    threads = omp_get_max_threads();
#endif

    if (argc > 1) {
        if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0) {
            printf("Usage: %s [matrix_size] [threads] [chunk_size] [repetitions] [warmup_runs] [--json]\n", argv[0]);
            return 0;
        }
        n = atoi(argv[1]);
    }
    if (argc > 2) threads = atoi(argv[2]);
    if (argc > 3) chunk_size = atoi(argv[3]);
    if (argc > 4) repetitions = atoi(argv[4]);
    if (argc > 5 && argv[5][0] != '-') warmup_runs = atoi(argv[5]);

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--json") == 0) output_json = true;
    }

    if (!validate_dimension(n) || !validate_threads(threads) || repetitions < 1) {
        return 1;
    }
    if (repetitions > MAX_RUNS) repetitions = MAX_RUNS;

    Matrix *A = matrix_allocate(n, n);
    Matrix *B = matrix_allocate(n, n);
    Matrix *C_seq = matrix_allocate(n, n);
    Matrix *C_test = matrix_allocate(n, n);

    if (!A || !B || !C_seq || !C_test) {
        matrix_free(A);
        matrix_free(B);
        matrix_free(C_seq);
        matrix_free(C_test);
        return 1;
    }

    matrix_init_deterministic(A, 42);
    matrix_init_deterministic(B, 99);

    DetailedRunStats stats[4];

    /* 1. Sequential Baseline */
    {
        /* Warmup run */
        for (int w = 0; w < warmup_runs; w++) {
            matrix_zero(C_seq);
            multiply_matrix_seq(A, B, C_seq);
        }

        double times[MAX_RUNS];
        for (int r = 0; r < repetitions; r++) {
            matrix_zero(C_seq);
            double t0 = get_wtime();
            multiply_matrix_seq(A, B, C_seq);
            double t1 = get_wtime();
            times[r] = (t1 - t0) * 1000.0;
        }

        double mean, std_dev, min_v, max_v;
        compute_stats(times, repetitions, &mean, &std_dev, &min_v, &max_v);

        stats[0].name = "Sequential Baseline";
        stats[0].scheduling = "none";
        stats[0].threads = 1;
        stats[0].chunk_size = 0;
        stats[0].repetitions = repetitions;
        for (int r = 0; r < repetitions; r++) stats[0].run_times_ms[r] = times[r];
        stats[0].mean_time_ms = mean;
        stats[0].std_dev_ms = std_dev;
        stats[0].min_time_ms = min_v;
        stats[0].max_time_ms = max_v;
        stats[0].speedup = 1.0;
        stats[0].efficiency = 100.0;
        stats[0].gflops = calculate_gflops(n, mean / 1000.0);
        stats[0].sync_wait_ms = 0.0;
        stats[0].checksum = matrix_compute_checksum(C_seq);
        stats[0].is_valid = true;
        stats[0].max_diff = 0.0;
    }

    double baseline_mean = stats[0].mean_time_ms;

    /* Helper macro for parallel testing */
    #define RUN_PARALLEL(idx, str_name, sched_str, func_call) do { \
        for (int w = 0; w < warmup_runs; w++) { \
            matrix_zero(C_test); \
            func_call; \
        } \
        double times[MAX_RUNS]; \
        for (int r = 0; r < repetitions; r++) { \
            matrix_zero(C_test); \
            double t0 = get_wtime(); \
            func_call; \
            double t1 = get_wtime(); \
            times[r] = (t1 - t0) * 1000.0; \
        } \
        double mean, std_dev, min_v, max_v; \
        compute_stats(times, repetitions, &mean, &std_dev, &min_v, &max_v); \
        double max_diff = 0.0; \
        bool valid = matrix_verify_equal(C_seq, C_test, VERIFY_EPSILON, &max_diff); \
        double speedup = baseline_mean / mean; \
        double sync_wait = measure_sync_overhead(A, B, C_test, threads, chunk_size, sched_str); \
        stats[idx].name = str_name; \
        stats[idx].scheduling = sched_str; \
        stats[idx].threads = threads; \
        stats[idx].chunk_size = chunk_size; \
        stats[idx].repetitions = repetitions; \
        for (int r = 0; r < repetitions; r++) stats[idx].run_times_ms[r] = times[r]; \
        stats[idx].mean_time_ms = mean; \
        stats[idx].std_dev_ms = std_dev; \
        stats[idx].min_time_ms = min_v; \
        stats[idx].max_time_ms = max_v; \
        stats[idx].speedup = speedup; \
        stats[idx].efficiency = (speedup / (double)threads) * 100.0; \
        stats[idx].gflops = calculate_gflops(n, mean / 1000.0); \
        stats[idx].sync_wait_ms = sync_wait; \
        stats[idx].checksum = matrix_compute_checksum(C_test); \
        stats[idx].is_valid = valid; \
        stats[idx].max_diff = max_diff; \
    } while (0)

    RUN_PARALLEL(1, "OpenMP Static", "static", multiply_matrix_omp_static(A, B, C_test, threads, chunk_size));
    RUN_PARALLEL(2, "OpenMP Dynamic", "dynamic", multiply_matrix_omp_dynamic(A, B, C_test, threads, chunk_size));
    RUN_PARALLEL(3, "OpenMP Guided", "guided", multiply_matrix_omp_guided(A, B, C_test, threads, chunk_size));

    if (output_json) {
        printf("{\n");
        printf("  \"matrix_size\": %d,\n", n);
        printf("  \"threads\": %d,\n", threads);
        printf("  \"chunk_size\": %d,\n", chunk_size);
        printf("  \"repetitions\": %d,\n", repetitions);
        printf("  \"warmup_runs\": %d,\n", warmup_runs);
        printf("  \"benchmarks\": [\n");
        for (int i = 0; i < 4; i++) {
            printf("    {\n");
            printf("      \"name\": \"%s\",\n", stats[i].name);
            printf("      \"scheduling\": \"%s\",\n", stats[i].scheduling);
            printf("      \"threads\": %d,\n", stats[i].threads);
            printf("      \"time_ms\": %.3f,\n", stats[i].mean_time_ms);
            printf("      \"mean_time_ms\": %.3f,\n", stats[i].mean_time_ms);
            printf("      \"std_dev_ms\": %.3f,\n", stats[i].std_dev_ms);
            printf("      \"min_time_ms\": %.3f,\n", stats[i].min_time_ms);
            printf("      \"max_time_ms\": %.3f,\n", stats[i].max_time_ms);
            printf("      \"speedup\": %.2f,\n", stats[i].speedup);
            printf("      \"efficiency\": %.2f,\n", stats[i].efficiency);
            printf("      \"gflops\": %.3f,\n", stats[i].gflops);
            printf("      \"sync_wait_ms\": %.3f,\n", stats[i].sync_wait_ms);
            printf("      \"checksum\": %.4f,\n", stats[i].checksum);
            printf("      \"is_valid\": %s,\n", stats[i].is_valid ? "true" : "false");
            printf("      \"max_diff\": %.9e,\n", stats[i].max_diff);
            printf("      \"individual_runs\": [");
            for (int r = 0; r < repetitions; r++) {
                printf("%.2f%s", stats[i].run_times_ms[r], (r == repetitions - 1) ? "" : ", ");
            }
            printf("]\n");
            printf("    }%s\n", (i == 3) ? "" : ",");
        }
        printf("  ]\n");
        printf("}\n");
    } else {
        printf("========================================================================================================\n");
        printf(" PARALLELX — Multi-Run Benchmark Summary (%d Warmup, %d Repetitions)\n", warmup_runs, repetitions);
        printf(" Matrix Size: %d x %d | Threads: %d | Chunk: %d\n", n, n, threads, chunk_size);
        printf("========================================================================================================\n");
        printf("%-20s | %-7s | %-12s | %-10s | %-8s | %-10s | %-10s | %-6s\n",
               "Strategy", "Threads", "Mean Time(ms)", "Std Dev", "Speedup", "Efficiency", "Sync Wait", "Status");
        printf("--------------------------------------------------------------------------------------------------------\n");
        for (int i = 0; i < 4; i++) {
            printf("%-20s | %-7d | %-12.2f | ±%-8.2f | %-8.2fx | %-9.1f%% | %-8.2fms | %-6s\n",
                   stats[i].name,
                   stats[i].threads,
                   stats[i].mean_time_ms,
                   stats[i].std_dev_ms,
                   stats[i].speedup,
                   stats[i].efficiency,
                   stats[i].sync_wait_ms,
                   stats[i].is_valid ? "PASS" : "FAIL");
        }
        printf("========================================================================================================\n\n");
    }

    matrix_free(A);
    matrix_free(B);
    matrix_free(C_seq);
    matrix_free(C_test);
    return 0;
}
