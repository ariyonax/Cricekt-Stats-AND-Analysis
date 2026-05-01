# StumpStats - Dashboard Routes
# US6: Visual dashboard with cricket stats (runs, wickets, win rates)

from fastapi import APIRouter, Depends
from utils.auth import get_current_user
from utils.database import get_matches_collection, get_players_collection, get_deliveries_collection

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Returns top-level summary stats for the main dashboard.
    Used for stat cards and overview charts (US6).
    """
    matches_col    = get_matches_collection()
    players_col    = get_players_collection()

    total_matches  = await matches_col.count_documents({})
    total_players  = await players_col.count_documents({})

    # Top run scorer
    top_batsman = await players_col.find_one(
        {}, sort=[("total_runs", -1)]
    )
    # Top wicket taker
    top_bowler = await players_col.find_one(
        {}, sort=[("total_wickets", -1)]
    )
    # Most IPL titles
    pipeline = [
        {"$group": {"_id": "$winner", "wins": {"$sum": 1}}},
        {"$sort": {"wins": -1}},
        {"$limit": 1}
    ]
    most_wins = await matches_col.aggregate(pipeline).to_list(1)

    return {
        "total_matches":   total_matches,
        "total_players":   total_players,
        "total_seasons":   17,   # IPL 2008–2024
        "top_run_scorer":  top_batsman["player_name"] if top_batsman else "N/A",
        "top_wicket_taker": top_bowler["player_name"] if top_bowler else "N/A",
        "most_titles":     most_wins[0]["_id"] if most_wins else "N/A",
    }


@router.get("/runs-by-season")
async def runs_by_season(current_user: dict = Depends(get_current_user)):
    """
    Returns total runs scored per IPL season.
    Used for the season-wise runs bar chart (US6).
    """
    matches_col = get_matches_collection()
    pipeline = [
        {"$group": {"_id": "$season", "total_runs": {"$sum": "$total_runs"}}},
        {"$sort": {"_id": 1}}
    ]
    data = await matches_col.aggregate(pipeline).to_list(100)
    return [{"season": d["_id"], "runs": d["total_runs"]} for d in data]


@router.get("/wickets-by-season")
async def wickets_by_season(current_user: dict = Depends(get_current_user)):
    """
    Returns total wickets per IPL season.
    Used for the season-wise wickets line chart (US6).
    """
    matches_col = get_matches_collection()
    pipeline = [
        {"$group": {"_id": "$season", "total_wickets": {"$sum": "$total_wickets"}}},
        {"$sort": {"_id": 1}}
    ]
    data = await matches_col.aggregate(pipeline).to_list(100)
    return [{"season": d["_id"], "wickets": d["total_wickets"]} for d in data]


@router.get("/win-rate-by-team")
async def win_rate_by_team(current_user: dict = Depends(get_current_user)):
    """
    Returns win rate percentage per team across all seasons.
    Used for the win rate chart (US6).
    """
    matches_col = get_matches_collection()

    # Total matches per team
    total_pipeline = [
        {"$project": {"teams": ["$team1", "$team2"]}},
        {"$unwind": "$teams"},
        {"$group": {"_id": "$teams", "total": {"$sum": 1}}}
    ]
    # Wins per team
    wins_pipeline = [
        {"$group": {"_id": "$winner", "wins": {"$sum": 1}}}
    ]

    totals = {d["_id"]: d["total"] async for d in matches_col.aggregate(total_pipeline)}
    wins   = {d["_id"]: d["wins"]  async for d in matches_col.aggregate(wins_pipeline)}

    result = []
    for team, total in totals.items():
        win_count = wins.get(team, 0)
        result.append({
            "team": team,
            "wins": win_count,
            "total": total,
            "win_rate": round((win_count / total) * 100, 1) if total > 0 else 0
        })

    return sorted(result, key=lambda x: x["win_rate"], reverse=True)


@router.get("/top-batsmen")
async def top_batsmen(current_user: dict = Depends(get_current_user)):
    """Top 10 run scorers in IPL history for leaderboard widget."""
    players_col = get_players_collection()
    cursor = players_col.find(
        {"total_runs": {"$gt": 0}},
        {"player_name": 1, "total_runs": 1, "team": 1, "_id": 0}
    ).sort("total_runs", -1).limit(10)
    return await cursor.to_list(10)


@router.get("/top-bowlers")
async def top_bowlers(current_user: dict = Depends(get_current_user)):
    """Top 10 wicket takers in IPL history for leaderboard widget."""
    players_col = get_players_collection()
    cursor = players_col.find(
        {"total_wickets": {"$gt": 0}},
        {"player_name": 1, "total_wickets": 1, "team": 1, "_id": 0}
    ).sort("total_wickets", -1).limit(10)
    return await cursor.to_list(10)
