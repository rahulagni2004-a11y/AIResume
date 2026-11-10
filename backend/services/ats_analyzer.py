
import re


# Technical skills supported by the ATS analyzer
TECHNICAL_SKILLS = [
    "Python",
    "Java",
    "C++",
    "C#",
    "JavaScript",
    "SQL",
    "MySQL",
    "MongoDB",
    "FastAPI",
    "React",
    "Node.js",
    "HTML",
    "CSS",
    "Git",
    "GitHub",
    "Data Structures",
    "Algorithms",
    "Object Oriented Programming",
    "OOP",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "Machine Learning",
    "Deep Learning",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "AWS",
    "Azure",
    "Docker",
    "Linux",
    "REST API"
]


STOP_WORDS = {
    "the", "and", "for", "with", "you", "are",
    "will", "our", "this", "that", "from",
    "have", "has", "your", "who", "all",
    "looking", "knowledge", "skills", "work",
    "working", "candidate", "role", "job",
    "required", "requirements", "ability",
    "good", "strong"
}


def normalize_text(text):
    """Clean text before matching."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def keyword_pattern(keyword):
    """Create a pattern for complete word or phrase matching."""
    normalized = normalize_text(keyword)

    return (
        r"(?<![a-z0-9+#])"
        + re.escape(normalized)
        + r"(?![a-z0-9+#])"
    )


def find_matches(text, keywords):
    """Find complete technical skills in text."""
    normalized_text = normalize_text(text)
    matched = []

    for keyword in keywords:
        pattern = keyword_pattern(keyword)

        if re.search(pattern, normalized_text):
            matched.append(keyword)

    return matched


def extract_job_keywords(job_description):
    """Extract useful keywords from job description."""
    words = re.findall(
        r"[a-zA-Z][a-zA-Z0-9+#]*",
        job_description.lower()
    )

    keywords = {
        word for word in words
        if len(word) > 3 and word not in STOP_WORDS
    }

    return sorted(keywords)


def calculate_ats_score(resume_text, job_description,
                        parsed_data=None):

    # Extract required technical skills from job description
    required_skills = find_matches(
        job_description,
        TECHNICAL_SKILLS
    )

    # Extract skills from parsed resume data when available
    if parsed_data and isinstance(parsed_data, dict):
        resume_skills = parsed_data.get("skills", [])
        resume_skills_text = " ".join(resume_skills)

        matched_skills = find_matches(
            resume_skills_text,
            TECHNICAL_SKILLS
        )
    else:
        matched_skills = find_matches(
            resume_text,
            TECHNICAL_SKILLS
        )

    # Find matching and missing skills
    matched_required_skills = [
        skill for skill in required_skills
        if skill in matched_skills
    ]

    missing_skills = [
        skill for skill in required_skills
        if skill not in matched_skills
    ]

    # Calculate technical skill score
    if required_skills:
        skill_score = round(
            len(matched_required_skills)
            / len(required_skills) * 100
        )
    else:
        skill_score = 0

    # Extract job description keywords
    job_keywords = extract_job_keywords(job_description)

    # Find matching keywords in resume
    normalized_resume = normalize_text(resume_text)

    matched_keywords = [
        keyword for keyword in job_keywords
        if re.search(
            keyword_pattern(keyword),
            normalized_resume
        )
    ]

    # Calculate keyword score
    if job_keywords:
        keyword_score = round(
            len(matched_keywords)
            / len(job_keywords) * 100
        )
    else:
        keyword_score = 0

    # Calculate final weighted ATS score
    final_score = round(
        (skill_score * 0.70)
        + (keyword_score * 0.30)
    )

    # Generate improvement suggestions
    suggestions = []

    if missing_skills:
        suggestions.append(
            "Consider adding relevant missing skills: "
            + ", ".join(missing_skills)
            + ". Only include skills you actually have."
        )

    if not missing_skills:
        suggestions.append(
            "Your resume contains all identified technical "
            "skills from this job description."
        )

    if keyword_score < 50:
        suggestions.append(
            "Include relevant job description terminology "
            "where it accurately describes your experience."
        )

    return {
        "ats_score": final_score,
        "skill_score": skill_score,
        "keyword_score": keyword_score,
        "matched_skills": matched_required_skills,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "total_required_skills": len(required_skills),
        "suggestions": suggestions
    }
