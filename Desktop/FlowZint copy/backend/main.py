import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database
from Routers import claim, refunds
from Routers import analytics, delivery

# Create the FastAPI app first
app = FastAPI(
    title="Modern E-Commerce Autonomous Customer Care Engine",
    description="Agentic infrastructure handling returns, visual checks, and dynamic customer risk validation.",
    version="1.0.0"
)

# Allow frontend dev server (Vite at 5173) to call the API without CORS errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables automatically if they do not exist
database.Base.metadata.create_all(bind=database.engine)

# Seed database session hook to mock a testing client baseline
@app.on_event("startup")
def seed_test_data():
    db = database.SessionLocal()
    # Check if a seed dummy user already exists
    test_user = db.query(database.UserProfile).filter(database.UserProfile.email == "vip_buyer@example.com").first()
    if not test_user:
        # High value loyal customer baseline
        db.add(database.UserProfile(email="vip_buyer@example.com", total_spent=1500.00, total_refund_claims_value=50.00, is_trusted=True))
        # High risk customer baseline
        db.add(database.UserProfile(email="risk_buyer@example.com", total_spent=40.00, total_refund_claims_value=120.00, is_trusted=False))
        db.commit()
    db.close()

# Mount backend endpoints
app.include_router(claim.router)
app.include_router(refunds.router)
app.include_router(analytics.router)
app.include_router(delivery.router)

@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "documentation_endpoint": "/docs"
    }

if __name__ == "__main__":
    # Runs web server locally on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
