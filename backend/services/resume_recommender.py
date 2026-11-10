import re


SKILL_ALIASES = {
    "python": ["python"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "javascript": ["javascript", "js"],
    "sql": ["sql", "structured query language"],
    "mysql": ["mysql"],
    "mongodb": ["mongodb", "mongo db"],
    "fastapi": ["fastapi"],
    "react": ["react", "reactjs"],
    "node.js": ["node.js", "nodejs"],
    "html": ["html"],
    "css": ["css"],
    "git": ["git"],
    "github": ["github"],
    "dbms": ["dbms", "database management system"],
    "oop": ["oop", "object oriented programming",
            "object-oriented programming"],
    "data structures": ["data structures", "data structure"],
    "algorithms": ["algorithms", "algorithm"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "azure": ["azure"],
    "aws": ["aws", "amazon web services"],
    "docker": ["docker"],
    "linux": ["linux"],
    "rest api": ["rest api", "restful api"]
}


def contains_skill(text, aliases):
    for alias in aliases:
        pattern = r"(?<!\w)" + re.escape(alias) + r"(?!\w)"

        if re.search(pattern, text, re.IGNORECASE):
            return True

    return False


def generate_resume_suggestions(resume_text, parsed_data, job_description):

    suggestions = []

    resume_text = resume_text or ""
    job_description = job_description or ""

    # Check technical skills
    resume_skills = parsed_data.get("skills", [])

    resume_skill_text = " ".join(resume_skills) + " " + resume_text

    missing_skills = []

    for skill, aliases in SKILL_ALIASES.items():

        required_in_job = contains_skill(job_description, aliases)
        present_in_resume = contains_skill(resume_skill_text, aliases)

        if required_in_job and not present_in_resume:
            missing_skills.append(skill.upper())

    if missing_skills:
        suggestions.append({
            "category": "Technical Skills",
            "suggestion": (
                "Consider adding these relevant skills if you have "
                "experience with them: " + ", ".join(missing_skills)
            )
        })

    # Check projects
    projects = parsed_data.get("projects", [])

    if not projects:
        suggestions.append({
            "category": "Projects",
            "suggestion": (
                "Add relevant academic or personal projects "
                "with technologies used and your contribution."
            )
        })

    # Check experience
    experience = parsed_data.get("experience", [])

    if not experience:
        suggestions.append({
            "category": "Experience",
            "suggestion": (
                "If you have completed internships, training "
                "or practical work, consider including them."
            )
        })

    # Check certifications
    certifications = parsed_data.get("certifications", [])

    if not certifications:
        suggestions.append({
            "category": "Certifications",
            "suggestion": "Include relevant technical certifications you have completed."
        })

    # Check education
    education = parsed_data.get("education", [])

    if not education:
        suggestions.append({
            "category": "Education",
            "suggestion": "Add your degree, college, university and graduation year."
        })

    # Check resume content
    word_count = len(re.findall(r"\b\w+\b", resume_text))

    if word_count < 150:
        suggestions.append({
            "category": "Resume Content",
            "suggestion": (
                "Your extracted resume contains limited text. "
                "Check whether all sections are readable and include relevant details."
            )
        })

    # Check soft skills
    important_keywords = [
        "communication",
        "problem solving",
        "teamwork",
        "leadership",
        "analytical"
    ]

    missing_keywords = [
        keyword for keyword in important_keywords
        if contains_skill(job_description, [keyword])
        and not contains_skill(resume_text, [keyword])
    ]

    if missing_keywords:
        suggestions.append({
            "category": "Soft Skills",
            "suggestion": (
                "Consider mentioning relevant soft skills with examples: "
                + ", ".join(missing_keywords)
            )
        })

    if not suggestions:
        suggestions.append({
            "category": "Overall",
            "suggestion": (
                "Your resume covers the checked sections. "
                "Continue tailoring it to each job description."
            )
        })

    return {
        "total_suggestions": len(suggestions),
        "suggestions": suggestions
    }