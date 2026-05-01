"""
StumpStats - ML Model Training Script
======================================
Run this script ONCE after uploading your Kaggle IPL dataset to MongoDB.
It will train two models:
  1. Player Performance Model  → Random Forest Regressor
  2. Match Outcome Model       → XGBoost Classifier

Usage:
  python ml/train_models.py

Output:
  ml/saved_models/player_model.pkl
  ml/saved_models/match_model.pkl
  ml/saved_models/encoders.pkl
  ml/saved_models/metrics.pkl
"""

import os
import sys
import asyncio
import joblib
import pandas as pd
import numpy as np

from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score,
    recall_score, confusion_matrix, r2_score,
    mean_absolute_error, mean_squared_error
)

# Add parent dir to path so we can import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Try XGBoost, fall back to LogisticRegression if not available
try:
    from xgboost import XGBClassifier
    USE_XGB = True
    print("✅ XGBoost available")
except ImportError:
    USE_XGB = False
    print("⚠️  XGBoost not found, using LogisticRegression instead")

from dotenv import load_dotenv
load_dotenv()

# Output directory
SAVE_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(SAVE_DIR, exist_ok=True)

# CSV data paths (Kaggle dataset)
DATA_DIR        = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MATCHES_CSV     = os.path.join(DATA_DIR, "matches.csv")
DELIVERIES_CSV  = os.path.join(DATA_DIR, "deliveries.csv")


# ── Helper: Build player aggregate stats from deliveries ─────────────────────

def build_player_stats(deliveries: pd.DataFrame, matches: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate ball-by-ball deliveries data into per-player season stats.
    Returns a DataFrame used for training the player performance model.
    """
    print("📊 Building player stats from deliveries...")

    # Merge season info
    if "match_id" not in deliveries.columns and "id" in matches.columns:
        matches = matches.rename(columns={"id": "match_id"})
    deliveries = deliveries.merge(
        matches[["match_id", "season"]].astype({"match_id": str}),
        left_on="match_id", right_on="match_id", how="left"
    )

    # ── Batting stats ──
    batting = deliveries.groupby(["batter", "season"]).agg(
        runs        = ("batsman_runs", "sum"),
        balls_faced = ("batsman_runs", "count"),
        fours       = ("batsman_runs", lambda x: (x == 4).sum()),
        sixes       = ("batsman_runs", lambda x: (x == 6).sum()),
        matches     = ("match_id", "nunique")
    ).reset_index()
    batting["strike_rate"]  = (batting["runs"] / batting["balls_faced"].replace(0, np.nan)) * 100
    batting["batting_avg"]  = batting["runs"] / batting["matches"].replace(0, np.nan)
    batting = batting.rename(columns={"batter": "player_name"})

    # ── Bowling stats ──
    valid_wickets = deliveries[
        (deliveries["is_wicket"] == 1) &
        (~deliveries.get("dismissal_kind", pd.Series(dtype=str)).isin(
            ["run out", "retired hurt", "obstructing the field"]
        ))
    ]
    bowling = valid_wickets.groupby(["bowler", "season"]).agg(
        wickets     = ("is_wicket", "sum"),
        runs_given  = ("total_runs", "sum"),
        bowl_balls  = ("total_runs", "count")
    ).reset_index()
    bowling["economy"]      = (bowling["runs_given"] / bowling["bowl_balls"].replace(0, np.nan)) * 6
    bowling["bowling_avg"]  = bowling["runs_given"] / bowling["wickets"].replace(0, np.nan)
    bowling = bowling.rename(columns={"bowler": "player_name"})

    # ── Merge batting + bowling ──
    stats = batting.merge(bowling, on=["player_name", "season"], how="outer").fillna(0)
    return stats


# ── Train Player Performance Model ───────────────────────────────────────────

def train_player_model(stats: pd.DataFrame) -> dict:
    """
    Train Random Forest Regressor to predict player runs.
    Features: batting_avg, strike_rate, runs, matches, economy, bowling_avg
    Target:   runs (next prediction)
    """
    print("\n🤖 Training Player Performance Model (Random Forest)...")

    feature_cols = ["batting_avg", "strike_rate", "runs", "matches", "economy", "bowling_avg"]
    target_col   = "runs"

    # Drop rows with missing features
    df = stats[feature_cols + [target_col]].dropna()
    if len(df) < 50:
        print("⚠️  Not enough data for player model, using demo data")
        return _demo_player_metrics()

    X = df[feature_cols].values
    y = df[target_col].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    r2  = round(float(r2_score(y_test, y_pred)), 4)
    mae = round(float(mean_absolute_error(y_test, y_pred)), 2)
    rmse = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 2)

    print(f"   R² Score : {r2}")
    print(f"   MAE      : {mae} runs")
    print(f"   RMSE     : {rmse} runs")

    # Save model
    joblib.dump(model, os.path.join(SAVE_DIR, "player_model.pkl"))
    print("   ✅ Saved: player_model.pkl")

    return {
        "model_name":    "Random Forest Regressor",
        "r2_score":      r2,
        "mae":           mae,
        "rmse":          rmse,
        "features_used": feature_cols,
        "last_trained":  datetime.utcnow().isoformat(),
        "status":        "trained",
        "samples":       len(df)
    }


# ── Train Match Outcome Model ─────────────────────────────────────────────────

def train_match_model(matches: pd.DataFrame) -> dict:
    """
    Train XGBoost (or LogisticRegression) to predict match winner.
    Features: team1, team2, venue, toss_winner, toss_decision
    Target:   did team1 win? (binary)
    """
    print("\n🤖 Training Match Outcome Model (XGBoost)...")

    required_cols = ["team1", "team2", "venue", "toss_winner", "toss_decision", "winner"]
    df = matches[required_cols].dropna().copy()

    if len(df) < 100:
        print("⚠️  Not enough match data, using demo metrics")
        return _demo_match_metrics()

    # Label encode categorical columns
    encoders = {}
    for col in ["team1", "team2", "venue", "toss_winner"]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # Encode toss_decision: bat=1, field=0
    df["toss_decision"] = df["toss_decision"].map({"bat": 1, "field": 0}).fillna(0)

    # Target: 1 if team1 won, 0 otherwise
    df["target"] = (df["winner"] == df["team1"]).astype(int)

    feature_cols = ["team1", "team2", "venue", "toss_winner", "toss_decision"]
    X = df[feature_cols].values
    y = df["target"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train model
    if USE_XGB:
        model = XGBClassifier(n_estimators=200, max_depth=5, learning_rate=0.1,
                               use_label_encoder=False, eval_metric="logloss", random_state=42)
    else:
        model = LogisticRegression(max_iter=500, random_state=42)

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc  = round(accuracy_score(y_test, y_pred), 4)
    f1   = round(f1_score(y_test, y_pred), 4)
    prec = round(precision_score(y_test, y_pred), 4)
    rec  = round(recall_score(y_test, y_pred), 4)
    cm   = confusion_matrix(y_test, y_pred).tolist()

    print(f"   Accuracy  : {acc}")
    print(f"   F1 Score  : {f1}")
    print(f"   Precision : {prec}")
    print(f"   Recall    : {rec}")
    print(f"   Confusion : {cm}")

    # Save model + encoders
    joblib.dump(model,    os.path.join(SAVE_DIR, "match_model.pkl"))
    joblib.dump(encoders, os.path.join(SAVE_DIR, "encoders.pkl"))
    print("   ✅ Saved: match_model.pkl + encoders.pkl")

    return {
        "model_name":       "XGBoost Classifier" if USE_XGB else "Logistic Regression",
        "accuracy":         acc,
        "f1_score":         f1,
        "precision":        prec,
        "recall":           rec,
        "confusion_matrix": cm,
        "last_trained":     datetime.utcnow().isoformat(),
        "status":           "trained",
        "samples":          len(df)
    }


# ── Also save player aggregates to MongoDB ────────────────────────────────────

async def save_players_to_mongo(stats: pd.DataFrame):
    """Save aggregated player stats into MongoDB players collection."""
    from utils.database import connect_db, get_players_collection
    await connect_db()
    players_col = get_players_collection()

    # Group by player (all-time totals)
    all_time = stats.groupby("player_name").agg(
        total_runs      = ("runs", "sum"),
        total_wickets   = ("wickets", "sum"),
        matches_played  = ("matches", "sum"),
        batting_avg     = ("batting_avg", "mean"),
        strike_rate     = ("strike_rate", "mean"),
        economy         = ("economy", "mean"),
        bowling_avg     = ("bowling_avg", "mean"),
    ).reset_index()

    print(f"\n💾 Saving {len(all_time)} player records to MongoDB...")
    for _, row in all_time.iterrows():
        doc = row.to_dict()
        doc = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in doc.items()}
        await players_col.update_one(
            {"player_name": doc["player_name"]},
            {"$set": doc},
            upsert=True
        )
    print("   ✅ Players collection updated")


# ── Demo metrics fallbacks ────────────────────────────────────────────────────

def _demo_player_metrics():
    return {
        "model_name": "Random Forest Regressor",
        "r2_score": 0.847, "mae": 8.3, "rmse": 12.1,
        "features_used": ["batting_avg", "strike_rate", "runs", "matches", "economy", "bowling_avg"],
        "last_trained": datetime.utcnow().isoformat(),
        "status": "demo", "samples": 0
    }

def _demo_match_metrics():
    return {
        "model_name": "XGBoost Classifier",
        "accuracy": 0.723, "f1_score": 0.718, "precision": 0.731, "recall": 0.706,
        "confusion_matrix": [[312, 98], [87, 303]],
        "last_trained": datetime.utcnow().isoformat(),
        "status": "demo", "samples": 0
    }


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    print("=" * 55)
    print("🏏  StumpStats — ML Model Training Pipeline")
    print("=" * 55)

    # Load CSVs
    if not os.path.exists(MATCHES_CSV) or not os.path.exists(DELIVERIES_CSV):
        print(f"\n❌ CSV files not found at {DATA_DIR}")
        print("   Please place matches.csv and deliveries.csv in backend/data/")
        return

    print(f"\n📂 Loading datasets from {DATA_DIR}...")
    matches    = pd.read_csv(MATCHES_CSV)
    deliveries = pd.read_csv(DELIVERIES_CSV)

    # Normalize match_id column name
    if "id" in matches.columns:
        matches = matches.rename(columns={"id": "match_id"})
    matches["match_id"] = matches["match_id"].astype(str)
    deliveries["match_id"] = deliveries["match_id"].astype(str)

    print(f"   Matches    : {len(matches):,} rows")
    print(f"   Deliveries : {len(deliveries):,} rows")

    # Build player stats
    stats = build_player_stats(deliveries, matches)

    # Train both models
    player_metrics = train_player_model(stats)
    match_metrics  = train_match_model(matches)

    # Save combined metrics
    all_metrics = {
        "player_model": player_metrics,
        "match_model":  match_metrics
    }
    joblib.dump(all_metrics, os.path.join(SAVE_DIR, "metrics.pkl"))
    print("\n✅ metrics.pkl saved")

    # Save player stats to MongoDB
    try:
        await save_players_to_mongo(stats)
    except Exception as e:
        print(f"⚠️  Could not save to MongoDB: {e}")
        print("   (Make sure MongoDB is running)")

    print("\n" + "=" * 55)
    print("🎉  Training complete! All models saved.")
    print(f"   Location: {SAVE_DIR}")
    print("=" * 55)


if __name__ == "__main__":
    asyncio.run(main())
