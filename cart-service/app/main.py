import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy import create_engine, text

app = FastAPI(title="QuantumShop Cart Service")
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
        "message": "QuantumShop Cart Service is running"
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


@app.get("/cart/{user_id}")
def get_cart(user_id: int):

    with engine.connect() as connection:

        result = connection.execute(
            text("""
                SELECT product_id, quantity
                FROM cart_items
                WHERE user_id = :user_id
                ORDER BY id
            """),
            {
                "user_id": user_id
            }
        )

        items = []

        for row in result:
            items.append({
                "product_id": row.product_id,
                "quantity": row.quantity
            })

        return {
            "user_id": user_id,
            "items": items
        }


@app.post("/cart")
def add_to_cart(
    user_id: int,
    product_id: int,
    quantity: int = 1
):

    if quantity <= 0:
        return {
            "message": "Quantity must be greater than 0"
        }

    with engine.begin() as connection:

        # Check whether this product already exists
        # in the user's cart
        existing = connection.execute(
            text("""
                SELECT id, quantity
                FROM cart_items
                WHERE user_id = :user_id
                AND product_id = :product_id
                ORDER BY id
                LIMIT 1
            """),
            {
                "user_id": user_id,
                "product_id": product_id
            }
        ).fetchone()

        # Product already exists
        if existing:

            new_quantity = existing.quantity + quantity

            connection.execute(
                text("""
                    UPDATE cart_items
                    SET quantity = :quantity
                    WHERE id = :id
                """),
                {
                    "quantity": new_quantity,
                    "id": existing.id
                }
            )

            return {
                "message": "Cart quantity updated",
                "user_id": user_id,
                "item": {
                    "id": existing.id,
                    "product_id": product_id,
                    "quantity": new_quantity
                }
            }

        # Product does not exist
        # Create a new cart item
        result = connection.execute(
            text("""
                INSERT INTO cart_items
                (user_id, product_id, quantity)
                VALUES
                (:user_id, :product_id, :quantity)
                RETURNING id
            """),
            {
                "user_id": user_id,
                "product_id": product_id,
                "quantity": quantity
            }
        )

        cart_id = result.scalar()

    return {
        "message": "Product added to cart",
        "user_id": user_id,
        "item": {
            "id": cart_id,
            "product_id": product_id,
            "quantity": quantity
        }
    }


@app.delete("/cart/{user_id}/{product_id}")
def remove_from_cart(
    user_id: int,
    product_id: int
):

    with engine.begin() as connection:

        result = connection.execute(
            text("""
                DELETE FROM cart_items
                WHERE user_id = :user_id
                AND product_id = :product_id
            """),
            {
                "user_id": user_id,
                "product_id": product_id
            }
        )

        deleted = result.rowcount

    if deleted == 0:
        return {
            "message": "Cart item not found"
        }

    return {
        "message": "Product removed from cart",
        "user_id": user_id,
        "product_id": product_id
    }
