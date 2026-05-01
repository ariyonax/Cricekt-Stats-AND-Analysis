# StumpStats - Main FastAPI Application Entry Point
# Run with: uvicorn main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

# Import all routers
from routes.auth import router as auth_router
from routes.players import router as players_router
from routes.matches import router as matches_router
from routes.predictions import router as predictions_router
from routes.dashboard import router as dashboard_router
from routes.reports import router as reports_router
from routes.upload import router as upload_router
from routes.live import router as live_router
from routes.ml_metrics import router as ml_metrics_router

# Import DB connection
from utils.database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to MongoDB
    await connect_db()
    print("✅ Connected to MongoDB")
    yield
    # Shutdown: close MongoDB connection
    await close_db()
    print("🔴 Disconnected from MongoDB")


# Initialize FastAPI app
app = FastAPI(
    title="StumpStats API",
    description="Cricket Analysis & AI Prediction Platform for IPL",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow React frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers with /api prefix
app.include_router(auth_router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(players_router,     prefix="/api/players",     tags=["Players"])
app.include_router(matches_router,     prefix="/api/matches",     tags=["Matches"])
app.include_router(predictions_router, prefix="/api/predictions", tags=["AI Predictions"])
app.include_router(dashboard_router,   prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(reports_router,     prefix="/api/reports",     tags=["Reports"])
app.include_router(upload_router,      prefix="/api/upload",      tags=["Data Upload"])
app.include_router(live_router,        prefix="/api/live",        tags=["Live Data"])
app.include_router(ml_metrics_router,  prefix="/api/ml",          tags=["ML Metrics"])


@app.get("/")
async def root():
    return {
        "app": "StumpStats",
        "status": "running",
        "version": "1.0.0",
        "message": "🏏 Cricket AI Analysis Platform"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
