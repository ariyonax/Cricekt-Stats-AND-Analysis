# StumpStats - Pydantic Models (Request/Response Schemas)

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    admin   = "admin"
    analyst = "analyst"
    fan     = "fan"


# ── Auth Models (US5) ─────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.fan   # default role is fan


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class UserOut(BaseModel):
    username: str
    email: str
    role: str
    created_at: datetime


# ── Player Models (US1, US2, US4) ─────────────────────────────────────────────

class PlayerStats(BaseModel):
    player_name: str
    team: str
    matches: int
    runs: int
    average: float
    strike_rate: float
    fifties: int
    hundreds: int
    wickets: int
    economy: float
    bowling_average: float
    seasons: List[int]


class PlayerCompare(BaseModel):
    player1: str
    player2: str


# ── Match Models (US3) ────────────────────────────────────────────────────────

class MatchPredictionRequest(BaseModel):
    team1: str
    team2: str
    venue: str
    toss_winner: str
    toss_decision: str   # "bat" or "field"


class MatchPredictionResponse(BaseModel):
    team1: str
    team2: str
    win_probability_team1: float
    win_probability_team2: float
    predicted_winner: str
    confidence: float
    key_factors: List[str]


# ── Player Prediction Models (US2) ────────────────────────────────────────────

class PlayerPredictionRequest(BaseModel):
    player_name: str
    against_team: Optional[str] = None
    venue: Optional[str] = None


class PlayerPredictionResponse(BaseModel):
    player_name: str
    predicted_runs: float
    predicted_wickets: float
    predicted_strike_rate: float
    form_rating: str        # "Excellent", "Good", "Average", "Poor"
    confidence_score: float


# ── Upload Models (US9, US11) ─────────────────────────────────────────────────

class UploadResponse(BaseModel):
    message: str
    rows_inserted: int
    file_name: str


# ── Dashboard Models (US6) ────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_matches: int
    total_players: int
    total_seasons: int
    top_run_scorer: str
    top_wicket_taker: str
    most_titles: str


# ── ML Metrics Models (US7) ───────────────────────────────────────────────────

class MLMetrics(BaseModel):
    model_name: str
    accuracy: float
    f1_score: float
    precision: float
    recall: float
    confusion_matrix: List[List[int]]
    last_trained: datetime
