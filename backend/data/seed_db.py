# StumpStats - Data Seeder
# Run this to populate MongoDB with your Kaggle CSVs directly (without API)
# Usage: python data/seed_db.py

import asyncio
import os
import sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from utils.database import connect_db, get_matches_collection, get_deliveries_collection
from dotenv import load_dotenv
load_dotenv()

DATA_DIR       = os.path.dirname(__file__)
MATCHES_CSV    = os.path.join(DATA_DIR, "matches.csv")
DELIVERIES_CSV = os.path.join(DATA_DIR, "deliveries.csv")


async def seed():
    await connect_db()
    matches_col    = get_matches_collection()
    deliveries_col = get_deliveries_collection()

    # ── Seed Matches ──────────────────────────────────────────────────────────
    if os.path.exists(MATCHES_CSV):
        print("📂 Loading matches.csv...")
        df = pd.read_csv(MATCHES_CSV)
        if "id" in df.columns:
            df = df.rename(columns={"id": "match_id"})
        df["match_id"] = df["match_id"].astype(str)
        records = df.where(pd.notnull(df), None).to_dict(orient="records")

        print(f"   Inserting {len(records)} matches...")
        await matches_col.drop()   # clear existing
        await matches_col.insert_many(records)
        await matches_col.create_index("match_id")
        print(f"   ✅ {len(records)} matches inserted")
    else:
        print(f"⚠️  matches.csv not found at {MATCHES_CSV}")

    # ── Seed Deliveries ────────────────────────────────────────────────────────
    if os.path.exists(DELIVERIES_CSV):
        print("\n📂 Loading deliveries.csv (this may take a minute)...")
        df = pd.read_csv(DELIVERIES_CSV)
        df["match_id"] = df["match_id"].astype(str)
        records = df.where(pd.notnull(df), None).to_dict(orient="records")

        print(f"   Inserting {len(records):,} deliveries in batches...")
        await deliveries_col.drop()

        # Insert in batches of 5000 to avoid memory issues
        batch_size = 5000
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            await deliveries_col.insert_many(batch)
            print(f"   ... {min(i+batch_size, len(records)):,} / {len(records):,}", end="\r")

        await deliveries_col.create_index("match_id")
        await deliveries_col.create_index("batter")
        await deliveries_col.create_index("bowler")
        print(f"\n   ✅ {len(records):,} deliveries inserted")
    else:
        print(f"⚠️  deliveries.csv not found at {DELIVERIES_CSV}")

    print("\n🎉 Database seeding complete!")
    print("   Next step: python ml/train_models.py")


if __name__ == "__main__":
    asyncio.run(seed())
