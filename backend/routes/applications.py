
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime

from database import db
from models.application import ApplicationCreate, ApplicationStatusUpdate
from routes.auth import get_current_user

router = APIRouter()


# 1. Apply for a job
@router.post("/applications")
async def apply_for_job(
    application: ApplicationCreate,
    current_user=Depends(get_current_user)
):
    try:
        job_object_id = ObjectId(application.job_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID"
        )

    job = db.jobs.find_one({"_id": job_object_id})

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Prevent duplicate applications
    existing_application = db.applications.find_one({
        "user_id": current_user["user_id"],
        "job_id": application.job_id
    })

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    application_data = {
        "user_id": current_user["user_id"],
        "job_id": application.job_id,
        "job_title": job.get("title"),
        "company": job.get("company"),
        "cover_letter": application.cover_letter,
        "status": "Applied",
        "applied_at": datetime.utcnow()
    }

    result = db.applications.insert_one(application_data)

    return {
        "message": "Job application submitted successfully",
        "application_id": str(result.inserted_id),
        "status": "Applied"
    }


# 2. Get all applications of the logged-in user
@router.get("/applications")
async def get_my_applications(
    current_user=Depends(get_current_user)
):
    applications = list(
        db.applications.find({
            "user_id": current_user["user_id"]
        }).sort("applied_at", -1)
    )

    for application in applications:
        application["_id"] = str(application["_id"])

    return {
        "message": "Applications fetched successfully",
        "total_applications": len(applications),
        "applications": applications
    }


# 3. Get one application by ID
@router.get("/applications/{application_id}")
async def get_application(
    application_id: str,
    current_user=Depends(get_current_user)
):
    try:
        object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID"
        )

    application = db.applications.find_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    application["_id"] = str(application["_id"])

    return {
        "message": "Application fetched successfully",
        "application": application
    }


# 4. Update application status
@router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user=Depends(get_current_user)
):
    allowed_statuses = [
        "Applied",
        "Shortlisted",
        "Rejected",
        "Selected"
    ]

    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Allowed: Applied, Shortlisted, Rejected, Selected"
        )

    try:
        object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID"
        )

    result = db.applications.update_one(
        {
            "_id": object_id,
            "user_id": current_user["user_id"]
        },
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return {
        "message": "Application status updated successfully",
        "application_id": application_id,
        "status": status_update.status
    }


# 5. Delete an application
@router.delete("/applications/{application_id}")
async def delete_application(
    application_id: str,
    current_user=Depends(get_current_user)
):
    try:
        object_id = ObjectId(application_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID"
        )

    result = db.applications.delete_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    return {
        "message": "Application deleted successfully",
        "application_id": application_id
    }
