from datetime import datetime, timezone
from io import BytesIO
import os
import uuid

import fitz
import pytesseract
from PIL import Image

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from bson import ObjectId
from bson.errors import InvalidId

from routes.auth import get_current_user
from database import db

from services.resume_parser import parse_resume
from services.resume_recommender import generate_resume_suggestions
from services.ats_analyzer import calculate_ats_score


# Tesseract OCR configuration
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

router = APIRouter()

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 1. Upload Resume with PDF Validation and OCR
@router.post("/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    MAX_PAGES = 10

    file_path = None
    document = None

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    file_data = await file.read(MAX_FILE_SIZE + 1)

    if not file_data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must not exceed 5 MB")

    if not file_data.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    try:
        document = fitz.open(stream=file_data, filetype="pdf")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read PDF. Please upload a valid PDF."
        )

    try:
        if len(document) == 0:
            raise HTTPException(status_code=400, detail="PDF contains no pages")

        if len(document) > MAX_PAGES:
            raise HTTPException(status_code=400, detail="PDF cannot contain more than 10 pages")

        extracted_text = ""

        for page in document:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image = Image.open(BytesIO(pix.tobytes("png")))
            page_text = pytesseract.image_to_string(image)
            extracted_text += page_text + "\n"

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error occurred while processing the resume"
        )
    finally:
        if document is not None:
            document.close()

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from the PDF"
        )

    try:
        parsed_data = parse_resume(extracted_text)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error occurred while parsing the resume"
        )

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

    try:
        with open(file_path, "wb") as f:
            f.write(file_data)

        resume_data = {
            "user_id": current_user["user_id"],
            "file_name": file.filename,
            "file_path": file_path,
            "text": extracted_text,
            "parsed_data": parsed_data,
            "uploaded_at": datetime.now(timezone.utc)
        }

        result = db.resumes.insert_one(resume_data)

    except Exception:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Unable to save resume. Please try again."
        )

    return {
        "message": "Resume uploaded successfully",
        "resume_id": str(result.inserted_id),
        "file_name": file.filename,
        "file_size": len(file_data),
        "text_length": len(extracted_text),
        "parsed_data": parsed_data
    }


# 2. Analyze Resume and Calculate ATS Score
@router.post("/resume/analyze")
async def analyze_resume(
    resume_id: str,
    job_description: str,
    current_user=Depends(get_current_user)
):
    # Reject empty or whitespace-only job descriptions
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty"
        )

    try:
        object_id = ObjectId(resume_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    resume = db.resumes.find_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_text = resume.get("text", "")

    result = calculate_ats_score(
        resume_text,
        job_description,
        resume.get("parsed_data", {})
    )

    result["resume_id"] = resume_id

    analysis_data = {
        "user_id": current_user["user_id"],
        "resume_id": resume_id,
        "file_name": resume.get("file_name"),
        "job_description": job_description,
        "ats_score": result["ats_score"],
        "skill_score": result["skill_score"],
        "keyword_score": result["keyword_score"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "matched_keywords": result["matched_keywords"],
        "suggestions": result["suggestions"],
        "created_at": datetime.now(timezone.utc)
    }

    saved_analysis = db.analysis.insert_one(analysis_data)

    return {
        "message": "ATS analysis completed successfully",
        "analysis_id": str(saved_analysis.inserted_id),
        "analysis": result
    }


# 3. Get ATS Analysis History
@router.get("/resume/analysis-history")
async def get_analysis_history(current_user=Depends(get_current_user)):
    analyses = list(
        db.analysis.find({
            "user_id": current_user["user_id"]
        }).sort("created_at", -1)
    )

    for analysis in analyses:
        analysis["_id"] = str(analysis["_id"])

    return {
        "message": "Analysis history fetched successfully",
        "total_analyses": len(analyses),
        "history": analyses
    }


# 4. Get Resume Upload History
@router.get("/resume/history")
async def get_resume_history(current_user=Depends(get_current_user)):
    resumes = list(
        db.resumes.find(
            {"user_id": current_user["user_id"]},
            {"text": 0, "file_path": 0}
        ).sort("uploaded_at", -1)
    )

    for resume in resumes:
        resume["_id"] = str(resume["_id"])

    return {
        "message": "Resume history fetched successfully",
        "total_resumes": len(resumes),
        "resumes": resumes
    }


# 5. Generate and Save Resume Improvement Suggestions
@router.post("/resume/improve")
async def improve_resume(
    resume_id: str,
    job_description: str,
    current_user=Depends(get_current_user)
):
    # Reject empty or whitespace-only job descriptions
    if not job_description or not job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty"
        )

    try:
        object_id = ObjectId(resume_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    resume = db.resumes.find_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume_text = resume.get("text", "")
    parsed_data = resume.get("parsed_data", {})

    result = generate_resume_suggestions(
        resume_text,
        parsed_data,
        job_description
    )

    improvement_record = {
        "user_id": current_user["user_id"],
        "resume_id": resume_id,
        "filename": resume.get("file_name", ""),
        "job_description": job_description,
        "total_suggestions": result["total_suggestions"],
        "suggestions": result["suggestions"],
        "created_at": datetime.now(timezone.utc)
    }

    saved_result = db.improvements.insert_one(improvement_record)

    return {
        "message": "Resume improvement report generated and saved successfully",
        "improvement_id": str(saved_result.inserted_id),
        "resume_id": resume_id,
        "suggestions": result
    }


# 6. Get All Resume Improvement Reports
@router.get("/resume/improvement-history")
async def get_improvement_history(current_user=Depends(get_current_user)):
    reports = list(
        db.improvements.find({
            "user_id": current_user["user_id"]
        }).sort("created_at", -1)
    )

    for report in reports:
        report["_id"] = str(report["_id"])

    return {
        "message": "Resume improvement history fetched successfully",
        "total_reports": len(reports),
        "reports": reports
    }


# 7. Get Single Resume Improvement Report
@router.get("/resume/improvement-history/{improvement_id}")
async def get_single_improvement_report(
    improvement_id: str,
    current_user=Depends(get_current_user)
):
    try:
        object_id = ObjectId(improvement_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid improvement ID")

    report = db.improvements.find_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if not report:
        raise HTTPException(status_code=404, detail="Improvement report not found")

    report["_id"] = str(report["_id"])

    return {
        "message": "Improvement report fetched successfully",
        "report": report
    }


# 8. Delete Resume Improvement Report
@router.delete("/resume/improvement-history/{improvement_id}")
async def delete_improvement_report(
    improvement_id: str,
    current_user=Depends(get_current_user)
):
    try:
        object_id = ObjectId(improvement_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid improvement ID")

    result = db.improvements.delete_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Improvement report not found")

    return {
        "message": "Resume improvement report deleted successfully",
        "improvement_id": improvement_id
    }