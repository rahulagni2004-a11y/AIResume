
from fastapi import APIRouter, Depends
from bson import ObjectId

from database import db
from routes.auth import get_current_user
from services.job_recommender import recommend_jobs

router = APIRouter()


# Get dashboard statistics
@router.get("/dashboard")
async def get_dashboard(
    current_user=Depends(get_current_user)
):
    user_id = current_user["user_id"]

    # Total resumes uploaded
    total_resumes = db.resumes.count_documents({
        "user_id": user_id
    })

    # Total ATS analyses
    total_analyses = db.analysis.count_documents({
        "user_id": user_id
    })

    # Total job applications
    total_applications = db.applications.count_documents({
        "user_id": user_id
    })

    # Application status statistics
    application_status = {
        "Applied": 0,
        "Shortlisted": 0,
        "Rejected": 0,
        "Selected": 0
    }

    status_results = db.applications.aggregate([
        {
            "$match": {
                "user_id": user_id
            }
        },
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ])

    for item in status_results:
        application_status[item["_id"]] = item["count"]

    # Recommended jobs based on latest resume
    latest_resume = db.resumes.find_one(
        {"user_id": user_id},
        sort=[("uploaded_at", -1)]
    )

    total_recommended_jobs = 0

    if latest_resume:
        parsed_data = latest_resume.get("parsed_data", {})
        resume_skills = parsed_data.get("skills", [])

        jobs = list(db.jobs.find())

        recommendations = recommend_jobs(
            resume_skills,
            jobs
        )

        total_recommended_jobs = len(recommendations)

    return {
        "message": "Dashboard statistics fetched successfully",
        "dashboard": {
            "total_resumes": total_resumes,
            "total_analyses": total_analyses,
            "total_applications": total_applications,
            "total_recommended_jobs": total_recommended_jobs,
            "application_status": application_status
        }
    }
