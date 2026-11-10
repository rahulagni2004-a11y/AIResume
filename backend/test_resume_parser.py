
import json
from services.resume_parser import parse_resume

sample_resume = """
Rahul Agnihotri
Email: rahul@example.com
Phone: +91 9876543210

Skills
Python, Java, SQL, MongoDB, FastAPI, Git

Education
B.Tech in Computer Science Engineering
Technocrats Institute of Technology

Experience
Software Developer Internship

Projects
AI Resume Analyzer
Developed a resume analysis system using Python.

Certifications
Microsoft Azure Fundamentals AZ-900
"""

result = parse_resume(sample_resume)

print(json.dumps(result, indent=4))
