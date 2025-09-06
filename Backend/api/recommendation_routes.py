from fastapi import APIRouter, HTTPException
from services import recommendation_service
from models.schemas import RefineTasteRequest, Recommendation, UserRequest
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/recommendations", response_model=list[Recommendation])
def get_recommendations_route(request: UserRequest):
    """
    Generates personalized recommendations for a given user based on their
    taste profile, which is compared against the local embedding store.
    """
    try:
        logger.info(f"Generating recommendations for user_id: {request.user_id}")
        recommendations = recommendation_service.generate_recommendations(request.user_id)
        logger.info(f"Successfully generated {len(recommendations)} recommendations")
        return recommendations
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refine-taste")
def refine_taste_route(request: RefineTasteRequest):
    """
    Refines a user's taste profile by merging new quiz swipes with their
    existing preferences and updating their quiz history.
    """
    try:
        logger.info(f"Refining taste for user: {request.user_id}")
        success = recommendation_service.refine_taste_profile(request.user_id, request.swipes)
        if not success:
            logger.warning(f"User profile not found for user: {request.user_id}")
            raise HTTPException(status_code=404, detail="User profile not found.")
        return {"message": "Taste profile refined successfully."}
    except HTTPException as http_exc:
        logger.error(f"HTTP Exception in /refine-taste: {str(http_exc)}")
        raise
    except Exception as e:
        logger.error(f"Failed to refine taste: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

