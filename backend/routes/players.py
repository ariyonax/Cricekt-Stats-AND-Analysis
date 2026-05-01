# StumpStats - Players Routes
# US1: Player performance history with filters
# US4: Compare two players side by side

from fastapi import APIRouter, Depends, Query, HTTPException
from utils.auth import get_current_user
from utils.database import get_players_collection, get_deliveries_collection

router = APIRouter()


@router.get("/")
async def list_players(
    team: str = Query(None, description="Filter by IPL team"),
    season: int = Query(None, description="Filter by season year"),
    search: str = Query(None, description="Search by player name"),
    current_user: dict = Depends(get_current_user)
):
    """
    List all players with optional filters.
    US1: Supports team, season, and name filters.
    """
    players_col = get_players_collection()
    query = {}

    if team:
        query["team"] = {"$regex": team, "$options": "i"}
    if search:
        query["player_name"] = {"$regex": search, "$options": "i"}

    cursor = players_col.find(query, {"_id": 0}).limit(100)
    players = await cursor.to_list(100)
    return players


@router.get("/{player_name}/history")
async def player_history(
    player_name: str,
    current_user: dict = Depends(get_current_user)
):
    """
    US1: Full batting and bowling history for a player across all IPL seasons.
    Returns season-by-season breakdown for charts.
    """
    deliveries_col = get_deliveries_collection()

    # Aggregate batting stats per season
    batting_pipeline = [
        {"$match": {"batter": player_name}},
        {"$lookup": {
            "from": "matches",
            "localField": "match_id",
            "foreignField": "match_id",
            "as": "match_info"
        }},
        {"$unwind": "$match_info"},
        {"$group": {
            "_id": "$match_info.season",
            "runs":         {"$sum": "$batsman_runs"},
            "balls_faced":  {"$sum": 1},
            "fours":        {"$sum": {"$cond": [{"$eq": ["$batsman_runs", 4]}, 1, 0]}},
            "sixes":        {"$sum": {"$cond": [{"$eq": ["$batsman_runs", 6]}, 1, 0]}},
        }},
        {"$sort": {"_id": 1}}
    ]

    # Aggregate bowling stats per season
    bowling_pipeline = [
        {"$match": {
            "bowler": player_name,
            "is_wicket": 1,
            "dismissal_kind": {"$nin": ["run out", "retired hurt", "obstructing the field"]}
        }},
        {"$lookup": {
            "from": "matches",
            "localField": "match_id",
            "foreignField": "match_id",
            "as": "match_info"
        }},
        {"$unwind": "$match_info"},
        {"$group": {
            "_id": "$match_info.season",
            "wickets": {"$sum": 1},
            "runs_given": {"$sum": "$total_runs"}
        }},
        {"$sort": {"_id": 1}}
    ]

    batting = await deliveries_col.aggregate(batting_pipeline).to_list(50)
    bowling = await deliveries_col.aggregate(bowling_pipeline).to_list(50)

    # Format batting data
    batting_data = []
    for b in batting:
        sr = round((b["runs"] / b["balls_faced"]) * 100, 1) if b["balls_faced"] > 0 else 0
        batting_data.append({
            "season":      b["_id"],
            "runs":        b["runs"],
            "balls_faced": b["balls_faced"],
            "strike_rate": sr,
            "fours":       b["fours"],
            "sixes":       b["sixes"]
        })

    # Format bowling data
    bowling_data = []
    for w in bowling:
        bowling_data.append({
            "season":     w["_id"],
            "wickets":    w["wickets"],
            "runs_given": w["runs_given"],
            "economy":    round(w["runs_given"] / (w["wickets"] or 1), 2)
        })

    return {
        "player": player_name,
        "batting": batting_data,
        "bowling": bowling_data
    }


@router.get("/compare")
async def compare_players(
    player1: str = Query(..., description="First player name"),
    player2: str = Query(..., description="Second player name"),
    current_user: dict = Depends(get_current_user)
):
    """
    US4: Compare two players side by side.
    Returns stats for radar chart + bar chart on frontend.
    """
    players_col = get_players_collection()

    p1 = await players_col.find_one(
        {"player_name": {"$regex": player1, "$options": "i"}}, {"_id": 0}
    )
    p2 = await players_col.find_one(
        {"player_name": {"$regex": player2, "$options": "i"}}, {"_id": 0}
    )

    if not p1:
        raise HTTPException(status_code=404, detail=f"Player '{player1}' not found")
    if not p2:
        raise HTTPException(status_code=404, detail=f"Player '{player2}' not found")

    # Build radar chart data format
    radar_metrics = ["total_runs", "total_wickets", "batting_avg", "bowling_avg", "strike_rate", "economy"]

    radar_data = []
    for metric in radar_metrics:
        radar_data.append({
            "metric":  metric,
            "player1": p1.get(metric, 0),
            "player2": p2.get(metric, 0)
        })

    return {
        "player1": p1,
        "player2": p2,
        "radar":   radar_data
    }


@router.get("/teams")
async def get_teams(current_user: dict = Depends(get_current_user)):
    """Return list of all IPL teams for dropdown filters."""
    players_col = get_players_collection()
    teams = await players_col.distinct("team")
    return sorted([t for t in teams if t])
