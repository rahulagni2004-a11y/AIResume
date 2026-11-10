from fastapi import APIRouter, Depends
from routes.auth import get_current_user

router = APIRouter()


@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):

    return {
        "message": "Profile fetched successfully",
        "user_id": current_user["user_id"],
        "email": current_user["email"]
    }