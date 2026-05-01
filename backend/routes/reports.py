# StumpStats - Reports Route
# US10: Generate summary PDF reports for stakeholders

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from utils.auth import get_current_user
from utils.database import get_matches_collection, get_players_collection
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from datetime import datetime
import io

router = APIRouter()

# StumpStats brand colors
CRICKET_GREEN = colors.HexColor("#22c55e")
DARK_BG       = colors.HexColor("#1a1a1a")
LIGHT_TEXT    = colors.HexColor("#f0f0f0")


@router.get("/summary")
async def generate_summary_report(current_user: dict = Depends(get_current_user)):
    """
    US10: Generate a professional PDF summary report.
    Includes top batsmen, top bowlers, team performance, and season stats.
    Returns a downloadable PDF file.
    """
    matches_col = get_matches_collection()
    players_col = get_players_collection()

    # Fetch data for the report
    top_batsmen_cursor  = players_col.find({}, {"_id": 0}).sort("total_runs", -1).limit(10)
    top_bowlers_cursor  = players_col.find({}, {"_id": 0}).sort("total_wickets", -1).limit(10)
    top_batsmen  = await top_batsmen_cursor.to_list(10)
    top_bowlers  = await top_bowlers_cursor.to_list(10)
    total_matches = await matches_col.count_documents({})

    # Team wins pipeline
    wins_pipeline = [
        {"$group": {"_id": "$winner", "wins": {"$sum": 1}}},
        {"$sort": {"wins": -1}},
        {"$limit": 8}
    ]
    team_wins_raw = await matches_col.aggregate(wins_pipeline).to_list(8)

    # Build PDF in memory
    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    story  = []

    # ── Title ────────────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        textColor=CRICKET_GREEN,
        fontSize=24,
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        textColor=colors.grey,
        fontSize=11,
        spaceAfter=20
    )

    story.append(Paragraph("🏏 StumpStats", title_style))
    story.append(Paragraph("IPL Season Summary Report", title_style))
    story.append(Paragraph(
        f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')} | "
        f"Total Matches Analyzed: {total_matches}",
        subtitle_style
    ))
    story.append(Spacer(1, 0.2*inch))

    # ── Section Helper ────────────────────────────────────────────────────────
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        textColor=CRICKET_GREEN,
        fontSize=14,
        spaceBefore=16,
        spaceAfter=8
    )

    # ── Top Batsmen Table ─────────────────────────────────────────────────────
    story.append(Paragraph("Top 10 Run Scorers (IPL All Time)", section_style))

    bat_data = [["#", "Player", "Team", "Runs", "Avg", "SR"]]
    for i, p in enumerate(top_batsmen, 1):
        bat_data.append([
            str(i),
            p.get("player_name", "N/A"),
            p.get("team", "N/A"),
            str(p.get("total_runs", 0)),
            str(round(p.get("batting_avg", 0), 1)),
            str(round(p.get("strike_rate", 0), 1))
        ])

    bat_table = Table(bat_data, colWidths=[0.4*inch, 2*inch, 2*inch, 0.8*inch, 0.8*inch, 0.8*inch])
    bat_table.setStyle(_table_style())
    story.append(bat_table)
    story.append(Spacer(1, 0.15*inch))

    # ── Top Bowlers Table ─────────────────────────────────────────────────────
    story.append(Paragraph("Top 10 Wicket Takers (IPL All Time)", section_style))

    bowl_data = [["#", "Player", "Team", "Wickets", "Econ", "Avg"]]
    for i, p in enumerate(top_bowlers, 1):
        bowl_data.append([
            str(i),
            p.get("player_name", "N/A"),
            p.get("team", "N/A"),
            str(p.get("total_wickets", 0)),
            str(round(p.get("economy", 0), 2)),
            str(round(p.get("bowling_avg", 0), 1))
        ])

    bowl_table = Table(bowl_data, colWidths=[0.4*inch, 2*inch, 2*inch, 0.8*inch, 0.8*inch, 0.8*inch])
    bowl_table.setStyle(_table_style())
    story.append(bowl_table)
    story.append(Spacer(1, 0.15*inch))

    # ── Team Wins Table ───────────────────────────────────────────────────────
    story.append(Paragraph("Team Performance Overview", section_style))

    wins_data = [["Team", "Total Wins"]]
    for tw in team_wins_raw:
        wins_data.append([tw.get("_id", "N/A"), str(tw.get("wins", 0))])

    wins_table = Table(wins_data, colWidths=[3.5*inch, 2*inch])
    wins_table.setStyle(_table_style())
    story.append(wins_table)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3*inch))
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        textColor=colors.grey, fontSize=9, alignment=1
    )
    story.append(Paragraph(
        "StumpStats — IPL Cricket Analytics Platform | Data sourced from Kaggle IPL Dataset & CricAPI",
        footer_style
    ))

    # Build PDF
    doc.build(story)
    buffer.seek(0)

    filename = f"StumpStats_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def _table_style():
    """Returns a consistent dark-themed table style for the PDF."""
    return TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0),  CRICKET_GREEN),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  10),
        ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
        ("ROWBACKGROUNDS",(0,1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("FONTSIZE",     (0, 1), (-1, -1), 9),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
    ])
