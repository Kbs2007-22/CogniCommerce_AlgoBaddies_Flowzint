"""
claim.py — Router for filing and managing damage/loss claims against deliveries.

Endpoints
---------
POST   /claims/              File a new claim
GET    /claims/              List claims (filterable by status / delivery_id)
GET    /claims/{claim_id}    Get a single claim
PATCH  /claims/{claim_id}/status  Approve / reject / resolve a claim
DELETE /claims/{claim_id}         Delete a claim
"""
import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, PositiveFloat
from sqlalchemy import Column, DateTime, Enum, Float, String, select
from sqlalchemy.orm import Session

from database import Base, get_db

# ---------------------------------------------------------------------------
# SQLAlchemy Model
# ---------------------------------------------------------------------------

class ClaimStatus(str, enum.Enum):
    open     = "open"
    approved = "approved"
    rejected = "rejected"
    resolved = "resolved"


class Claim(Base):
    __tablename__ = "claims"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id    = Column(String, nullable=False, index=True)
    claimant_name  = Column(String, nullable=False)
    description    = Column(String, nullable=False)
    amount_claimed = Column(Float, nullable=False)
    status         = Column(Enum(ClaimStatus), default=ClaimStatus.open, nullable=False)
    created_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at     = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class ClaimCreate(BaseModel):
    delivery_id    : str          = Field(..., description="ID of the associated delivery")
    claimant_name  : str          = Field(..., min_length=1, max_length=255)
    description    : str          = Field(..., min_length=5, max_length=2000)
    amount_claimed : PositiveFloat = Field(..., examples=[150.00])


class ClaimStatusUpdate(BaseModel):
    status: ClaimStatus


class ClaimResponse(BaseModel):
    id             : str
    delivery_id    : str
    claimant_name  : str
    description    : str
    amount_claimed : float
    status         : ClaimStatus
    created_at     : datetime
    updated_at     : datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/claims", tags=["Claims"])


@router.post("/", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_claim(payload: ClaimCreate, db: Session = Depends(get_db)):
    """File a damage or loss claim against a delivery."""
    claim = Claim(
        id             = str(uuid.uuid4()),
        delivery_id    = payload.delivery_id,
        claimant_name  = payload.claimant_name,
        description    = payload.description,
        amount_claimed = payload.amount_claimed,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/", response_model=List[ClaimResponse])
def list_claims(
    status_filter  : Optional[ClaimStatus] = Query(None, alias="status"),
    delivery_id    : Optional[str]         = Query(None),
    skip           : int                   = Query(0, ge=0),
    limit          : int                   = Query(50, ge=1, le=200),
    db             : Session               = Depends(get_db),
):
    """List all claims with optional filters."""
    query = select(Claim).offset(skip).limit(limit).order_by(Claim.created_at.desc())
    if status_filter:
        query = query.where(Claim.status == status_filter)
    if delivery_id:
        query = query.where(Claim.delivery_id == delivery_id)
    result = db.execute(query)
    return result.scalars().all()


@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    """Fetch a single claim by its ID."""
    result = db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    return claim


@router.patch("/{claim_id}/status", response_model=ClaimResponse)
def update_claim_status(
    claim_id: str,
    payload : ClaimStatusUpdate,
    db      : Session = Depends(get_db),
):
    """Approve, reject, or resolve a claim."""
    result = db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    claim.status     = payload.status
    claim.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(claim)
    return claim


@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_claim(claim_id: str, db: Session = Depends(get_db)):
    """Delete a claim record."""
    result = db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    db.delete(claim)
    db.commit()
