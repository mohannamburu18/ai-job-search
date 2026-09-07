from typing import Dict, Any, List, Optional
from datetime import datetime

def generate_interview_prep(job: Dict[str, Any], profile: Dict[str, Any], stage: str = "technical") -> Dict[str, Any]:
    """
    Build stage-specific prep pack per .claude/commands/interview.md and 07-interview-prep.md:
    1. Likely questions
    2. STAR answer mapping
    3. Consistency brief
    4. Tough questions, customized
    5. Questions to ask the employer
    """
    company = job.get("company", "Target Company")
    role = job.get("title", "Software Engineer")
    skills = profile.get("skills_primary", ["Python", "Cloud Architecture"])
    primary_tech = skills[0] if skills else "Software Engineering"
    
    # 1. Company Intel Brief
    company_intel = {
        "company": company,
        "role": role,
        "stage": stage,
        "key_focus": f"Production engineering and technical architecture in {primary_tech}",
        "culture_signals": "Values ownership, proactive debugging, clear asynchronous documentation, and scalable system delivery."
    }

    # 2. Stage-Specific Questions
    likely_questions = []
    if stage == "screening":
        likely_questions = [
            {
                "question": "Can you walk me through your background and why you're interested in this role?",
                "category": "Motivation & Overview",
                "why_asked": "Assesses narrative clarity, genuine interest in the company, and communication skills.",
                "suggested_talking_points": [
                    f"Highlight progression in {skills[0] if skills else 'engineering'}.",
                    f"Explain why {company}'s domain and product challenges excite you.",
                    "Keep answer under 2 minutes, focusing on impact and trajectory."
                ],
                "star_example": {
                    "situation": "Transitioning to higher scale system challenges.",
                    "task": "Identify an organization with strong technical standards.",
                    "action": f"Researched {company}'s public technical initiatives and matched with personal stack.",
                    "result": "Directly prepared to contribute to current quarter objectives."
                }
            },
            {
                "question": "What are your salary expectations and availability to start?",
                "category": "Logistics",
                "why_asked": "Confirm alignment before proceeding to expensive technical rounds.",
                "suggested_talking_points": [
                    "State a research-backed competitive range for your level and location.",
                    "Note standard notice period (e.g. 2-4 weeks) or immediate availability."
                ],
                "star_example": None
            }
        ]
    elif stage == "behavioral":
        likely_questions = [
            {
                "question": "Describe a situation where you had a disagreement with a team member or technical lead. How did you resolve it?",
                "category": "Conflict Resolution",
                "why_asked": "Evaluates emotional intelligence, data-driven reasoning, and collaboration under pressure.",
                "suggested_talking_points": [
                    "Emphasize objective evaluation over ego (benchmarks, user needs, trade-offs).",
                    "Show how you reached consensus and maintained a positive working relationship."
                ],
                "star_example": {
                    "situation": "A disagreement occurred over whether to refactor a legacy monolithic module or build an isolated microservice.",
                    "task": "Maintain sprint delivery timeline without incurring critical technical debt.",
                    "action": "Built a rapid prototype and benchmarked latency and maintenance overhead with team.",
                    "result": "Agreed on a phased hybrid approach that shipped on time with 0 regression."
                }
            },
            {
                "question": "Tell me about a time a production issue occurred on software you worked on. What did you do?",
                "category": "Ownership & Incident Response",
                "why_asked": "Tests composure, blameless root-cause analysis, and mitigation discipline.",
                "suggested_talking_points": [
                    "Focus on fast triage, communicating proactively, and implementing automated safeguards."
                ],
                "star_example": {
                    "situation": "A database connection leak degraded API responsiveness during peak traffic.",
                    "task": "Restore service availability immediately and eliminate recurrence.",
                    "action": "Rolled back the offending deployment, patched connection pool teardown, and added health telemetry.",
                    "result": "Mean time to recovery was under 15 minutes; post-mortem added automated regression tests."
                }
            }
        ]
    else: # Technical / Architecture
        likely_questions = [
            {
                "question": f"How do you approach designing a resilient, scalable backend service using {primary_tech}?",
                "category": "System Architecture",
                "why_asked": "Evaluates architectural depth, awareness of bottlenecks, caching, and database trade-offs.",
                "suggested_talking_points": [
                    "Mention clean layered design (domain, repository, service boundaries).",
                    "Discuss idempotency, caching strategies (Redis), asynchronous background processing, and rate limiting.",
                    "Address observability: structured logging, metrics, and tracing."
                ],
                "star_example": {
                    "situation": "Existing endpoints experienced high latency under concurrent spikes.",
                    "task": "Redesign ingestion service for sub-100ms response times at 10x scale.",
                    "action": "Decoupled writes using an asynchronous task queue and added distributed cache.",
                    "result": "P99 latency dropped by 65%, handling peak throughput seamlessly."
                }
            },
            {
                "question": "How do you test your code to ensure reliability before deploying to production?",
                "category": "Engineering Standards",
                "why_asked": "Differentiates casual coders from disciplined production engineers.",
                "suggested_talking_points": [
                    "Pytest / unit tests with high boundary condition coverage.",
                    "Integration tests with isolated test containers / ephemeral databases.",
                    "Strict linting, type checks, and automated CI/CD pipeline gating."
                ],
                "star_example": None
            }
        ]

    # 3. Consistency Brief (Anchors from submitted CV)
    consistency_brief = [
        f"Be prepared to explain every bullet point listed under your recent roles with concrete metrics.",
        f"Confirm that technical stack claims around {', '.join(skills[:3])} reflect your genuine hands-on experience.",
        "Acknowledge gaps candidly with bridge answers ('While I haven't used X in production daily, it maps closely to my work with Y')."
    ]

    # 4. Questions to ask the Interviewer
    questions_to_ask = [
        f"What are the biggest technical and architectural priorities for the {role} team over the next 6 months?",
        "How does the engineering organization measure success and balance new feature velocity with technical debt?",
        "What does the day-to-day deployment and code review workflow look like for engineers on this team?",
        "What opportunities exist for engineers to lead technical initiatives or mentor others?"
    ]

    return {
        "company": company,
        "role": role,
        "stage": stage,
        "company_intel": company_intel,
        "likely_questions": likely_questions,
        "consistency_brief": consistency_brief,
        "questions_to_ask": questions_to_ask
    }

def process_mock_chat(role: str, company: str, stage: str, user_message: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Interactive mock interview response with real-time feedback and STAR alignment.
    """
    msg_lower = user_message.lower()
    
    # Check for STAR methodology
    has_situation = any(w in msg_lower for w in ("when", "at my", "in my previous", "during", "project", "team"))
    has_action = any(w in msg_lower for w in ("i built", "i designed", "i implemented", "i resolved", "i refactored", "i analyzed"))
    has_result = any(w in msg_lower for w in ("reduced", "improved", "resulting", "increased", "achieved", "delivered", "outcome"))
    
    feedback = ""
    if not has_result:
        feedback = "💡 Pro Tip: Your answer explains the actions well, but remember to finish with a concrete Result or quantifiable metric (e.g. 'reduced latency by 30%', 'shipped 2 weeks ahead of schedule')."
    elif not has_action:
        feedback = "💡 Pro Tip: Focus more on your specific individual contribution ('I analyzed...', 'I spearheaded...') rather than generic team actions."
    else:
        feedback = "✨ Excellent STAR structure! You provided clear context, articulated your specific actions, and highlighted a tangible result."

    # Generate interviewer persona follow-up question
    if len(history) < 2:
        reply = (
            f"Thanks for sharing that overview. Digging deeper into your technical work relevant to the {role} role at {company}: "
            f"Could you describe a specific time when you had to make an architectural trade-off between speed of delivery and code scalability? "
            f"What factors did you weigh, and what was the outcome?"
        )
    elif len(history) < 4:
        reply = (
            f"That gives me great insight into your decision-making process. Let's touch on how you operate under pressure: "
            f"Suppose a critical feature breaks in production right after a release, and the team lead is unavailable. "
            f"Walk me step-by-step through your triage and resolution playbook."
        )
    else:
        reply = (
            f"Very thorough response. You communicated your reasoning with composure and clarity. "
            f"Before we wrap up our practice round for {company}: What questions do you have for me about the team's engineering culture or upcoming milestones?"
        )

    return {
        "reply": reply,
        "feedback": feedback,
        "suggested_star_anchor": "Situation: context -> Task: goal -> Action: your direct work -> Result: quantifiable impact"
    }

