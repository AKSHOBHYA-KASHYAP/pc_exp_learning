# ParallelX — Intelligent Parallel Computing & Scalability Analyzer
**Team 7 · Case Study 7: Parallel Program Scalability**
*(AI + OpenMP + C + Python + React)*

ParallelX is an intelligent parallel computing and scalability analysis platform designed with an Apple iOS/macOS-inspired frosted glass interface. The platform bridges low-level C99 multi-threaded computing with high-level AI predictive modeling. Users can configure computational workloads, run real multi-threaded OpenMP benchmarks on an Ubuntu GCC execution engine, analyze scalability limits against Amdahl's Law, and obtain machine learning-guided recommendations for optimal hardware execution.

---

## Table of Contents
1. [Project Introduction](#1-project-introduction)
2. [Case Study Objectives](#2-case-study-objectives)
3. [Architecture Overview](#3-architecture-overview)
4. [Technologies Used](#4-technologies-used)
5. [Installation & Prerequisites](#5-installation--prerequisites)
6. [Ubuntu Setup (Native or WSL2)](#6-ubuntu-setup-native-or-wsl2)
7. [Compilation of C Engine](#7-compilation-of-c-engine)
8. [Running the FastAPI Backend](#8-running-the-fastapi-backend)
9. [Running the React Frontend](#9-running-the-react-frontend)
10. [Running Parallel Experiments](#10-running-parallel-experiments)
11. [Training the AI Model](#11-training-the-ai-model)
12. [Generating Predictions & Intelligent Recommendations](#12-generating-predictions--intelligent-recommendations)
13. [Generating Reports (PDF & CSV)](#13-generating-reports-pdf--csv)
14. [Troubleshooting & FAQ](#14-troubleshooting--faq)

---

## 1. Project Introduction

Parallel computing is essential for computational throughput, yet parallel speedup rarely scales linearly. Memory bus saturation, cache invalidations, and thread synchronization overhead impose real-world constraints. **ParallelX** was built to provide an interactive, empirical testbed for investigating these scalability phenomena:

- **Empirical Execution**: Runs actual multi-threaded C99 OpenMP binaries on Linux (via native Ubuntu or WSL2 on Windows hosts).
- **Loop Scheduling Evaluation**: Compares OpenMP `static`, `dynamic`, and `guided` scheduling policies with custom chunk sizes.
- **Physics-Guided AI**: Uses Scikit-learn regressors (Random Forest) trained exclusively on wall-clock latency to predict parallel runtime and derive speedup without target leakage.
- **Intelligent Execution Advisor**: Recommends optimal thread configurations tailored to user optimization objectives (`min_time`, `max_speedup`, `high_efficiency`, `balanced`).
- **Apple UI Aesthetics**: Features frosted glass cards (`apple-glass-card`), SF Pro typography, dark charcoal palettes (`#0A0A0C`), and fluid Recharts visualizations.

---

## 2. Case Study Objectives

Aligned with **Team 7 Case Study 7 (Parallel Program Scalability)**:
- **Baseline Correctness**: Implement a sequential double-precision matrix multiplication (DGEMM) baseline with $i-k-j$ cache locality.
- **Parallel Scheduling**: Implement and profile OpenMP Static, Dynamic, and Guided loop schedules.
- **Empirical Metrics**: Accurately calculate Speedup $S(p) = \frac{T(1)}{T(p)}$, Parallel Efficiency $E(p) = \frac{S(p)}{p} \times 100\%$, Computational Intensity (GFLOPS), and Barrier Load Imbalance ($T_{\text{wait}} = \max_t T_t - \min_t T_t$).
- **Zero Fabrication**: Measure all performance numbers on real hardware; store individual repetition passes ($\ge 5$ runs + warm-up) in SQLite.
- **Machine Learning Generalization**: Evaluate candidate regressors (Linear Regression, Decision Trees, Random Forests) and evaluate predictive accuracy on held-out unseen worker configurations ($p \in \{3, 6, 12\}$).
- **Automated Validation**: Re-execute AI-recommended configurations on the C engine to validate predicted latency against empirical ground truth.

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               React 19 + TypeScript + Vite             │
│        (Apple Glass UI · Recharts · Lucide Icons)      │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST / WebSocket JSON
┌──────────────────────────▼─────────────────────────────┐
│                 Python FastAPI Backend                 │
│         (Async Runner · psutil · WebSocket Mgr)         │
├──────────────────────────┬─────────────────────────────┤
│   Scikit-Learn ML Core   │    SQLite Database Engine   │
│  (Random Forest Models)  │   (Experiments & Audits)    │
└──────────────┬───────────┴──────────────┬──────────────┘
               │ Controlled Subprocess    │ SQL
┌──────────────▼──────────────────────────▼──────────────┐
│        Native Ubuntu 24.04 (GCC 13.3 + OpenMP)         │
│    (i-k-j DGEMM · Static · Dynamic · Guided · Wtime)   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Technologies Used

| Tier | Component | Technology | Version / Spec |
| :--- | :--- | :--- | :--- |
| **Frontend** | Framework | React + TypeScript + Vite | React 19, Vite 8.3, TS 5.8 |
| | Styling | Tailwind CSS + Framer Motion | Frosted Glass / SF Pro |
| | Charts | Recharts | Responsive SVG charts |
| | Icons | Lucide React | Modern minimalist icons |
| **Backend** | API Server | Python FastAPI + Uvicorn | Python 3.11/3.12, ASGI |
| | System Telemetry | `psutil` | OS CPU sampling @ 25 Hz |
| | Machine Learning | `scikit-learn` + `joblib` | Random Forest, Ridge, Trees |
| | Data Analysis | `pandas` + `numpy` | Tabular feature engineering |
| | Report Engine | `reportlab` + `matplotlib` | High-res 300 DPI PDF engine |
| | Database | SQLite 3 | WAL mode, relational schema |
| **Computation** | Engine | C99 + OpenMP (`-fopenmp -O3`) | GCC 13.3.0 |
| | Platform | Ubuntu Linux | Native or Windows WSL2 |

---

## 5. Installation & Prerequisites

### Prerequisites
1. **Python**: Python 3.10+ (recommended: Python 3.11 or 3.12)
2. **Node.js**: Node 18+ and npm
3. **Compiler**: GCC with OpenMP support (on native Linux or Windows WSL2)

### Clone & Dependencies Setup
```bash
# Clone the repository
git clone https://github.com/aksho/TEAM7_PARALLELX.git
cd TEAM7_PARALLELX

# Install Python backend dependencies
pip install fastapi uvicorn pydantic psutil scikit-learn pandas numpy joblib reportlab matplotlib

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

---

## 6. Ubuntu Setup (Native or WSL2)

ParallelX executes compiled C OpenMP programs directly on Ubuntu.

### On Ubuntu / Debian Native:
```bash
sudo apt update
sudo apt install -y build-essential gcc libgomp1
```

### On Windows via WSL2:
If developing on Windows, ensure WSL2 Ubuntu is installed:
```powershell
wsl --install -d Ubuntu
# Verify GCC inside WSL
wsl -d Ubuntu gcc --version
```
ParallelX automatically detects `wsl` on Windows hosts and executes the compiled Ubuntu binaries safely using controlled argument arrays.

---

## 7. Compilation of C Engine

The C computational engine resides in `backend/c_engine/`.

### Linux / WSL Bash:
```bash
cd backend/c_engine/scripts
chmod +x build.sh test_correctness.sh
./build.sh
```

### Or Trigger Compilation via FastAPI API:
```bash
curl -X POST http://127.0.0.1:8000/api/engine/compile
```

### Verify Unit Tests & Numerical Correctness:
```bash
# In WSL or Ubuntu:
./backend/c_engine/bin/test_correctness
```
*Enforces 22 assertions: dynamic bounds checking, deterministic seeding, memory lifecycle, and $\Delta_{\text{max}} = 0.0$ parity against sequential DGEMM.*

---

## 8. Running the FastAPI Backend

```bash
# From repository root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

---

## 9. Running the React Frontend

```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 10. Running Parallel Experiments

### Via the Interactive Parallel Lab (Web UI):
1. Navigate to **Parallel Lab** (`/lab`).
2. Select Matrix Dimension ($N \in [100, 2000]$).
3. Select OpenMP Worker Thread Count ($1 \dots 16$).
4. Select Scheduling Strategy (`static`, `dynamic`, `guided`) and chunk size.
5. Click **Run Benchmark**.
6. Real-time compilation and execution states stream via WebSockets, displaying wall-clock execution time, speedup, and hardware CPU utilization.

### Via Command-Line Benchmark Binary:
```bash
# Usage: benchmark_all [size] [threads] [chunk_size] [repetitions] [warmup] [--json]
wsl -d Ubuntu ./backend/c_engine/bin/benchmark_all 1000 8 16 5 1 --json
```

---

## 11. Training the AI Model

The machine learning component trains candidate regression models to predict execution latency:

1. **Trigger via UI**: Navigate to **AI Prediction Engine** (`/ai-engine`) and click **Retrain ML Engine**.
2. **Trigger via REST API**:
   ```bash
   curl -X POST http://127.0.0.1:8000/api/ml/train
   ```
3. **Data Splitting**:
   - Training Set: Empirical configurations $p \in \{1, 2, 4, 8, 16\}$ (60 samples).
   - Generalization Test Set: Withheld unseen worker counts $p \in \{3, 6, 12\}$ (27 samples).
4. **Evaluated Models**: Linear Regression (StandardScaler), Decision Tree ($d=6$), and Random Forest ($n=100, d=8$).
5. **Winning Model**: Random Forest achieves 5-fold CV $R^2 = 0.912$ and unseen configurations $R^2 = 0.684$.

---

## 12. Generating Predictions & Intelligent Recommendations

### Objective-Driven Recommendations
1. Navigate to **AI Prediction Engine** (`/ai-engine`).
2. Select Matrix Dimension ($N$).
3. Select an Optimization Objective:
   - **Minimum Execution Time**: Minimizes wall-clock latency ($\min \hat{T}_p$).
   - **Maximum Speedup**: Maximizes strong scaling factor ($\max \hat{S}_p$).
   - **Better Parallel Efficiency**: Requires $\hat{E}_p \ge 75\%$, preventing thread contention.
   - **Balanced Performance**: Amdahl sweet spot (maximizes speedup subject to $\hat{E}_p \ge 55\%$).
4. The AI outputs primary recommendations, alternative ranked options, and human-readable rationales.
5. Click **Execute Recommended Configuration**: runs the experiment in Ubuntu, compares predicted vs measured latency, and records validation data into SQLite.

---

## 13. Generating Reports (PDF & CSV)

Navigate to **Reports & Exports** (`/reports`):

- **Publication-Ready Technical Report (PDF)**:
  Click **Download Technical Report (PDF)** or visit `http://127.0.0.1:8000/api/reports/download.pdf`.
  Includes project objectives, system specs, mathematical formulations, empirical tables, embedded Matplotlib 4-panel scalability plots, AI candidate evaluations, and prediction audit logs.
- **Complete Benchmark Dataset (CSV)**:
  Click **Export Full CSV** or visit `http://127.0.0.1:8000/api/reports/download.csv`.
  Streams all recorded runs from `parallelx.db` with timing averages, standard deviations, and barrier waiting times.

---

## 14. Troubleshooting & FAQ

### 1. `WSL/Service/E_UNEXPECTED` on Windows
If WSL becomes unresponsive or throws a catastrophic service error after machine standby:
```powershell
wsl --shutdown
# Recheck WSL status
wsl -d Ubuntu uname -r
```

### 2. Missing C Binaries
If the backend logs `Binaries not found`:
```bash
curl -X POST http://127.0.0.1:8000/api/engine/compile
```
Or run `backend/c_engine/scripts/build.sh` inside Ubuntu.

### 3. Target Leakage Prevention in AI
*Why does ParallelX predict execution time rather than speedup directly?*
Predicting speedup directly causes unphysical predictions (e.g. speedup $> p$ or conflicting speedups for identical runtimes). By training on execution time $\hat{T}_p$ and algebraically deriving $\hat{S}_p = T_{\text{seq}} / \hat{T}_p$ and $\hat{E}_p = \hat{S}_p / p$, mathematical and physical identities are strictly preserved.

---

## License & Team Information
Developed for **Team 7 · Case Study 7: Parallel Program Scalability**.
Antigravity Full-Stack Implementation.
