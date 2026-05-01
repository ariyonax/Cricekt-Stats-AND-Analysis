# StumpStats - Data Upload Routes
# US9:  Upload new match CSV data
# US11: Upload and integrate into ML pipeline

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from utils.auth import get_current_user, require_role
from utils.database import get_matches_collection, get_deliveries_collection
import pandas as pd
import io

router = APIRouter()


@router.post("/matches")
async def upload_matches_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("admin", "analyst"))
):
    """
    US9: Upload a matches.csv file to add new match data to the database.
    Only admin and analyst roles can upload.
    Expected columns: id, season, city, date, team1, team2, toss_winner,
                      toss_decision, result, winner, player_of_match, venue
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    # Read CSV into memory
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    # Validate required columns
    required = ["id", "season", "team1", "team2", "winner", "venue"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

    # Convert to list of dicts
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    # Rename 'id' → 'match_id' for consistency
    for r in records:
        r["match_id"] = str(r.pop("id", r.get("match_id", "")))
        r["season"]   = int(r.get("season", 0))

    # Insert into MongoDB (skip duplicates)
    matches_col = get_matches_collection()
    inserted = 0
    for record in records:
        exists = await matches_col.find_one({"match_id": record["match_id"]})
        if not exists:
            await matches_col.insert_one(record)
            inserted += 1

    return {
        "message":       f"Successfully uploaded match data",
        "rows_inserted": inserted,
        "rows_skipped":  len(records) - inserted,
        "file_name":     file.filename
    }


@router.post("/deliveries")
async def upload_deliveries_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role("admin", "analyst"))
):
    """
    US9: Upload deliveries.csv with ball-by-ball data.
    US11: New data automatically feeds the ML training pipeline.
    Expected columns: match_id, inning, batting_team, bowling_team,
                      over, ball, batter, bowler, batsman_runs, total_runs, is_wicket
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    required = ["match_id", "batter", "bowler", "batsman_runs", "total_runs", "is_wicket"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

    # Convert NaN → None and insert in bulk
    records = df.where(pd.notnull(df), None).to_dict(orient="records")

    deliveries_col = get_deliveries_collection()

    # Batch insert (faster than one-by-one)
    if records:
        await deliveries_col.insert_many(records, ordered=False)

    return {
        "message":       "Deliveries data uploaded successfully",
        "rows_inserted": len(records),
        "file_name":     file.filename,
        "ml_note":       "Run POST /api/ml/retrain to update ML models with new data"
    }


@router.get("/status")
async def upload_status(current_user: dict = Depends(get_current_user)):
    """Return current row counts so user knows what's in the DB."""
    matches_col    = get_matches_collection()
    deliveries_col = get_deliveries_collection()

    return {
        "matches_in_db":    await matches_col.count_documents({}),
        "deliveries_in_db": await deliveries_col.count_documents({}),
        "message":          "Upload matches.csv and deliveries.csv to populate the database"
    }
