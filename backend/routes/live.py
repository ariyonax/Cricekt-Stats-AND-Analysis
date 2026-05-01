# StumpStats - Live Match Data Routes
# US12: Real-time match data integration using CricAPI + Firebase

from fastapi import APIRouter, Depends, HTTPException
from utils.auth import get_current_user
from utils.cricapi import get_current_matches, get_match_details, get_ipl_matches
import os

router = APIRouter()


@router.get("/matches")
async def live_matches(current_user: dict = Depends(get_current_user)):
    """
    US12: Fetch all currently live cricket matches from CricAPI.
    Frontend polls this endpoint every 30 seconds for real-time updates.
    """
    try:
        matches = await get_current_matches()
        return {
            "live_matches": matches,
            "count": len(matches),
            "source": "CricAPI"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"CricAPI unavailable: {str(e)}")


@router.get("/ipl")
async def live_ipl(current_user: dict = Depends(get_current_user)):
    """
    Fetch recent/live IPL matches specifically.
    Filters CricAPI results for IPL matches only.
    """
    try:
        matches = await get_ipl_matches()
        return {
            "ipl_matches": matches,
            "count": len(matches),
            "source": "CricAPI"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"CricAPI unavailable: {str(e)}")


@router.get("/match/{match_id}")
async def match_details(
    match_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get live scorecard for a specific match by CricAPI match ID.
    Returns innings, scores, current batsmen, bowler info.
    """
    try:
        details = await get_match_details(match_id)
        return details
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not fetch match: {str(e)}")


@router.get("/scores/demo")
async def demo_live_scores(current_user: dict = Depends(get_current_user)):
    """
    Demo endpoint with dummy live scores.
    Used when CricAPI key limit is reached or no live matches.
    """
    return {
        "live_matches": [
            {
                "id": "demo-match-001",
                "name": "Mumbai Indians vs Chennai Super Kings, IPL 2026",
                "status": "Mumbai Indians won by 6 wickets",
                "venue": "Wankhede Stadium, Mumbai",
                "date": "2026-04-23",
                "teams": ["Mumbai Indians", "Chennai Super Kings"],
                "score": [
                    {"r": 187, "w": 8, "o": 20, "inning": "Chennai Super Kings Inning 1"},
                    {"r": 190, "w": 4, "o": 18.3, "inning": "Mumbai Indians Inning 1"}
                ]
            },
            {
                "id": "demo-match-002",
                "name": "Royal Challengers Bengaluru vs Kolkata Knight Riders, IPL 2026",
                "status": "Match starts in 2 hours",
                "venue": "M. Chinnaswamy Stadium, Bengaluru",
                "date": "2026-04-23",
                "teams": ["Royal Challengers Bengaluru", "Kolkata Knight Riders"],
                "score": []
            }
        ],
        "count": 2,
        "source": "Demo Data"
    }
