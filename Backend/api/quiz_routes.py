from fastapi import APIRouter, HTTPException
from services import recommendation_service
from services.supabase_client import supabase
from models.schemas import QuizImage, UserRequest, InitialQuizSubmission, RefineTasteRequest
import logging

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/quiz/initial", response_model=list[QuizImage])
def get_initial_quiz_route():
    try:
        images = recommendation_service.get_initial_quiz_from_supabase()
        return images
    except Exception as e:
        logger.error(f"Failed to fetch initial quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch initial quiz: {str(e)}")

@router.post("/quiz/initial")
def submit_initial_quiz_route(request: InitialQuizSubmission):
    try:
        logger.info(f"Submitting quiz for user_id: {request.user_id}")
        user_response = supabase.table("users").select("id").eq("id", request.user_id).execute()
        if not user_response.data:
            logger.error(f"User not found for user_id: {request.user_id}")
            raise HTTPException(status_code=400, detail="User not found. Please sign up or log in.")

        swipes_dict = [swipe.dict() for swipe in request.swipes]
        success = recommendation_service.save_initial_quiz_submission(request.user_id, swipes_dict, supabase)
        if not success:
            logger.error(f"Failed to save quiz submission for user_id: {request.user_id}")
            raise HTTPException(status_code=500, detail="Failed to save quiz submission")
        logger.info(f"Quiz submission saved successfully for user_id: {request.user_id}")
        return {"message": "Quiz submission saved successfully"}
    except Exception as e:
        logger.error(f"Failed to save quiz submission for user_id: {request.user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save quiz submission: {str(e)}")

@router.get("/quiz/initial/required")
def check_initial_quiz_required(user_id: str):
    try:
        logger.info(f"Checking profile status for user_id: {user_id}")
        user_response = supabase.table("users").select("id").eq("id", user_id).execute()
        if not user_response.data:
            logger.error(f"User not found for user_id: {user_id}")
            raise HTTPException(status_code=400, detail="User not found. Please sign up or log in.")

        profile_response = supabase.table("profiles").select("id").eq("id", user_id).execute()
        if profile_response.data is None:
            logger.error(f"Profile query returned None for user_id: {user_id}")
            raise HTTPException(status_code=500, detail="Profile query failed")

        required = not bool(profile_response.data)
        logger.info(f"Profile required for user_id: {user_id}: {required}")
        return {"required": required}
    except Exception as e:
        logger.error(f"Failed to check profile for user_id: {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check profile: {str(e)}")

@router.get("/quiz/refine", response_model=list[QuizImage])
def get_refine_quiz_route():
    """
    Fetches 20 random images for the refinement quiz from the Supabase 'quiz_pool_img' table.
    """
    try:
        images = recommendation_service.get_random_refine_quiz_images()
        if not images:
            raise HTTPException(status_code=404, detail="No quiz pool images available.")
        return images
    except Exception as e:
        logger.error(f"Failed to fetch refinement quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch refinement quiz: {str(e)}")