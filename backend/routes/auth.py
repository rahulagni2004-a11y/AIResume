
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
from pwdlib import PasswordHash
from bson import ObjectId
import jwt
from dotenv import load_dotenv
import os
import uuid

from database import db
from models.user import UserCreate, UserLogin, PasswordChange

load_dotenv()

router = APIRouter()

password_hash = PasswordHash.recommended()

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


# Get and verify the currently logged-in user
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        session_id = payload.get("session_id")
        user_id = payload.get("user_id")

        if not session_id or not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session. Please log in again."
            )

        active_session = db.sessions.find_one({
            "session_id": session_id,
            "user_id": user_id,
            "revoked": False,
            "expires_at": {
                "$gt": datetime.now(timezone.utc)
            }
        })

        if not active_session:
            raise HTTPException(
                status_code=401,
                detail="Session expired or revoked. Please log in again."
            )

        return payload

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# Register
@router.post("/register")
def register(user: UserCreate):

    existing_user = db.users.find_one({
        "email": user.email
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = password_hash.hash(user.password)

    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.now(timezone.utc)
    }

    result = db.users.insert_one(user_data)

    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }


# Login
@router.post("/login")
def login(user: UserLogin, request: Request):

    existing_user = db.users.find_one({
        "email": user.email
    })

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_correct = password_hash.verify(
        user.password,
        existing_user["password"]
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=2)

    session_id = str(uuid.uuid4())

    # Create JWT token
    token_data = {
        "user_id": str(existing_user["_id"]),
        "email": existing_user["email"],
        "session_id": session_id,
        "exp": expires_at
    }

    token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # Store session in MongoDB
    session_data = {
        "session_id": session_id,
        "user_id": str(existing_user["_id"]),
        "email": existing_user["email"],
        "created_at": now,
        "expires_at": expires_at,
        "ip_address": (
            request.client.host if request.client else "Unknown"
        ),
        "user_agent": request.headers.get(
            "user-agent",
            "Unknown device"
        ),
        "revoked": False
    }

    db.sessions.insert_one(session_data)

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }


# Change Password
@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user=Depends(get_current_user)
):

    user = db.users.find_one({
        "_id": ObjectId(current_user["user_id"])
    })

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    password_is_correct = password_hash.verify(
        password_data.current_password,
        user["password"]
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    hashed_password = password_hash.hash(
        password_data.new_password
    )

    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_password}}
    )

    return {
        "message": "Password changed successfully"
    }


# View Active Login Sessions
@router.get("/sessions")
def get_sessions(
    current_user=Depends(get_current_user)
):

    now = datetime.now(timezone.utc)

    sessions = list(db.sessions.find({
        "user_id": current_user["user_id"],
        "revoked": False,
        "expires_at": {"$gt": now}
    }).sort("created_at", -1))

    session_list = []

    for session in sessions:
        session_list.append({
            "session_id": session["session_id"],
            "email": session["email"],
            "ip_address": session.get("ip_address", "Unknown"),
            "user_agent": session.get("user_agent", "Unknown device"),
            "created_at": session["created_at"],
            "expires_at": session["expires_at"],
            "is_current": (
                session["session_id"] == current_user["session_id"]
            )
        })

    return {
        "message": "Sessions fetched successfully",
        "total_sessions": len(session_list),
        "sessions": session_list
    }


# Logout From Other Devices
@router.delete("/sessions/others")
def logout_other_sessions(
    current_user=Depends(get_current_user)
):

    result = db.sessions.update_many(
        {
            "user_id": current_user["user_id"],
            "session_id": {"$ne": current_user["session_id"]},
            "revoked": False
        },
        {
            "$set": {
                "revoked": True,
                "revoked_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "Other sessions logged out successfully",
        "sessions_revoked": result.modified_count
    }


# Logout From All Devices
@router.delete("/sessions/all")
def logout_all_sessions(
    current_user=Depends(get_current_user)
):

    result = db.sessions.update_many(
        {
            "user_id": current_user["user_id"],
            "revoked": False
        },
        {
            "$set": {
                "revoked": True,
                "revoked_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "message": "All sessions logged out successfully",
        "sessions_revoked": result.modified_count
    }
