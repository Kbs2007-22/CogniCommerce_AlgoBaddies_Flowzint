# routers/delivery.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from geopy.distance import geodesic

router = APIRouter(prefix="/api/delivery", tags=["Delivery Engine"])

# Data validation model for incoming requests
class LocationData(BaseModel):
    ticket_id: int  # Using int for IDs to keep data types clean and standard
    user_lat: float
    user_lon: float
    # We include these in the payload so you can easily mock test cases from React
    mock_delivery_lat: float
    mock_delivery_lon: float

@router.post("/verify-location")
def verify_delivery_location(data: LocationData):
    """
    Compares live user coordinates with the delivery agent's drop-off coordinates.
    """
    try:
        user_coords = (data.user_lat, data.user_lon)
        delivery_coords = (data.mock_delivery_lat, data.mock_delivery_lon)
        
        # Calculate physical distance in meters using geodesic math
        distance_meters = geodesic(user_coords, delivery_coords).meters
        
        # Define the acceptable radius (e.g., 100 meters)
        ACCEPTABLE_RADIUS = 100.0
        
        if distance_meters > ACCEPTABLE_RADIUS:
            return {
                "status": "flagged", 
                "ticket_id": data.ticket_id,
                "distance_difference_meters": round(distance_meters, 2),
                "resolution": "Human Review Required",
                "message": f"Mismatch detected. User is {round(distance_meters, 2)}m away from drop-off."
            }
        
        return {
            "status": "verified",
            "ticket_id": data.ticket_id,
            "distance_difference_meters": round(distance_meters, 2),
            "resolution": "Autonomous Reshipment Approved",
            "message": "Delivery location matches user location."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geospatial calculation failed: {str(e)}")
