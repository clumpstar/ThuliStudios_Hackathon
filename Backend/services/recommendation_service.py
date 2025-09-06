from typing import List, Dict, Any
from models.schemas import Swipe, Recommendation, QuizImage
from .supabase_client import supabase
from supabase import Client
import faiss
import numpy as np
import pickle
from sentence_transformers import SentenceTransformer
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# --- LOAD THE LOCAL EMBEDDING STORE ON STARTUP ---
INDEX_FILE = "services/embedding_store/inventory.index"
METADATA_FILE = "services/embedding_store/inventory_metadata.pkl"

print("Loading recommendation engine components...")
try:
    index = faiss.read_index(INDEX_FILE)
    with open(METADATA_FILE, 'rb') as f:
        metadata = pickle.load(f)
    model = SentenceTransformer('clip-ViT-B-32')
    print("Recommendation engine loaded successfully.")
except FileNotFoundError:
    print("WARNING: Embedding store not found. Please run 'scripts/data_pipeline.py' first.")
    index = None
    metadata = []
    model = None
# --- END LOADING ---

def get_initial_quiz_from_supabase() -> List[QuizImage]:
    """ Fetches all 40 images for the initial quiz from the Supabase table. """
    print("Fetching initial quiz from Supabase...")
    response = supabase.table("initial_quiz_img").select("id, name, image_url, metadata").execute()
    if not response.data:
        return []
    # Map the database response to our Pydantic schema
    return [QuizImage(id=item['id'], name=item['name'], uri=item['image_url'], metadata=item['metadata']) for item in response.data]

def get_random_refine_quiz_images() -> list[QuizImage]:
    """
    Fetches 20 random images for the refinement quiz from the Supabase 'quiz_pool_img' table.
    """
    try:
        logger.info("Fetching refine quiz")
        # Use raw SQL to select 20 random records
        response = supabase.table("quiz_pool_img").select("*", count=None).execute()
        if not response.data:
            logger.warning("No quiz pool images found")
            return []

        # Shuffle and limit to 20
        import random
        shuffled_data = random.sample(response.data, min(20, len(response.data)))
        images = [QuizImage(id=item['id'], name=item['name'], uri=item['image_url'], metadata=item['metadata']) for item in shuffled_data]
        logger.info(f"Refine quiz images fetched: {len(images)}")
        return images
    except Exception as e:
        logger.error(f"Failed to fetch refinement quiz: {str(e)}")
        raise

def get_unseen_refinement_quiz(user_id: str) -> List[QuizImage]:
    """
    Fetches 20 random quiz questions from the 'refine_quiz_img' table
    that the user has not yet seen.
    """
    print(f"Fetching unseen refinement quiz for user: {user_id}")
    
    # 1. Get the list of quiz IDs the user has already seen
    profile_response = supabase.table("profiles").select("seen_quiz_ids").eq("id", user_id).single().execute()
    seen_ids = []
    if profile_response.data and profile_response.data.get("seen_quiz_ids"):
        # The IDs are stored as the 'name' of the image
        seen_ids = [str(id_val) for id_val in profile_response.data["seen_quiz_ids"]]

    # 2. Fetch quiz images, excluding the ones already seen
    query = supabase.table("refine_quiz_img").select("id, name, image_url, metadata")
    if seen_ids:
        # Use the .not_() filter to exclude seen IDs
        query = query.not_("name", "in", tuple(seen_ids))
        
    quiz_response = query.execute()

    if not quiz_response.data:
        print(f"No unseen questions found for user {user_id}.")
        return []

    # 3. Randomize and select 20 questions
    available_questions = quiz_response.data
    random.shuffle(available_questions)
    
    return [QuizImage(**item) for item in available_questions[:20]]

def save_initial_quiz_submission(user_id: str, swipes: List[Dict[str, Any]], supabase: Client = supabase) -> bool:
    """
    Saves the initial quiz swipes to the profiles table.
    Updates style_preferences and seen_quiz_ids.
    """
    try:
        # Extract seen quiz IDs
        seen_quiz_ids = [swipe['imageId'] for swipe in swipes]
        
        # Aggregate style preferences (count likes per metadata attribute)
        style_preferences = {}
        for swipe in swipes:
            if swipe['swipe'] == 1:  # Only consider right swipes (likes)
                for key, value in swipe['metadata'].items():
                    if key not in style_preferences:
                        style_preferences[key] = {}
                    style_preferences[key][value] = style_preferences[key].get(value, 0) + 1

        # Prepare profile data
        profile_data = {
            'id': user_id,
            'style_preferences': style_preferences,
            'seen_quiz_ids': seen_quiz_ids,
            'updated_at': 'now()'
        }

        # Check if profile exists
        existing_profile = supabase.table('profiles').select('id').eq('id', user_id).execute()
        
        if existing_profile.data:
            # Update existing profile
            update_response = supabase.table('profiles').update({
                'style_preferences': style_preferences,
                'seen_quiz_ids': seen_quiz_ids,
                'updated_at': 'now()'
            }).eq('id', user_id).execute()
        else:
            # Insert new profile
            update_response = supabase.table('profiles').insert(profile_data).execute()

        return not (hasattr(update_response, 'error') and update_response.error is not None)
    except Exception as e:
        print(f"Error saving initial quiz submission: {str(e)}")
        raise Exception(f"Failed to save quiz submission: {str(e)}")

def generate_recommendations(user_id: str) -> List[Recommendation]:
    if not index or not model: raise Exception("Engine not loaded.")
    response = supabase.table("profiles").select("style_preferences").eq("id", user_id).single().execute()
    user_profile = response.data
    if not user_profile or not user_profile.get("style_preferences"):
        results = [metadata[i] for i in range(10)]
        return [Recommendation(id=res['id'], name=res['id'], image=res['path']) for res in results]
    
    liked_swipes = [s for s in user_profile["style_preferences"] if s.get("swipe") == 1]
    if not liked_swipes:
        results = [metadata[i] for i in range(10)]
        return [Recommendation(id=res['id'], name=res['id'], image=res['path']) for res in results]
        
    liked_texts = [f"{s['metadata']['primary_color']} {s['metadata']['pattern']} {s['metadata']['fit']}" for s in liked_swipes]
    taste_embeddings = model.encode(liked_texts)
    avg_vector = np.mean(taste_embeddings, axis=0).astype('float32').reshape(1, -1)
    
    k = 10
    distances, indices = index.search(avg_vector, k)
    recommendations = []
    for i in indices[0]:
        item_meta = metadata[i]
        structured_meta = item_meta.get('structured_metadata', {})
        recommendations.append(Recommendation(
            id=item_meta['id'],
            name=f"{structured_meta.get('primary_color', 'Item')} {structured_meta.get('type', '')}",
            image=item_meta.get('path'),
            fit=structured_meta.get('fit', 'regular'),
            primary_color=structured_meta.get('primary_color', 'unknown')
        ))
    return recommendations

def refine_taste_profile(user_id: str, new_swipes: List[Swipe]) -> bool:
    """
    Updates a user's taste profile in Supabase by:
    1. Merging new swipes with existing ones.
    2. Adding the new quiz IDs to the user's 'seen_quiz_ids' history.
    """
    logger.info(f"Refining taste profile and updating seen quiz history for user: {user_id}")
    
    # 1. Fetch the user's current profile
    response = supabase.table("profiles").select("style_preferences, seen_quiz_ids").eq("id", user_id).single().execute()
    logger.debug(f"Supabase response: {response}")
    if not response.data:
        logger.warning(f"No profile found for user {user_id}")
        return False
    
    # Ensure response.data is a dictionary
    if not isinstance(response.data, dict):
        logger.error(f"Unexpected response data format: {response.data}")
        raise ValueError("Invalid response format from Supabase")

    # 2. Merge style preferences
    existing_swipes = response.data.get("style_preferences", [])
    if not isinstance(existing_swipes, list):
        logger.warning(f"style_preferences is not a list, resetting to empty: {existing_swipes}")
        existing_swipes = []
    new_swipes_dicts = [s.dict() for s in new_swipes]
    combined_swipes = {s['imageId']: s for s in existing_swipes}
    for s in new_swipes_dicts:
        combined_swipes[s['imageId']] = s
    final_swipes = list(combined_swipes.values())

    # 3. Update seen quiz history
    existing_seen_ids = set(response.data.get("seen_quiz_ids", []))
    if not isinstance(existing_seen_ids, (list, set)):
        logger.warning(f"seen_quiz_ids is not a list or set, resetting to empty: {existing_seen_ids}")
        existing_seen_ids = set()
    newly_seen_ids = {s['imageId'] for s in new_swipes_dicts}
    updated_seen_ids = list(existing_seen_ids.union(newly_seen_ids))

    # 4. Update the profile with both new preferences and new history
    update_response = supabase.table("profiles").update({
        "style_preferences": final_swipes,
        "seen_quiz_ids": updated_seen_ids
    }).eq("id", user_id).execute()

    if hasattr(update_response, 'error') and update_response.error is not None:
        logger.error(f"Update failed: {update_response.error}")
        return False
    return True