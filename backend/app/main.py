from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .routers import system, engine, experiments, websocket, analytics, ml, reports
from .services.compiler_service import check_binaries_exist, compile_c_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify C binaries on startup
    if not check_binaries_exist():
        print("[ParallelX] C OpenMP binaries not found on startup. Triggering initial build...")
        res = await compile_c_engine()
        print(f"[ParallelX] Build status: {'SUCCESS' if res['success'] else 'FAILED'}")
    else:
        print("[ParallelX] C OpenMP computational engine verified and ready.")
    yield
    print("[ParallelX] Backend shutting down.")

app = FastAPI(
    title="ParallelX Engine API",
    description="Intelligent Parallel Computing & Scalability Analyzer (Team 7 · Case Study 7)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # Local development flexibility
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(system.router)
app.include_router(engine.router)
app.include_router(experiments.router)
app.include_router(websocket.router)
app.include_router(analytics.router)
app.include_router(ml.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {
        "project": "ParallelX — Intelligent Parallel Computing & Scalability Analyzer",
        "team": "Team 7",
        "status": "online",
        "docs": "/docs",
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "engine_ready": check_binaries_exist(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
