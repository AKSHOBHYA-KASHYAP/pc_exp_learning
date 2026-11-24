import sqlite3
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_PATH = Path(__file__).resolve().parent / "data" / "parallelx.db"

def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite schema for storing aggregate experiments and individual runs."""
    conn = get_connection()
    cursor = conn.cursor()

    # Table 1: Aggregate Experiment Summary
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        workload TEXT NOT NULL,
        matrix_size INTEGER NOT NULL,
        threads INTEGER NOT NULL,
        scheduling TEXT NOT NULL,
        chunk_size INTEGER NOT NULL,
        repetitions INTEGER NOT NULL,
        warmup_runs INTEGER NOT NULL,
        mean_time_ms REAL NOT NULL,
        std_dev_time_ms REAL NOT NULL,
        min_time_ms REAL NOT NULL,
        max_time_ms REAL NOT NULL,
        sequential_baseline_time_ms REAL NOT NULL,
        speedup REAL NOT NULL,
        efficiency REAL NOT NULL,
        cpu_utilization_percent REAL NOT NULL,
        throughput_gflops REAL NOT NULL,
        sync_overhead_ms REAL NOT NULL,
        checksum REAL NOT NULL,
        is_valid INTEGER NOT NULL,
        max_diff REAL NOT NULL,
        created_at TEXT NOT NULL,
        notes TEXT
    )
    """)

    # Table 2: Individual Run Repetitions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS experiment_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experiment_id TEXT NOT NULL,
        run_number INTEGER NOT NULL,
        is_warmup INTEGER NOT NULL,
        time_ms REAL NOT NULL,
        cpu_utilization_percent REAL NOT NULL,
        checksum REAL NOT NULL,
        is_valid INTEGER NOT NULL,
        FOREIGN KEY(experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    )
    """)

    # Table 3: Phase 6 Prediction Validations (Predicted vs Actual Records)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prediction_validations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experiment_id TEXT,
        matrix_size INTEGER NOT NULL,
        threads INTEGER NOT NULL,
        scheduling TEXT NOT NULL,
        chunk_size INTEGER NOT NULL,
        optimization_objective TEXT NOT NULL,
        predicted_time_ms REAL NOT NULL,
        actual_time_ms REAL NOT NULL,
        predicted_speedup REAL NOT NULL,
        actual_speedup REAL NOT NULL,
        predicted_efficiency REAL NOT NULL,
        actual_efficiency REAL NOT NULL,
        error_percent REAL NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Indexes for fast querying in analytics
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_exp_size_threads ON experiments(matrix_size, threads)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_exp_scheduling ON experiments(scheduling)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_runs_exp_id ON experiment_runs(experiment_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pred_val_exp ON prediction_validations(experiment_id)")

    conn.commit()
    conn.close()

init_db()
