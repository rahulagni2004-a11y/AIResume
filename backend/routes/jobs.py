
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from bson.errors import InvalidId

from database import db
from models.job import JobCreate
from services.job_recommender import recommend_jobs
from routes.auth import get_current_user

router = APIRouter()


# 1. Create a new job
@router.post("/jobs")
async def create_job(job: JobCreate):

    job_data = job.model_dump()

    # Prevent exact duplicate job records
    existing_job = db.jobs.find_one({
        "title": job_data["title"],
        "company": job_data["company"],
        "location": job_data.get("location"),
        "required_skills": job_data["required_skills"]
    })

    if existing_job:
        return {
            "message": "This job already exists",
            "job_id": str(existing_job["_id"])
        }

    result = db.jobs.insert_one(job_data)

    return {
        "message": "Job added successfully",
        "job_id": str(result.inserted_id)
    }


# 2. Get all jobs
@router.get("/jobs")
async def get_all_jobs():

    jobs = list(db.jobs.find())

    for job in jobs:
        job["_id"] = str(job["_id"])

    return {
        "message": "Jobs fetched successfully",
        "total_jobs": len(jobs),
        "jobs": jobs
    }


# 3. Search and filter jobs
# IMPORTANT: Keep this route above /jobs/{job_id}
@router.get("/jobs/search")
async def search_jobs(
    keyword: str = Query(default=None, min_length=1),
    location: str = Query(default=None, min_length=1),
    skills: str = Query(default=None, min_length=1),
    job_type: str = Query(default=None, min_length=1),
    sort_by: str = Query(default="newest")
):

    query = {}

    # Search by job title or company
    if keyword:
        query["$or"] = [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"company": {"$regex": keyword, "$options": "i"}}
        ]

    # Filter by location
    if location:
        query["location"] = {
            "$regex": location,
            "$options": "i"
        }

    # Filter by job type
    if job_type:
        query["job_type"] = {
            "$regex": f"^{job_type}$",
            "$options": "i"
        }

    # Filter by required skills
    if skills:
        skill_list = [
            skill.strip()
            for skill in skills.split(",")
            if skill.strip()
        ]

        if skill_list:
            query["required_skills"] = {
                "$all": skill_list
            }

    # Validate sorting option
    sort_option = sort_by.lower()

    if sort_option not in ["newest", "oldest"]:
        raise HTTPException(
            status_code=400,
            detail="sort_by must be either newest or oldest"
        )

    # Sort by MongoDB insertion ID
    sort_order = -1 if sort_option == "newest" else 1

    jobs = list(
        db.jobs.find(query).sort("_id", sort_order)
    )

    for job in jobs:
        job["_id"] = str(job["_id"])

    return {
        "message": "Jobs fetched successfully",
        "total_jobs": len(jobs),
        "filters": {
            "keyword": keyword,
            "location": location,
            "skills": skills,
            "job_type": job_type,
            "sort_by": sort_option
        },
        "jobs": jobs
    }


# 4. Get job recommendations based on resume
@router.get("/jobs/recommend/{resume_id}")
async def get_job_recommendations(
    resume_id: str,
    current_user=Depends(get_current_user)
):

    try:
        object_id = ObjectId(resume_id)

    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid resume ID"
        )

    resume = db.resumes.find_one({
        "_id": object_id,
        "user_id": current_user["user_id"]
    })

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    parsed_data = resume.get("parsed_data", {})
    resume_skills = parsed_data.get("skills", [])

    jobs = list(db.jobs.find())

    recommendations = recommend_jobs(
        resume_skills,
        jobs
    )

    return {
        "message": "Job recommendations generated successfully",
        "resume_id": resume_id,
        "total_jobs": len(jobs),
        "total_recommendations": len(recommendations),
        "recommendations": recommendations
    }


# 5. Get a specific job by ID
# Keep this dynamic route after /jobs/search
@router.get("/jobs/{job_id}")
async def get_job(job_id: str):

    try:
        object_id = ObjectId(job_id)

    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID"
        )

    job = db.jobs.find_one({
        "_id": object_id
    })

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    job["_id"] = str(job["_id"])

    return job
