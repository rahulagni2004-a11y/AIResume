
import re


def clean_line(line):
    """Remove bullets and unnecessary spaces."""
    line = re.sub(r"^[\s•●▪\-*]+", "", line)
    return line.strip()


def extract_email(text):
    match = re.search(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text
    )
    return match.group(0) if match else None


def extract_phone(text):
    match = re.search(
        r"(?<!\w)(?:\+?\d{1,3}[-.\s]?)?\d{10}(?!\w)",
        text
    )
    return match.group(0).strip() if match else None


def extract_name(text):
    lines = [clean_line(line) for line in text.splitlines()]
    lines = [line for line in lines if line]

    for line in lines[:5]:
        if (
            len(line) <= 60
            and not re.search(r"[@\d]", line)
            and not any(word in line.lower() for word in
                        ["objective", "resume", "curriculum vitae"])
        ):
            return line

    return None


def extract_skills(text):
    known_skills = [
        "Python", "Java", "C++", "JavaScript", "SQL",
        "HTML", "CSS", "React", "Node.js", "FastAPI",
        "MongoDB", "MySQL", "Git", "GitHub",
        "Machine Learning", "Deep Learning",
        "Pandas", "NumPy", "Scikit-learn",
        "AWS", "Azure", "Docker", "Linux",
        "Salesforce", "REST API", "Data Structures",
        "Algorithms", "OOP", "DBMS", "Operating Systems"
    ]

    found_skills = []

    for skill in known_skills:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"

        if re.search(pattern, text, re.IGNORECASE):
            found_skills.append(skill)

    return found_skills


SECTION_ALIASES = {
    "education": [
        "education", "academic background"
    ],
    "experience": [
        "experience", "work experience",
        "professional experience", "internship",
        "internships", "employment history"
    ],
    "projects": [
        "projects", "project"
    ],
    "certifications": [
        "certifications", "certification",
        "certificates", "certificates and awards"
    ],
    "skills": [
        "skills", "technical skills", "technical expertise"
    ],
    "soft_skills": [
    "soft skills",
    "personal skills",
    "interpersonal skills"
],
}


def normalize_heading(line):
    return re.sub(r"[^a-z ]", "", line.lower()).strip()


def extract_section(text, section_name):
    lines = [
        clean_line(line)
        for line in text.splitlines()
        if clean_line(line)
    ]

    aliases = SECTION_ALIASES[section_name]

    start_index = None

    for index, line in enumerate(lines):
        normalized = normalize_heading(line)

        if normalized in aliases:
            start_index = index + 1
            break

    if start_index is None:
        return []

    section_data = []

    all_headings = [
        heading
        for heading_list in SECTION_ALIASES.values()
        for heading in heading_list
    ]

    for line in lines[start_index:]:
        normalized = normalize_heading(line)

        if normalized in all_headings:
            break

        section_data.append(line)

    return section_data


def extract_education(text):
    education = extract_section(text, "education")

    if education:
        return education

    keywords = [
        "b.tech", "bachelor", "master",
        "university", "college", "degree",
        "diploma", "m.tech", "ph.d"
    ]

    lines = [clean_line(line) for line in text.splitlines()]

    return [
        line for line in lines
        if line and any(word in line.lower() for word in keywords)
    ]


def extract_experience(text):
    return extract_section(text, "experience")


def extract_projects(text):
    return extract_section(text, "projects")


def extract_certifications(text):
    return extract_section(text, "certifications")


def parse_resume(text):
    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "education": extract_education(text),
        "experience": extract_experience(text),
        "projects": extract_projects(text),
        "certifications": extract_certifications(text)
    }
