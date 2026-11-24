import unittest
import urllib.request
import json
import sqlite3
import time
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = Path(__file__).resolve().parent.parent / "app" / "data" / "parallelx.db"

class TestParallelXAuditPhase8(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Verify server is reachable
        try:
            res = urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=5)
            assert res.status == 200
        except Exception as e:
            raise RuntimeError(f"FastAPI backend is not running at {BASE_URL}: {e}")

    def _post(self, path: str, payload: dict) -> dict:
        req = urllib.request.Request(
            f"{BASE_URL}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req, timeout=30)
        return json.loads(res.read().decode("utf-8"))

    def _get(self, path: str) -> dict:
        res = urllib.request.urlopen(f"{BASE_URL}{path}", timeout=30)
        return json.loads(res.read().decode("utf-8"))

    # TEST 1: System Info & Hardware Detection
    def test_01_system_info(self):
        data = self._get("/api/system/info")
        self.assertIn("cpu", data)
        self.assertGreater(data["cpu"]["logical_cores"], 0)
        self.assertIn("gcc_version", data)
        self.assertTrue(data["openmp_supported"])
        print(f"  [PASS] System info verified: {data['cpu']['logical_cores']} cores, GCC: {data['gcc_version']}")

    # TEST 2: C Engine Status & Verification
    def test_02_engine_status(self):
        data = self._get("/api/engine/status")
        self.assertTrue(data["engine_ready"])
        print(f"  [PASS] C OpenMP computational engine verified and ready.")

    # TEST 3: Physical Benchmark Execution (C OpenMP via FastAPI)
    def test_03_run_experiment(self):
        payload = {
            "matrix_size": 200,
            "threads": 4,
            "scheduling": "guided",
            "chunk_size": 16,
            "repetitions": 2,
            "run_sequential": True
        }
        res = self._post("/api/experiments/run", payload)
        self.assertIn("id", res)
        exp_id = res["id"]

        # Wait for experiment to complete (up to 30s)
        for _ in range(40):
            exp = self._get(f"/api/experiments/{exp_id}")
            if exp["status"] in ["completed", "failed"]:
                break
            time.sleep(0.5)

        self.assertEqual(exp["status"], "completed", f"Experiment failed: {exp.get('error_message')}")
        self.assertGreater(exp["parallel_time_ms"], 0)
        self.assertGreater(exp["speedup"], 0)
        self.assertTrue(exp["is_valid"])
        print(f"  [PASS] Physical execution {exp_id}: Time={exp['parallel_time_ms']:.2f}ms, Speedup={exp['speedup']:.2f}x")

    # TEST 4: SQLite Database Persistence
    def test_04_sqlite_persistence(self):
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM experiments")
        exp_count = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM experiment_runs")
        run_count = c.fetchone()[0]
        conn.close()

        self.assertGreater(exp_count, 50, "Expected at least 50 experiments in SQLite")
        self.assertGreater(run_count, 100, "Expected at least 100 individual repetition runs in SQLite")
        print(f"  [PASS] SQLite persistence: {exp_count} experiments, {run_count} repetition runs verified.")

    # TEST 5: Mathematical Consistency Formulations
    def test_05_mathematical_consistency(self):
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT matrix_size, threads, mean_time_ms, sequential_baseline_time_ms, speedup, efficiency, throughput_gflops
            FROM experiments
            WHERE mean_time_ms > 0 AND sequential_baseline_time_ms > 0 AND threads > 0
            LIMIT 20
        """)
        rows = [dict(r) for r in c.fetchall()]
        conn.close()

        for r in rows:
            expected_speedup = r["sequential_baseline_time_ms"] / r["mean_time_ms"]
            self.assertAlmostEqual(r["speedup"], expected_speedup, delta=0.05)

            expected_efficiency = (r["speedup"] / r["threads"]) * 100.0
            self.assertAlmostEqual(r["efficiency"], expected_efficiency, delta=0.5)

            expected_flops = 2.0 * (r["matrix_size"] ** 3)
            expected_gflops = expected_flops / (r["mean_time_ms"] * 1e6)
            self.assertAlmostEqual(r["throughput_gflops"], expected_gflops, delta=0.5)

        print(f"  [PASS] Mathematical identities for Speedup, Efficiency, and GFLOPS verified across 20 records.")

    # TEST 6: AI Model Retraining & Candidate Model Evaluation
    def test_06_ml_model_training(self):
        res = self._post("/api/ml/train", {})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["best_model"], "Random Forest")
        self.assertIn("comparison", res)
        self.assertIn("Random Forest", res["comparison"])
        self.assertIn("Linear Regression", res["comparison"])
        self.assertIn("Decision Tree", res["comparison"])
        rf_metrics = res["comparison"]["Random Forest"]
        self.assertGreater(rf_metrics["cv_r2"], 0.7)
        print(f"  [PASS] ML Candidate Models Evaluated: Random Forest winner with CV R²={rf_metrics['cv_r2']:.4f}")

    # TEST 7: AI Performance Prediction
    def test_07_ml_prediction(self):
        pred = self._post("/api/ml/predict", {
            "matrix_size": 1000,
            "threads": 8,
            "scheduling": "guided",
            "chunk_size": 16
        })
        self.assertGreater(pred["predicted_time_ms"], 0)
        self.assertGreater(pred["predicted_speedup"], 0)
        self.assertGreater(pred["predicted_efficiency"], 0)
        self.assertIn("confidence_interval_ms", pred)
        print(f"  [PASS] AI Prediction (1000x1000, 8T guided): Latency={pred['predicted_time_ms']}ms, Speedup={pred['predicted_speedup']}x")

    # TEST 8: Objective-Based AI Recommendations
    def test_08_ml_recommendations(self):
        for obj in ["min_time", "max_speedup", "high_efficiency", "balanced"]:
            rec = self._post("/api/ml/recommend-objective", {
                "matrix_size": 500,
                "objective": obj
            })
            self.assertIn("recommended", rec)
            self.assertIn("alternatives", rec)
            self.assertIn("explanation", rec)
            r = rec["recommended"]
            self.assertGreater(r["threads"], 0)
            self.assertGreater(r["predicted_speedup"], 0)
            print(f"  [PASS] Recommendation for '{obj}': {r['threads']}T {r['scheduling']} (Speedup={r['predicted_speedup']}x)")

    # TEST 9: End-to-End AI Execution & Prediction Validation
    def test_09_execute_recommended_and_validate(self):
        payload = {
            "matrix_size": 250,
            "threads": 4,
            "scheduling": "static",
            "chunk_size": 16,
            "objective": "balanced",
            "predicted_time_ms": 3.5,
            "predicted_speedup": 2.2,
            "predicted_efficiency": 55.0
        }
        res = self._post("/api/ml/execute-recommended", payload)
        self.assertEqual(res["status"], "completed")
        self.assertGreater(res["actual_time_ms"], 0)
        self.assertIn("error_percent", res)
        print(f"  [PASS] Recommended execution validated: Act={res['actual_time_ms']}ms vs Pred={res['predicted_time_ms']}ms (Err: {res['error_percent']}%)")

    # TEST 10: Downloadable CSV Export
    def test_10_csv_export(self):
        res = urllib.request.urlopen(f"{BASE_URL}/api/reports/download.csv", timeout=10)
        self.assertEqual(res.status, 200)
        csv_text = res.read().decode("utf-8")
        lines = csv_text.splitlines()
        self.assertGreater(len(lines), 50)
        self.assertIn("experiment_id", lines[0])
        print(f"  [PASS] CSV export verified: {len(lines)} benchmark rows streamed.")

    # TEST 11: Publication-Grade PDF Report Generation
    def test_11_pdf_report_generation(self):
        res = urllib.request.urlopen(f"{BASE_URL}/api/reports/download.pdf", timeout=15)
        self.assertEqual(res.status, 200)
        self.assertEqual(res.headers.get("Content-Type"), "application/pdf")
        pdf_bytes = res.read()
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertGreater(len(pdf_bytes), 50000, "PDF should be a full multi-page document")
        print(f"  [PASS] PDF report generated successfully: {len(pdf_bytes)} bytes.")

if __name__ == "__main__":
    unittest.main()
