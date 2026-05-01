# StumpStats - CricAPI Integration Utility
# Handles all calls to cricapi.com for live/recent IPL data

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

CRICAPI_KEY = os.getenv("CRICAPI_KEY")
CRICAPI_BASE_URL = os.getenv("CRICAPI_BASE_URL", "https://api.cricapi.com/v1")


async def cricapi_get(endpoint: str, params: dict = {}) -> dict:
    """
    Generic async GET helper for CricAPI.
    Automatically injects the API key into every request.
    """
    params["apikey"] = CRICAPI_KEY
    url = f"{CRICAPI_BASE_URL}/{endpoint}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # CricAPI returns status field
        if data.get("status") != "success":
            raise Exception(f"CricAPI error: {data.get('reason', 'Unknown error')}")

        return data


async def get_current_matches() -> list:
    """Fetch all currently live cricket matches (US12 - Real-time)."""
    data = await cricapi_get("currentMatches")
    return data.get("data", [])


async def get_ipl_matches() -> list:
    """Fetch recent IPL matches from CricAPI."""
    data = await cricapi_get("matches", {"offset": 0})
    matches = data.get("data", [])
    # Filter for IPL matches only
    ipl = [m for m in matches if "IPL" in m.get("name", "") or "Indian Premier League" in m.get("name", "")]
    return ipl


async def get_match_details(match_id: str) -> dict:
    """Fetch detailed scorecard for a specific match."""
    data = await cricapi_get("match_info", {"id": match_id})
    return data.get("data", {})


async def get_player_info(player_id: str) -> dict:
    """Fetch player info and stats from CricAPI."""
    data = await cricapi_get("players_info", {"id": player_id})
    return data.get("data", {})


async def search_player(name: str) -> list:
    """Search for a player by name."""
    data = await cricapi_get("players", {"search": name})
    return data.get("data", [])


async def get_series_list() -> list:
    """Fetch list of current/recent series."""
    data = await cricapi_get("series", {"offset": 0})
    return data.get("data", [])
