import io
import csv
from typing import List, Dict, Any, Optional
from ..database import get_connection

class AnalyticsService:
    @staticmethod
    def get_summary_stats() -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM experiments")
        total_exps = cursor.fetchone()[0]

        cursor.execute("SELECT MAX(speedup), AVG(speedup), AVG(efficiency), MAX(throughput_gflops) FROM experiments WHERE speedup > 0")
        row = cursor.fetchone()
        best_speedup = round(row[0] or 0.0, 2)
        avg_speedup = round(row[1] or 0.0, 2)
        avg_efficiency = round(row[2] or 0.0, 1)
        peak_gflops = round(row[3] or 0.0, 2)

        cursor.execute("SELECT DISTINCT matrix_size FROM experiments ORDER BY matrix_size")
        sizes = [r[0] for r in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT threads FROM experiments ORDER BY threads")
        threads = [r[0] for r in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT scheduling FROM experiments WHERE scheduling != 'none'")
        strategies = [r[0] for r in cursor.fetchall()]

        cursor.execute("SELECT AVG(cpu_utilization_percent), AVG(sync_overhead_ms) FROM experiments")
        perf_row = cursor.fetchone()
        avg_cpu = round(perf_row[0] or 0.0, 1)
        avg_sync = round(perf_row[1] or 0.0, 2)

        conn.close()
        return {
            "total_experiments": total_exps,
            "best_speedup": best_speedup,
            "avg_speedup": avg_speedup,
            "avg_efficiency": avg_efficiency,
            "peak_gflops": peak_gflops,
            "avg_cpu_utilization": avg_cpu,
            "avg_sync_overhead_ms": avg_sync,
            "available_sizes": sizes,
            "available_threads": threads,
            "available_strategies": strategies,
        }

    @staticmethod
    def get_curves(matrix_size: Optional[int] = None, scheduling: Optional[str] = None) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()

        # If size not specified, pick largest or most common size
        if matrix_size is None:
            cursor.execute("SELECT matrix_size FROM experiments GROUP BY matrix_size ORDER BY COUNT(*) DESC LIMIT 1")
            row = cursor.fetchone()
            matrix_size = row[0] if row else 500

        query = """
            SELECT threads, scheduling, chunk_size, mean_time_ms, speedup, efficiency,
                   cpu_utilization_percent, throughput_gflops, sync_overhead_ms
            FROM experiments
            WHERE matrix_size = ?
        """
        params = [matrix_size]
        if scheduling and scheduling != 'all':
            query += " AND scheduling = ?"
            params.append(scheduling)
        query += " ORDER BY threads ASC, scheduling ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        speedup_curve = []
        efficiency_curve = []
        time_curve = []
        cpu_curve = []
        sync_curve = []

        for r in rows:
            entry = {
                "threads": r["threads"],
                "scheduling": r["scheduling"],
                "chunk_size": r["chunk_size"],
                "time_ms": round(r["mean_time_ms"], 2),
                "speedup": round(r["speedup"], 2),
                "ideal_speedup": r["threads"],
                "efficiency": round(r["efficiency"], 1),
                "cpu_utilization": round(r["cpu_utilization_percent"], 1),
                "gflops": round(r["throughput_gflops"], 2),
                "sync_overhead_ms": round(r["sync_overhead_ms"], 2),
            }
            speedup_curve.append(entry)
            efficiency_curve.append(entry)
            time_curve.append(entry)
            cpu_curve.append(entry)
            sync_curve.append(entry)

        # Strategy Comparison
        cursor.execute("""
            SELECT scheduling, AVG(speedup) as avg_speedup, AVG(mean_time_ms) as avg_time,
                   AVG(efficiency) as avg_eff, AVG(sync_overhead_ms) as avg_sync,
                   AVG(cpu_utilization_percent) as avg_cpu
            FROM experiments
            WHERE matrix_size = ? AND scheduling != 'none'
            GROUP BY scheduling
        """, (matrix_size,))
        strategy_comp = [dict(r) for r in cursor.fetchall()]

        # Matrix Size Comparison
        cursor.execute("""
            SELECT matrix_size, MAX(speedup) as max_speedup, MIN(mean_time_ms) as min_time,
                   AVG(throughput_gflops) as avg_gflops
            FROM experiments
            GROUP BY matrix_size
            ORDER BY matrix_size ASC
        """)
        size_comp = [dict(r) for r in cursor.fetchall()]

        conn.close()
        return {
            "selected_matrix_size": matrix_size,
            "speedup_curve": speedup_curve,
            "efficiency_curve": efficiency_curve,
            "time_curve": time_curve,
            "cpu_curve": cpu_curve,
            "sync_curve": sync_curve,
            "strategy_comparison": strategy_comp,
            "matrix_size_comparison": size_comp,
        }

    @staticmethod
    def get_raw_records(limit: int = 100) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM experiments ORDER BY created_at DESC LIMIT ?", (limit,))
        records = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return records

    @staticmethod
    def generate_csv_export() -> str:
        """Generates comprehensive CSV export from SQLite."""
        conn = get_connection()
        cursor = conn.cursor()

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "experiment_id",
            "workload",
            "matrix_size",
            "threads",
            "scheduling",
            "chunk_size",
            "repetitions",
            "warmup_runs",
            "mean_time_ms",
            "std_dev_time_ms",
            "min_time_ms",
            "max_time_ms",
            "sequential_baseline_time_ms",
            "speedup",
            "efficiency_percent",
            "cpu_utilization_percent",
            "throughput_gflops",
            "sync_overhead_ms",
            "checksum",
            "is_valid",
            "max_diff",
            "created_at",
        ])

        cursor.execute("SELECT * FROM experiments ORDER BY matrix_size ASC, threads ASC, scheduling ASC")
        for row in cursor.fetchall():
            writer.writerow([
                row["id"],
                row["workload"],
                row["matrix_size"],
                row["threads"],
                row["scheduling"],
                row["chunk_size"],
                row["repetitions"],
                row["warmup_runs"],
                row["mean_time_ms"],
                row["std_dev_time_ms"],
                row["min_time_ms"],
                row["max_time_ms"],
                row["sequential_baseline_time_ms"],
                row["speedup"],
                row["efficiency"],
                row["cpu_utilization_percent"],
                row["throughput_gflops"],
                row["sync_overhead_ms"],
                row["checksum"],
                bool(row["is_valid"]),
                row["max_diff"],
                row["created_at"],
            ])

        conn.close()
        return output.getvalue()
