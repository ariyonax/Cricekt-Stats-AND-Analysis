# StumpStats - ML Metrics Routes
# US7: Model accuracy evaluation page (accuracy, F1, confusion matrix)

from fastapi import APIRouter, Depends, BackgroundTasks
from utils.auth import get_current_user, require_role
import joblib, os
from datetime import datetime

router = APIRouter()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "saved_models")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.pkl")


@router.get("/metrics")
async def get_ml_metrics(current_user: dict = Depends(get_current_user)):
    """
    US7: Return stored ML model metrics — accuracy, F1, precision, recall,
    and confusion matrix for both player and match models.
    """
    if os.path.exists(METRICS_PATH):
        metrics = joblib.load(METRICS_PATH)
        return metrics

    # Return demo metrics if models not trained yet
    return {
        "player_model": {
            "model_name":       "Random Forest Regressor",
            "r2_score":         0.847,
            "mae":              8.3,
            "rmse":             12.1,
            "features_used":    ["batting_avg", "strike_rate", "total_runs", "matches_played", "economy", "bowling_avg"],
            "last_trained":     None,
            "status":           "not_trained"
        },
        "match_model": {
            "model_name":       "XGBoost Classifier",
            "accuracy":         0.723,
            "f1_score":         0.718,
            "precision":        0.731,
            "recall":           0.706,
            "confusion_matrix": [[312, 98], [87, 303]],
            "last_trained":     None,
            "status":           "not_trained"
        },
        "note": "Run POST /api/ml/retrain to train models on your IPL dataset"
    }


@router.post("/retrain")
async def retrain_models(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_role("admin", "analyst"))
):
    """
    US11: Trigger retraining of all ML models on the latest data in MongoDB.
    Runs in the background so the API stays responsive.
    Only admin and analyst can trigger retraining.
    """
    background_tasks.add_task(_run_training)
    return {
        "message": "Model retraining started in background",
        "status":  "training",
        "note":    "Check GET /api/ml/metrics after 2-3 minutes to see updated results"
    }


async def _run_training():
    """Background task: re-runs the ML training script."""
    import subprocess, sys
    script_path = os.path.join(os.path.dirname(__file__), "..", "ml", "train_models.py")
    subprocess.run([sys.executable, script_path], check=False)
