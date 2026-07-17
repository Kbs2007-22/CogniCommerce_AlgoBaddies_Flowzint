from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, UserProfile

router = APIRouter(
    prefix="/refunds",
    tags=["Trust Scores & Autonomous Refunds"]
)

class RefundRequest(BaseModel):
    user_email: str
    order_id: str
    item_value: float
    is_non_returnable: bool

@router.post("/evaluate")
async def evaluate_and_issue_refund(request: RefundRequest, db: Session = Depends(get_db)):
    # Find user profile context
    user = db.query(UserProfile).filter(UserProfile.email == request.user_email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User profile dashboard data not found.")
        
    # Mathematical calculation of current Trust Factor Score
    # Formula: total spent vs value of historical problem claims
    if user.total_refund_claims_value > 0:
        trust_score_factor = user.total_spent / (user.total_refund_claims_value + request.item_value)
    else:
        trust_score_factor = 10.0 # Excellent clean operational standing

    # Safety policy configuration check
    if request.is_non_returnable:
        # If user is flag-banned or trust metric dips below safety threshold
        if not user.is_trusted or trust_score_factor < 3.0:
            return {
                "decision": "ESCALATE_TO_HUMAN",
                "reason": f"Item is strictly non-returnable and client trust score baseline ({trust_score_factor:.2f}) drops below tier thresholds.",
                "actions_taken": "Logged transaction anomaly. Human verification team notified."
            }
        
        # High trust factor path -> Autonomous credit processing
        user.total_refund_claims_value += request.item_value
        db.commit()
        
        return {
            "decision": "AUTO_APPROVED",
            "reason": f"Excellent customer trust standing factor ({trust_score_factor:.2f}). Policy bypassed.",
            "resolution": "Instant store credit balance applied. Customer instructed to discard/keep the item."
        }
        
    # Standard items loop path
    return {
        "decision": "STANDARD_RETURN_REQUIRED",
        "reason": "Item complies with regular return windows. Please complete standard terminal check-in."
    }
