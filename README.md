# QuantumShop

Basic local MVP based on the capstone architecture:
- React frontend
- Python FastAPI Product Catalog service
- Placeholder folders for Cart, Payment and Auth services
- No AWS/Kubernetes yet

## Run Product Service

cd product-service
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/WSL: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

Open http://localhost:8000/docs

## Run Frontend

cd frontend
npm install
npm run dev

Open the URL shown by Vite, normally http://localhost:5173
