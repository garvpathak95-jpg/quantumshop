import os
import bcrypt

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

app = FastAPI(title="QuantumShop Auth Service")

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DATABASE
# =========================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://quantumuser:QuantumDB%40123@localhost:5432/quantumshop"
)

engine = create_engine(DATABASE_URL)


# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "message": "QuantumShop Auth Service is running"
    }


# =========================
# HEALTH
# =========================

@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


# =========================
# REGISTER
# =========================

@app.post("/register")
def register(user: dict):

    username = user.get("username")
    password = user.get("password")

    if not username or not password:
        return {
            "detail": "Username and password are required"
        }

    # Hash password using bcrypt
    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    with engine.begin() as connection:

        existing = connection.execute(
            text("""
                SELECT id
                FROM users
                WHERE username = :username
            """),
            {
                "username": username
            }
        ).fetchone()

        if existing:
            return {
                "detail": "User already exists"
            }

        result = connection.execute(
            text("""
                INSERT INTO users
                (username, password)
                VALUES
                (:username, :password)
                RETURNING id
            """),
            {
                "username": username,
                "password": hashed_password
            }
        )

        user_id = result.scalar()

    return {
        "message": "Registration successful",
        "user_id": user_id,
        "username": username
    }


# =========================
# LOGIN
# =========================

@app.post("/login")
def login(user: dict):

    username = user.get("username")
    password = user.get("password")

    if not username or not password:
        return {
            "detail": "Username and password are required"
        }

    # Find user
    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT id, username, password
                FROM users
                WHERE username = :username
            """),
            {
                "username": username
            }
        ).fetchone()

    # User doesn't exist
    if not result:
        return {
            "detail": "Invalid username or password"
        }

    stored_hash = result.password

    # Verify bcrypt password
    try:

        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            stored_hash.encode("utf-8")
        )

    except Exception:

        password_valid = False

    if not password_valid:
        return {
            "detail": "Invalid username or password"
        }

    # Login successful
    return {
        "message": "Login successful",
        "access_token": f"user-{result.id}-token",
        "user_id": result.id,
        "username": result.username
    }
