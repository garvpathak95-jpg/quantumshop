import os 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

app = FastAPI(
    title="QuantumShop Product Catalog",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://quantumuser:QuantumDB%40123@localhost:5432/quantumshop"
)
engine = create_engine(DATABASE_URL)


@app.get("/")
def root():
    return {
        "service": "product-service",
        "status": "ok"
    }


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


@app.get("/products")
def get_products():

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT id, name, description, price, emoji
                FROM products
                ORDER BY id
            """)
        )

        products = []

        for row in result:
            products.append({
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "price": float(row.price),
                "emoji": row.emoji,
            })

        return products


@app.get("/products/{product_id}")
def get_product(product_id: int):

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT id, name, description, price, emoji
                FROM products
                WHERE id = :product_id
            """),
            {"product_id": product_id}
        )

        row = result.fetchone()

        if not row:
            return {
                "error": "Product not found"
            }

        return {
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "price": float(row.price),
            "emoji": row.emoji,
        }
