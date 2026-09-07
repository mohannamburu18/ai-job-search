from fastapi import APIRouter, HTTPException, status, Depends
from backend.app.schemas.all_schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),))
        existing = cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists")
            
        hashed = hash_password(req.password)
        cursor.execute(
            "INSERT INTO users (email, hashed_password, full_name) VALUES (?, ?, ?)",
            (req.email.lower(), hashed, req.full_name)
        )
        user_id = cursor.lastrowid
        
        # Initialize default profile
        cursor.execute("""
        INSERT INTO profiles (user_id, name, email) VALUES (?, ?, ?)
        """, (user_id, req.full_name, req.email.lower()))

        token = create_access_token({"sub": str(user_id), "email": req.email.lower()})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": req.email.lower(),
                "full_name": req.full_name
            }
        }

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, hashed_password, full_name FROM users WHERE email = ?", (req.email.lower(),))
        user = cursor.fetchone()
        if not user or not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Invalid email or password")
            
        token = create_access_token({"sub": str(user["id"]), "email": user["email"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"]
            }
        }

@router.get("/me", response_model=UserResponse)
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"]
    }
