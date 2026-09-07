import os
import re
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Tuple
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.app.core.config import settings

def escape_latex(text: str) -> str:
    """Escape LaTeX special characters."""
    conv = {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\^{}",
        "\\": r"\textbackslash{}",
    }
    regex = re.compile("|".join(re.escape(str(key)) for key in sorted(conv.keys(), key=lambda item: -len(item))))
    return regex.sub(lambda match: conv[match.group()], str(text or ""))

def generate_tailored_resume_latex(profile: Dict[str, Any], job: Dict[str, Any]) -> str:
    """Generate professional moderncv banking LaTeX source code."""
    name_parts = profile.get("name", "Candidate Name").split(maxsplit=1)
    first_name = name_parts[0] if name_parts else "Candidate"
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    email = profile.get("email", "")
    phone = profile.get("phone", "")
    location = profile.get("location", "")
    linkedin = profile.get("linkedin_url", "")
    github = profile.get("github_url", "")

    primary_skills = ", ".join(profile.get("skills_primary", []))
    secondary_skills = ", ".join(profile.get("skills_secondary", []))
    tools = ", ".join(profile.get("tools_software", []))

    job_title = job.get("title", "Software Engineer")
    company = job.get("company", "Target Company")

    latex = f"""%% Tailored CV for {escape_latex(name_parts[0])} {escape_latex(last_name)}
%% Target Role: {escape_latex(job_title)} at {escape_latex(company)}
\\documentclass[11pt,a4paper,sans]{{moderncv}}
\\moderncvstyle{{banking}}
\\moderncvcolor{{blue}}
\\usepackage[utf8]{{inputenc}}
\\usepackage[scale=0.82]{{geometry}}
\\usepackage{{hyperref}}

\\name{{{escape_latex(first_name)}}}{{{escape_latex(last_name)}}}
\\address{{{escape_latex(location)}}}{{}}{{}}
\\phone[mobile]{{{escape_latex(phone)}}}
\\email{{{escape_latex(email)}}}
\\extrainfo{{\\href{{{escape_latex(linkedin)}}}{{LinkedIn}} | \\href{{{escape_latex(github)}}}{{GitHub}}}}

\\begin{{document}}
\\makecvtitle

\\vspace{{-10pt}}
\\section{{Profile Statement}}
Results-driven {escape_latex(job_title)} with proven experience designing, scaling, and maintaining mission-critical applications. Demonstrates expertise across {escape_latex(primary_skills)}, applying modern engineering best practices and agile methodologies to deliver measurable business impact.

\\section{{Technical Skills}}
\\begin{{itemize}}
  \\item \\textbf{{Primary Technologies:}} {escape_latex(primary_skills)}
  \\item \\textbf{{Secondary & Frameworks:}} {escape_latex(secondary_skills)}
  \\item \\textbf{{Developer Tools & DevOps:}} {escape_latex(tools)}
\\end{{itemize}}

\\section{{Professional Experience}}
"""
    for exp in profile.get("experience", []):
        title = escape_latex(exp.get("title", "Software Engineer"))
        comp = escape_latex(exp.get("company", "Company"))
        loc = escape_latex(exp.get("location", "Location"))
        start = escape_latex(exp.get("start_date", "2022"))
        end = escape_latex(exp.get("end_date", "Present"))
        
        latex += f"""\\cventry{{{start}--{end}}}{{{title}}}{{{comp}}}{{{loc}}}{{}}{{
\\begin{{itemize}}
"""
        for bullet in exp.get("bullets", []):
            latex += f"  \\item {escape_latex(bullet)}\n"
        latex += """\\end{itemize}}
\\vspace{4pt}
"""

    latex += """\\section{Education}
"""
    for edu in profile.get("education", []):
        deg = escape_latex(edu.get("degree", "Degree"))
        inst = escape_latex(edu.get("institution", "University"))
        years = f"{edu.get('start_year', '')}--{edu.get('end_year', '')}".strip("-")
        topics = escape_latex(edu.get("topics", ""))
        latex += f"\\cventry{{{years}}}{{{deg}}}{{{inst}}}{{}}{{}}{{{topics}}}\n"

    latex += """\\end{document}
"""
    return latex

def generate_cover_letter_latex(profile: Dict[str, Any], job: Dict[str, Any], tone: str = "Professional") -> Tuple[str, str]:
    """Generate cover letter LaTeX and text content."""
    name = profile.get("name", "Candidate Name")
    email = profile.get("email", "")
    phone = profile.get("phone", "")
    company = job.get("company", "Hiring Team")
    role = job.get("title", "Software Engineer")
    skills = ", ".join(profile.get("skills_primary", [])[:3])

    if tone == "Confident":
        pitch = f"I am writing to express my strong interest in the {role} position at {company}. With deep expertise in {skills} and a track record of driving technical excellence, I am confident in my ability to immediately accelerate your engineering deliverables."
    elif tone == "Collaborative":
        pitch = f"I am excited to submit my application for the {role} role at {company}. Having followed your product innovations, I am eager to contribute my skills in {skills} to your collaborative engineering culture."
    else:
        pitch = f"I am writing to formally apply for the {role} position at {company}. My technical background in {skills}, combined with hands-on experience building resilient systems, aligns directly with the requirements outlined in your job posting."

    text_body = f"""Dear Hiring Team,

{pitch}

Throughout my career, I have focused on writing clean, maintainable code, designing scalable services, and collaborating closely with cross-functional product teams. At my previous roles, I have spearheaded core architecture enhancements, streamlined CI/CD delivery pipelines, and resolved critical production bottlenecks.

The engineering challenges at {company} present an ideal environment to apply my problem-solving capabilities and passion for continuous improvement. I welcome the opportunity to discuss how my technical foundation and pragmatic delivery mindset will benefit your team.

Thank you for your time and consideration.

Sincerely,
{name}
{email} | {phone}
"""

    latex = f"""\\documentclass[11pt,a4paper]{{letter}}
\\usepackage[scale=0.8]{{geometry}}
\\usepackage{{hyperref}}

\\address{{{escape_latex(name)} \\\\ {escape_latex(email)} \\\\ {escape_latex(phone)}}}
\\signature{{{escape_latex(name)}}}

\\begin{{document}}
\\begin{{letter}}{{{escape_latex(company)} \\\\ Hiring Committee}}
\\opening{{Dear Hiring Team,}}

{escape_latex(pitch)}

Throughout my career, I have focused on writing clean, maintainable code, designing scalable services, and collaborating closely with cross-functional product teams. At my previous roles, I have spearheaded core architecture enhancements, streamlined CI/CD delivery pipelines, and resolved critical production bottlenecks.

The engineering challenges at {escape_latex(company)} present an ideal environment to apply my problem-solving capabilities and passion for continuous improvement. I welcome the opportunity to discuss how my technical foundation and pragmatic delivery mindset will benefit your team.

\\closing{{Sincerely,}}
\\end{{letter}}
\\end{{document}}
"""
    return latex, text_body

def render_resume_pdf(profile: Dict[str, Any], job: Dict[str, Any], output_pdf: Path) -> Path:
    """Renders pixel-perfect 2-page executive moderncv style PDF using ReportLab."""
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output_pdf),
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e3a8a")
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4b5563")
    )
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1f2937")
    )
    job_header_style = ParagraphStyle(
        'JobHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#111827")
    )
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        leftIndent=12,
        textColor=colors.HexColor("#374151")
    )

    story = []
    # Header
    name = profile.get("name", "Candidate Name")
    contact = f"{profile.get('email', '')} &bull; {profile.get('phone', '')} &bull; {profile.get('location', '')}"
    links = f"LinkedIn: {profile.get('linkedin_url', '')} | GitHub: {profile.get('github_url', '')}"
    
    story.append(Paragraph(name, title_style))
    story.append(Paragraph(contact, subtitle_style))
    story.append(Paragraph(links, subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceBefore=2, spaceAfter=8))

    # Profile Statement
    story.append(Paragraph("PROFILE STATEMENT", section_style))
    role = job.get("title", "Software Engineer")
    company = job.get("company", "Target Organization")
    profile_stmt = (
        f"Versatile {role} tailored for {company}. Combines solid hands-on engineering experience "
        f"with proficiency in {', '.join(profile.get('skills_primary', ['Software Development'])[:4])}. "
        f"Proven track record of designing scalable architectures, adhering to strict clean code standards, "
        f"and collaborating in fast-paced product environments."
    )
    story.append(Paragraph(profile_stmt, body_style))
    story.append(Spacer(1, 6))

    # Technical Skills
    story.append(Paragraph("TECHNICAL COMPETENCIES", section_style))
    skills_data = [
        [Paragraph("<b>Primary Stack:</b>", body_style), Paragraph(", ".join(profile.get("skills_primary", [])), body_style)],
        [Paragraph("<b>Frameworks & Tools:</b>", body_style), Paragraph(", ".join(profile.get("skills_secondary", [])), body_style)],
        [Paragraph("<b>DevOps & Infrastructure:</b>", body_style), Paragraph(", ".join(profile.get("tools_software", [])), body_style)],
    ]
    t = Table(skills_data, colWidths=[120, 400])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))

    # Professional Experience
    story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_style))
    for exp in profile.get("experience", []):
        hdr = f"<b>{exp.get('title')}</b> — {exp.get('company')} ({exp.get('location', '')})"
        dates = f"<i>{exp.get('start_date', '')} – {exp.get('end_date', 'Present')}</i>"
        tbl = Table([[Paragraph(hdr, job_header_style), Paragraph(dates, subtitle_style)]], colWidths=[380, 140])
        tbl.setStyle(TableStyle([('ALIGN', (1,0), (1,0), 'RIGHT')]))
        story.append(tbl)
        for bullet in exp.get("bullets", []):
            story.append(Paragraph(f"&bull; {bullet}", bullet_style))
        story.append(Spacer(1, 6))

    # Education
    story.append(Paragraph("EDUCATION", section_style))
    for edu in profile.get("education", []):
        edu_hdr = f"<b>{edu.get('degree')}</b> — {edu.get('institution')}"
        dates = f"<i>{edu.get('start_year', '')} – {edu.get('end_year', '')}</i>"
        tbl = Table([[Paragraph(edu_hdr, body_style), Paragraph(dates, subtitle_style)]], colWidths=[380, 140])
        tbl.setStyle(TableStyle([('ALIGN', (1,0), (1,0), 'RIGHT')]))
        story.append(tbl)
        if edu.get("topics"):
            story.append(Paragraph(f"Specialization: {edu.get('topics')}", subtitle_style))
        story.append(Spacer(1, 4))

    doc.build(story)
    return output_pdf

def render_cover_letter_pdf(profile: Dict[str, Any], job: Dict[str, Any], text_content: str, output_pdf: Path) -> Path:
    """Renders professional 1-page cover letter PDF using ReportLab."""
    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output_pdf),
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'NameHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e3a8a")
    )
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#4b5563")
    )
    body_style = ParagraphStyle(
        'LetterBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=10
    )

    story = []
    story.append(Paragraph(profile.get("name", "Candidate"), title_style))
    story.append(Paragraph(f"{profile.get('email', '')} &bull; {profile.get('phone', '')} &bull; {profile.get('location', '')}", meta_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#2563eb"), spaceAfter=14))

    story.append(Paragraph(f"<b>Recipient:</b> Hiring Committee, {job.get('company')}", meta_style))
    story.append(Paragraph(f"<b>Re:</b> Application for {job.get('title')}", meta_style))
    story.append(Spacer(1, 14))

    paragraphs = text_content.split("\n\n")
    for para in paragraphs:
        cleaned = para.strip()
        if cleaned:
            story.append(Paragraph(cleaned.replace("\n", "<br/>"), body_style))

    doc.build(story)
    return output_pdf

