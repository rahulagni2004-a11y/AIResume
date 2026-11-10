
import re


# Equivalent names for common technical skills
SKILL_ALIASES = {
    "oop": [
        "oop",
        "object oriented programming",
        "object-oriented programming"
    ],
    "javascript": [
        "javascript",
        "js"
    ],
    "node.js": [
        "node.js",
        "nodejs"
    ],
    "rest api": [
        "rest api",
        "restful api",
        "rest apis"
    ],
    "sql": [
        "sql",
        "structured query language"
    ],
    "machine learning": [
        "machine learning",
        "ml"
    ],
    "data structures": [
        "data structures",
        "data structure"
    ],
    "c++": [
        "c++",
        "cpp"
    ],
    "c#": [
        "c#",
        "c sharp"
    ]
}


def normalize_skill(skill):
    """Normalize skill names and recognize aliases."""

    skill = skill.lower().strip()
    skill = re.sub(r"[^a-z0-9+#. ]", " ", skill)
    skill = re.sub(r"\s+", " ", skill).strip()

    for canonical, aliases in SKILL_ALIASES.items():
        normalized_aliases = [
            re.sub(r"\s+", " ", alias.lower()).strip()
            for alias in aliases
        ]

        if skill in normalized_aliases:
            return canonical

    return skill


def recommend_jobs(resume_skills, jobs):
    """Recommend jobs based on resume skills."""

    normalized_resume_skills = {
        normalize_skill(skill)
        for skill in resume_skills
        if isinstance(skill, str) and skill.strip()
    }

    recommendations = []
    seen_job_ids = set()

    for job in jobs:

        job_id = str(job.get("_id", ""))

        # Avoid duplicate job records in recommendations
        if job_id in seen_job_ids:
            continue

        seen_job_ids.add(job_id)

        required_skills = job.get("required_skills", [])

        required_skills = list(dict.fromkeys(
            skill.strip()
            for skill in required_skills
            if isinstance(skill, str) and skill.strip()
        ))

        if not required_skills:
            continue

        matched_skills = []
        missing_skills = []

        for skill in required_skills:

            normalized_skill = normalize_skill(skill)

            if normalized_skill in normalized_resume_skills:
                matched_skills.append(skill)
            else:
                missing_skills.append(skill)

        match_score = round(
            len(matched_skills) / len(required_skills) * 100
        )

        recommendations.append({
            "job_id": job_id,
            "title": job.get("title"),
            "company": job.get("company"),
            "location": job.get("location"),
            "salary": job.get("salary"),
            "job_type": job.get("job_type"),
            "match_score": match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills
        })

    recommendations.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return recommendations
