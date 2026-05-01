# StumpStats - Matches Routes

from fastapi import APIRouter, Depends, Query
from utils.auth import get_current_user
from utils.database import get_matches_collection

router = APIRouter()


@router.get("/")
async def list_matches(
    season: int  = Query(None, description="Filter by season year"),
    team:   str  = Query(None, description="Filter by team name"),
    venue:  str  = Query(None, description="Filter by venue"),
    limit:  int  = Query(50,   ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """List IPL matches with optional filters."""
    matches_col = get_matches_collection()
    query = {}
    if season:
        query["season"] = season
    if team:
        query["$or"] = [
            {"team1": {"$regex": team, "$options": "i"}},
            {"team2": {"$regex": team, "$options": "i"}}
        ]
    if venue:
        query["venue"] = {"$regex": venue, "$options": "i"}

    cursor = matches_col.find(query, {"_id": 0}).sort("date", -1).limit(limit)
    return await cursor.to_list(limit)


@router.get("/seasons")
async def get_seasons(current_user: dict = Depends(get_current_user)):
    """Return list of all IPL seasons available in the database."""
    matches_col = get_matches_collection()
    seasons = await matches_col.distinct("season")
    return sorted([s for s in seasons if s])


@router.get("/{match_id}")
async def get_match(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single match by ID."""
    matches_col = get_matches_collection()
    match = await matches_col.find_one({"match_id": match_id}, {"_id": 0})
    if not match:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Match not found")
    return match
