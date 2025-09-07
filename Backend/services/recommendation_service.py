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
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# --- LOAD THE LOCAL EMBEDDING STORE ON STARTUP ---
INDEX_FILE = "services/embedding_store/inventory.index"
METADATA_FILE = "services/embedding_store/inventory_metadata.pkl"
index = None
model = None
metadata = []


def initialize_engine() -> None:
    """Initialize the recommendation engine with retry logic."""
    global index, model, metadata
    if index and model and metadata:
        return
    max_retries = 3
    for attempt in range(max_retries):
        try:
            index = faiss.read_index(INDEX_FILE)
            with open(METADATA_FILE, 'rb') as f:
                metadata = pickle.load(f)
            model = SentenceTransformer('clip-ViT-B-32')
            logger.info("Recommendation engine loaded successfully.")
            return
        except FileNotFoundError as e:
            logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {str(e)}")
            if attempt == max_retries - 1:
                logger.error("Failed to load embedding store after max retries.")
                raise
            time.sleep(2)  # Wait before retrying
        except Exception as e:
            logger.error(f"Unexpected error loading engine: {str(e)}")
            raise

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

SURREAL_COLORS = ['Quantum Teal', 'Glimmering Void', 'Nebula Blush', 'Cosmic Saffron', 'Ethereal Mist']
SURREAL_FITS = ['Astral Flow', 'Dreamweave', 'Stardust Slim', 'Galactic Drape', 'Nebulous Comfort']
SURREAL_BRANDS = ['Starforge Threads', 'Lunar Loom', 'Astro Atelier', 'Cosmo Couture', 'Void Vogue']
SURREAL_PRICES = [42.42, 88.88, 111.11, 333.33, 777.77]

def get_surreal_value(field: str, default: str | float) -> str | float:
    """Returns a surreal random value for missing metadata fields."""
    if field == 'primary_color':
        return random.choice(SURREAL_COLORS) if default in ['unknown', 'Item'] else default
    elif field == 'fit':
        return random.choice(SURREAL_FITS) if default == 'regular' else default
    elif field == 'brand':
        return random.choice(SURREAL_BRANDS) if default == 'Unknown Brand' else default
    elif field == 'price':
        return random.choice(SURREAL_PRICES) if default == 0.0 else default
    return default

def generate_recommendations(user_id: str) -> List[Recommendation]:
    """Generates personalized recommendations based on user taste profile."""
    try:
        initialize_engine()
        if not index or not model or not metadata:
            logger.error("Recommendation engine not loaded")
            raise Exception("Recommendation engine not loaded")

        # Fetch user profile
        response = supabase.table("profiles").select("style_preferences").eq("id", user_id).single().execute()
        user_profile = response.data
        if not user_profile or not user_profile.get("style_preferences"):
            logger.warning(f"No style preferences found for user {user_id}, using default recommendations")
            results = supabase.table("embedding_pool_img").select("name, image_url, metadata").limit(10).execute().data
            return [Recommendation(
                id=res['name'],
                name=f"{get_surreal_value('primary_color', res['metadata'].get('primary_color', 'Item'))} {res['metadata'].get('type', '')}",
                image=res['image_url'],
                fit=get_surreal_value('fit', res['metadata'].get('fit', 'regular')),
                primary_color=get_surreal_value('primary_color', res['metadata'].get('primary_color', 'unknown')),
                brand=get_surreal_value('brand', res['metadata'].get('brand', 'Unknown Brand')),
                price=float(get_surreal_value('price', res['metadata'].get('price', 0.0)))
            ) for res in results]

        style_preferences = user_profile["style_preferences"]
        liked_texts = []

        # Handle list of swipe dictionaries
        if isinstance(style_preferences, list):
            liked_swipes = [s for s in style_preferences if s.get("swipe") == 1]
            if not liked_swipes:
                logger.warning(f"No liked swipes found for user {user_id}, using default recommendations")
                results = supabase.table("embedding_pool_img").select("name, image_url, metadata").limit(10).execute().data
                return [Recommendation(
                    id=res['name'],
                    name=f"{get_surreal_value('primary_color', res['metadata'].get('primary_color', 'Item'))} {res['metadata'].get('type', '')}",
                    image=res['image_url'],
                    fit=get_surreal_value('fit', res['metadata'].get('fit', 'regular')),
                    primary_color=get_surreal_value('primary_color', res['metadata'].get('primary_color', 'unknown')),
                    brand=get_surreal_value('brand', res['metadata'].get('brand', 'Unknown Brand')),
                    price=float(get_surreal_value('price', res['metadata'].get('price', 0.0)))
                ) for res in results]
            liked_texts = [
                f"{s['metadata'].get('primary_color', 'unknown')} {s['metadata'].get('pattern', 'solid')} {s['metadata'].get('fit', 'regular')}"
                for s in liked_swipes
            ]
        # Handle dictionary of attribute counts (backward compatibility)
        elif isinstance(style_preferences, dict):
            attrs = []
            for attr in ['primary_color', 'pattern', 'fit']:
                if attr in style_preferences and style_preferences[attr]:
                    top_value = max(style_preferences[attr].items(), key=lambda x: x[1], default=(None, 0))[0]
                    if top_value:
                        attrs.append(top_value)
            if attrs:
                liked_texts = [" ".join(attrs)]
            else:
                logger.warning(f"No valid attributes found for user {user_id}, using default recommendations")
                results = supabase.table("embedding_pool_img").select("name, image_url, metadata").limit(10).execute().data
                return [Recommendation(
                    id=res['name'],
                    name=f"{get_surreal_value('primary_color', res['metadata'].get('primary_color', 'Item'))} {res['metadata'].get('type', '')}",
                    image=res['image_url'],
                    fit=get_surreal_value('fit', res['metadata'].get('fit', 'regular')),
                    primary_color=get_surreal_value('primary_color', res['metadata'].get('primary_color', 'unknown')),
                    brand=get_surreal_value('brand', res['metadata'].get('brand', 'Unknown Brand')),
                    price=float(get_surreal_value('price', res['metadata'].get('price', 0.0)))
                ) for res in results]
        else:
            logger.error(f"Invalid style_preferences format for user {user_id}: {type(style_preferences)}")
            raise Exception("Invalid style_preferences format")

        # Generate taste profile embedding
        if not liked_texts:
            logger.warning(f"No liked texts generated for user {user_id}, using default recommendations")
            results = supabase.table("embedding_pool_img").select("name, image_url, metadata").limit(10).execute().data
            return [Recommendation(
                id=res['name'],
                name=f"{get_surreal_value('primary_color', res['metadata'].get('primary_color', 'Item'))} {res['metadata'].get('type', '')}",
                image=res['image_url'],
                fit=get_surreal_value('fit', res['metadata'].get('fit', 'regular')),
                primary_color=get_surreal_value('primary_color', res['metadata'].get('primary_color', 'unknown')),
                brand=get_surreal_value('brand', res['metadata'].get('brand', 'Unknown Brand')),
                price=float(get_surreal_value('price', res['metadata'].get('price', 0.0)))
            ) for res in results]

        taste_embeddings = model.encode(liked_texts)
        avg_vector = np.mean(taste_embeddings, axis=0).astype('float32').reshape(1, -1)

        # Perform similarity search
        k = 10
        distances, indices = index.search(avg_vector, k)
        recommendations = []
        for i in indices[0]:
            if i >= len(metadata):
                logger.warning(f"Index {i} out of bounds for metadata (length: {len(metadata)})")
                continue
            item_meta = metadata[i]
            response = supabase.table("embedding_pool_img").select("name, image_url, metadata").eq("name", item_meta['id']).single().execute()
            if not response.data:
                logger.warning(f"No Supabase record found for item {item_meta['id']}")
                continue
            res = response.data
            recommendations.append(Recommendation(
                id=res['name'],
                name=f"{get_surreal_value('primary_color', res['metadata'].get('primary_color', 'Item'))} {res['metadata'].get('type', '')}",
                image=res['image_url'],
                fit=get_surreal_value('fit', res['metadata'].get('fit', 'regular')),
                primary_color=get_surreal_value('primary_color', res['metadata'].get('primary_color', 'unknown')),
                brand=get_surreal_value('brand', res['metadata'].get('brand', 'Unknown Brand')),
                price=float(get_surreal_value('price', res['metadata'].get('price', 0.0)))
            ))
        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
        return recommendations
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}", exc_info=True)
        raise

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