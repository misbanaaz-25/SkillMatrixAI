from io import BytesIO
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)

ACCENT = colors.HexColor("#6C5CE7")
DARK = colors.HexColor("#1F2430")
MUTED = colors.HexColor("#6B7280")
GREEN = colors.HexColor("#16A34A")
RED = colors.HexColor("#DC2626")
LIGHT_BG = colors.HexColor("#F3F4F8")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=base["Title"], fontSize=22, textColor=DARK,
            alignment=0, spaceAfter=2,
        ),
        "sub": ParagraphStyle(
            "sub", parent=base["Normal"], fontSize=9, textColor=MUTED, spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontSize=13, textColor=ACCENT,
            spaceBefore=12, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontSize=10, leading=14, textColor=DARK,
        ),
        "small": ParagraphStyle(
            "small", parent=base["Normal"], fontSize=8.5, leading=12, textColor=MUTED,
        ),
        "skill": ParagraphStyle(
            "skill", parent=base["Heading3"], fontSize=11.5, textColor=DARK,
            spaceBefore=6, spaceAfter=3,
        ),
        "cell_label": ParagraphStyle(
            "cell_label", parent=base["Normal"], fontSize=8.5, textColor=MUTED,
            alignment=1,
        ),
        "cell_value": ParagraphStyle(
            "cell_value", parent=base["Normal"], fontSize=20, leading=24,
            textColor=ACCENT, alignment=1,
        ),
    }


def _p(text, style):
    return Paragraph(escape(str(text)), style)


def _join(skills):
    return ", ".join(skills) if skills else "None"


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 12 * mm, "SkillMatrixAI - Resume & Skill Gap Report")
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_report_pdf(data: dict) -> bytes:
    s = _styles()
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="SkillMatrixAI Report",
    )
    story = []

    # ---- Header ----
    story.append(_p("SkillMatrixAI Report", s["title"]))
    generated = datetime.now().strftime("%d %b %Y, %I:%M %p")
    story.append(
        _p(f"Resume: {data.get('filename', 'N/A')}   |   Generated: {generated}", s["sub"])
    )

    # ---- Score cards ----
    def card(label, value):
        return [_p(f"{value}%", s["cell_value"]), _p(label, s["cell_label"])]

    scores = Table(
        [[
            card("Overall Match", data.get("match_score", 0)),
            card("Skill Match", data.get("skill_match_score", 0)),
            card("Text Similarity", data.get("text_similarity_score", 0)),
        ]],
        colWidths=[56 * mm, 56 * mm, 56 * mm],
    )
    scores.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8DAE5")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8DAE5")),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(scores)
    story.append(Spacer(1, 4))
    story.append(
        _p(
            data.get("note", "This score is an estimate, not a guarantee of selection."),
            s["small"],
        )
    )
    story.append(
        _p(f"Skills detected in job description: {data.get('job_skills_detected', 0)}", s["small"])
    )

    # ---- Skills sections ----
    story.append(_p("Matched Skills", s["h2"]))
    story.append(_p(_join(data.get("matched_skills", [])), s["body"]))

    story.append(_p("Missing Skills", s["h2"]))
    story.append(_p(_join(data.get("missing_skills", [])), s["body"]))

    story.append(_p("Extra Skills (in your resume, not required by the job)", s["h2"]))
    story.append(_p(_join(data.get("extra_skills", [])), s["body"]))

    # ---- Roadmap ----
    roadmap = data.get("roadmap", [])
    if roadmap:
        story.append(_p("Personalized Learning Roadmap", s["h2"]))
        for item in roadmap:
            block = [
                _p(f"{item.get('priority', '-')}. {item.get('skill', '')}", s["skill"])
            ]
            for step in item.get("steps", []):
                block.append(_p(f"-  {step}", s["body"]))
            if item.get("practice_project"):
                block.append(Spacer(1, 3))
                block.append(_p(f"Practice project: {item['practice_project']}", s["body"]))
            if item.get("resources"):
                block.append(_p(f"Resources: {_join(item['resources'])}", s["small"]))
            block.append(Spacer(1, 6))
            story.append(KeepTogether(block))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buffer.getvalue()