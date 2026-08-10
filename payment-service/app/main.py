from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

app = FastAPI(
    title="QuantumShop Payment Service",
    version="0.1.0"
)

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PaymentRequest(BaseModel):
    user_id: int
    amount: float
    currency: str = "INR"


@app.get("/")
def root():
    return {
        "message": "QuantumShop Payment Service is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/payment")
def make_payment(payment: PaymentRequest):

    payment_id = str(uuid.uuid4())

    return {
        "payment_id": payment_id,
        "user_id": payment.user_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": "SUCCESS"
    }
