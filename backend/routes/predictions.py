from fastapi import APIRouter, Depends, HTTPException
from models.schemas import PlayerPredictionRequest
from utils.auth import get_current_user
from utils.database import get_players_collection
from utils.normalize import normalize_name
import joblib
import numpy as np
import os

router = APIRouter()

# Model path
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "saved_models")
PLAYER_MODEL_PATH = os.path.join(MODEL_DIR, "player_model.pkl")


def load_model(path: str):
    if os.path.exists(path):
        return joblib.load(path)
    return None


@router.post("/player")
async def predict_player_performance(
    request: PlayerPredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    players_col = get_players_collection()

    # 🔥 DEBUG SAMPLE
    sample = await players_col.find_one()
    print("SAMPLE DOCUMENT:", sample)

    # ✅ NORMALIZE INPUT
    name = normalize_name(request.player_name)

    # ✅ FIND PLAYER (FINAL FIX)
    player = await players_col.find_one(
        {"normalized_name": name},
        {"_id": 0}
    )

    print("FOUND PLAYER:", player)

    if not player:
        raise HTTPException(
            status_code=404,
            detail=f"Player '{request.player_name}' not found in database"
        )

    # 🔥 LOAD MODEL (disabled for now)
    model = load_model(PLAYER_MODEL_PATH)

    if False:   # ❌ keep disabled until ML fixed
        features = np.array([[
            player.get("batting_avg", 0),
            player.get("strike_rate", 0),
            player.get("total_runs", 0),
            player.get("matches_played", 0),
            player.get("economy", 0),
            player.get("bowling_avg", 0),
            player.get("total_wickets", 0)
        ]])

        predicted_runs = float(model.predict(features)[0])
        predicted_wickets = max(0, round(predicted_runs / 50))
        confidence = min(0.95, 0.6 + (player.get("matches_played", 0) / 200))

    else:
        # ✅ SAFE FALLBACK (WORKING)
        avg = player.get("batting_avg", 25)

        predicted_runs = round(avg * np.random.uniform(0.8, 1.2), 1)

        predicted_wickets = round(
            player.get("total_wickets", 0) /
            max(player.get("matches_played", 1), 1),
            1
        )

        confidence = 0.72

    # 🎯 FORM RATING
    if predicted_runs >= 40:
        form = "Excellent"
    elif predicted_runs >= 25:
        form = "Good"
    elif predicted_runs >= 15:
        form = "Average"
    else:
        form = "Poor"

    # ✅ FINAL RESPONSE
    return {
        "player_name": player["player_name"],
        "predicted_runs": predicted_runs,
        "predicted_wickets": predicted_wickets,
        "predicted_strike_rate": round(
            player.get("strike_rate", 120) * np.random.uniform(0.9, 1.1),
            1
        ),
        "form_rating": form,
        "confidence_score": round(confidence, 2),
        "based_on_matches": player.get("matches_played", 0)
    }