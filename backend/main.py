
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from database import db

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.resumes import router as resumes_router
from routes.jobs import router as jobs_router
from routes.applications import router as applications_router
from routes.dashboard import router as dashboard_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "AIResume Backend is running!",
        "database": db.name
    }


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(resumes_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(dashboard_router)
