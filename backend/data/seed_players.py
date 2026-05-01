import asyncio
import os
import sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from utils.database import connect_db, get_players_collection

def normalize_name(name):
    return str(name).lower().replace(".", "").strip()

DATA_DIR = os.path.dirname(__file__)
DELIVERIES_CSV = os.path.join(DATA_DIR, "deliveries.csv")
TOP_PLAYERS_CSV = os.path.join(DATA_DIR, "top_players.csv")


async def seed_players():
    await connect_db()
    players_col = get_players_collection()

    if not os.path.exists(DELIVERIES_CSV):
        print("❌ deliveries.csv not found")
        return

    print("📂 Generating players from deliveries.csv...")
    df = pd.read_csv(DELIVERIES_CSV)

    await players_col.drop()

    players = {}

    for _, row in df.iterrows():
        batter = row.get("batter")
        bowler = row.get("bowler")
        runs = row.get("batsman_runs", 0)

        if batter:
            if batter not in players:
                players[batter] = {
                    "player_name": batter,
                    "normalized_name": normalize_name(batter),
                    "total_runs": 0,
                    "balls_faced": 0,
                    "total_wickets": 0,
                    "runs_conceded": 0,
                    "balls_bowled": 0
                }

            players[batter]["total_runs"] += runs
            players[batter]["balls_faced"] += 1

        if bowler:
            if bowler not in players:
                players[bowler] = {
                    "player_name": bowler,
                    "normalized_name": normalize_name(bowler),
                    "total_runs": 0,
                    "balls_faced": 0,
                    "total_wickets": 0,
                    "runs_conceded": 0,
                    "balls_bowled": 0
                }

            players[bowler]["runs_conceded"] += runs
            players[bowler]["balls_bowled"] += 1

            if row.get("is_wicket") == 1:
                players[bowler]["total_wickets"] += 1

    final_players = []

    for p in players.values():
        batting_avg = p["total_runs"] / max(p["balls_faced"], 1)
        strike_rate = (p["total_runs"] / max(p["balls_faced"], 1)) * 100
        economy = (p["runs_conceded"] / max(p["balls_bowled"], 1)) * 6

        final_players.append({
            "player_name": p["player_name"],
            "normalized_name": p["normalized_name"],
            "batting_avg": round(batting_avg, 2),
            "strike_rate": round(strike_rate, 2),
            "matches_played": 50,
            "total_runs": p["total_runs"],
            "total_wickets": p["total_wickets"],
            "economy": round(economy, 2),
            "source": "generated"
        })

    await players_col.insert_many(final_players)
    print(f"✅ Generated {len(final_players)} players")

    # ⭐ ADD TOP PLAYERS (FIXED LOCATION)
    if os.path.exists(TOP_PLAYERS_CSV):
        print("⭐ Adding top players...")

        df_top = pd.read_csv(TOP_PLAYERS_CSV)

        for _, row in df_top.iterrows():
            player = {
                "player_name": row["player_name"],
                "normalized_name": normalize_name(row["player_name"]),
                "batting_avg": row["batting_avg"],
                "strike_rate": row["strike_rate"],
                "matches_played": row["matches_played"],
                "total_runs": row["total_runs"],
                "total_wickets": row["total_wickets"],
                "economy": row["economy"],
                "source": "top_players"
            }

            await players_col.update_one(
                {"normalized_name": player["normalized_name"]},
                {"$set": player},
                upsert=True
            )

        print("✅ Top players added")


if __name__ == "__main__":
    asyncio.run(seed_players())