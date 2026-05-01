# 🏏 StumpStats — Backend Setup Guide (Windows)

## Prerequisites
- Python 3.11+ installed
- MongoDB installed and running
- Node.js 18+ (for frontend later)
- Your Kaggle IPL dataset (matches.csv + deliveries.csv)

---

## Step 1: Set Up Python Environment

Open **Command Prompt** or **PowerShell** in the `backend/` folder:

```bash
# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

---

## Step 2: Configure Environment Variables

```bash
# Copy the example env file
copy .env.example .env
```

Open `.env` and update:
- `SECRET_KEY` → any long random string
- `CRICAPI_KEY` → `852ebfe0-af68-4331-80c0-b862acb32651` (already set)
- `MONGO_URI` → `mongodb://localhost:27017` (default)

---

## Step 3: Start MongoDB

Make sure MongoDB is running. If installed as a service it starts automatically.
Otherwise run:
```bash
mongod
```

---

## Step 4: Place Your IPL Dataset

Put your Kaggle CSV files here:
```
backend/
└── data/
    ├── matches.csv       ← from Kaggle
    └── deliveries.csv    ← from Kaggle
```

---

## Step 5: Seed the Database

```bash
# From backend/ folder with venv activated:
python data/seed_db.py
```

This loads all IPL data (2008–2020) into MongoDB.
Takes about 2–3 minutes.

---

## Step 6: Train ML Models

```bash
python ml/train_models.py
```

This trains:
- 🤖 Random Forest → player performance prediction
- 🤖 XGBoost → match outcome prediction

Takes about 1–2 minutes.

---

## Step 7: Run the API Server

```bash
uvicorn main:app --reload --port 8000
```

API is now live at: **http://localhost:8000**

---

## API Documentation

FastAPI auto-generates docs:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:**      http://localhost:8000/redoc

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → get JWT token |
| GET  | `/api/dashboard/stats` | Dashboard summary |
| GET  | `/api/players/` | List all players |
| GET  | `/api/players/{name}/history` | Player stats history |
| GET  | `/api/players/compare?player1=X&player2=Y` | Compare players |
| POST | `/api/predictions/player` | Predict player performance |
| POST | `/api/predictions/match` | Predict match outcome |
| GET  | `/api/live/matches` | Live match scores |
| POST | `/api/upload/matches` | Upload matches CSV |
| POST | `/api/upload/deliveries` | Upload deliveries CSV |
| GET  | `/api/reports/summary` | Download PDF report |
| GET  | `/api/ml/metrics` | ML model accuracy stats |
| POST | `/api/ml/retrain` | Retrain ML models |

---

## Roles & Access

| Role | Permissions |
|------|-------------|
| `fan` | View all data, predictions, live scores |
| `analyst` | fan + upload CSV, generate reports, retrain models |
| `admin` | analyst + manage users |

---

## Project Structure

```
backend/
├── main.py                  ← FastAPI app entry point
├── requirements.txt         ← Python dependencies
├── .env                     ← Your config (never commit this!)
├── routes/
│   ├── auth.py              ← US5: Login/Register
│   ├── dashboard.py         ← US6: Dashboard charts
│   ├── players.py           ← US1, US4: Player history & compare
│   ├── matches.py           ← Match listing
│   ├── predictions.py       ← US2, US3: AI predictions
│   ├── upload.py            ← US9, US11: CSV upload
│   ├── reports.py           ← US10: PDF report
│   ├── live.py              ← US12: Live CricAPI data
│   └── ml_metrics.py        ← US7: ML accuracy metrics
├── models/
│   └── schemas.py           ← Pydantic request/response models
├── ml/
│   ├── train_models.py      ← Full ML training pipeline
│   └── saved_models/        ← Trained .pkl files go here
├── data/
│   ├── seed_db.py           ← Load CSVs → MongoDB
│   ├── matches.csv          ← Your Kaggle file
│   └── deliveries.csv       ← Your Kaggle file
└── utils/
    ├── auth.py              ← JWT + bcrypt helpers
    ├── cricapi.py           ← CricAPI integration
    └── database.py          ← MongoDB connection
```
