import json
import pandas as pd
import os
import sys
import requests
from PIL import Image
from tqdm import tqdm
import faiss
import numpy as np
import cv2
import pickle
import random

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    if "DLL load failed" in str(e):
        print("\n[ERROR] TensorFlow DLL load failed. This often indicates a missing or incompatible Visual C++ Redistributable or an issue with your TensorFlow installation.\n")
        print("Please ensure you have the correct Visual C++ Redistributables installed and consider reinstalling TensorFlow in a clean virtual environment.\n")
        print("You can try running: `pip uninstall tensorflow` then `pip install tensorflow`\n")
        print("If using a GPU, ensure CUDA and cuDNN are correctly set up for your TensorFlow version.\n")
        sys.exit(1)
    else:
        raise e
from services.supabase_client import supabase

# --- CONFIGURATION ---
DATA_CSV_PATH = r"D:\Programming\Thuli_Datasets\train.csv"
LABEL_JSON_PATH = r"D:\Programming\Thuli_Datasets\label_descriptions.json"
IMAGE_DIR = r"D:\Programming\Thuli_Datasets\train"

OUTPUT_DIR = "services/embedding_store"
INDEX_FILE = os.path.join(OUTPUT_DIR, "inventory.index")
METADATA_FILE = os.path.join(OUTPUT_DIR, "inventory_metadata.pkl")

QUIZ_POOL_SIZE = 2000
INITIAL_QUIZ_SIZE = 40
REFINE_QUIZ_SIZE = 20

INITIAL_QUIZ_BUCKET = "initial_quiz_images"
REFINE_QUIZ_BUCKET = "quiz_images"
QUIZ_POOL_BUCKET = "quiz_pool_images"
EMBEDDING_BUCKET = "embedding_bucket"
EMBEDDING_TABLE = "embedding_pool_img"

COLOR_MAP = {
    (255, 0, 0): "red",
    (0, 255, 0): "green",
    (0, 0, 255): "blue",
    (255, 255, 0): "yellow",
    (0, 255, 255): "cyan",
    (255, 0, 255): "magenta",
    (0, 0, 0): "black",
    (255, 255, 255): "white",
    (128, 128, 128): "gray",
    (255, 165, 0): "orange",
    (128, 0, 128): "purple",
    (165, 42, 42): "brown"
}

def detect_dominant_color(image_path: str) -> str:
    try:
        img = cv2.imread(image_path)
        if img is None:
            return "unknown"
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pixels = img.reshape(-1, 3).astype(np.float32)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
        _, labels, centers = cv2.kmeans(pixels, 1, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        dominant_color = centers[0].astype(int)
        min_distance = float('inf')
        closest_color = "unknown"
        for rgb, color_name in COLOR_MAP.items():
            distance = np.sqrt(sum((dominant_color - rgb) ** 2))
            if distance < min_distance:
                min_distance = distance
                closest_color = color_name
        return closest_color
    except Exception as e:
        print(f"Error detecting color for {image_path}: {e}")
        return "unknown"

def map_attributes_to_schema(categories: set, attributes: set) -> dict:
    schema = {"primary_color": "unknown", "fit": "regular", "pattern": "solid", "type": "unknown", "brand": "Unknown Brand", "price": 0.0}
    type_map = {"shirt": "shirt", "dress": "dress", "top": "shirt", "pants": "pant", "jeans": "pant", "jacket": "jacket"}
    for cat in categories:
        if cat in type_map:
            schema["type"] = type_map[cat]
            break
    for attr in attributes:
        if "color" in attr and schema["primary_color"] == "unknown":
            schema["primary_color"] = attr.split("-")[-1]
        elif "fit" in attr and schema["fit"] == "regular":
            schema["fit"] = attr.split("-")[-1]
        elif "pattern" in attr and schema["pattern"] == "solid":
            schema["pattern"] = attr.split("-")[-1]
    return schema

def load_and_preprocess_data():
    df = pd.read_csv(DATA_CSV_PATH)
    with open(LABEL_JSON_PATH) as f:
        label_data = json.load(f)
    categories_map = {cat['id']: cat['name'] for cat in label_data['categories']}
    attributes_map = {attr['id']: attr['name'] for attr in label_data['attributes']}
    image_metadata = {}
    for _, row in tqdm(df.iterrows(), total=df.shape[0], desc="Processing annotations"):
        image_id = row['ImageId']
        if image_id not in image_metadata:
            image_metadata[image_id] = {"id": image_id, "path": os.path.join(IMAGE_DIR, f"{image_id}.jpg"), "categories": set(), "attributes": set()}
        image_metadata[image_id]['categories'].add(categories_map.get(row['ClassId']))
        if isinstance(row['AttributesIds'], str):
            attr_ids = [int(attr_id) for attr_id in row['AttributesIds'].split(',')]
            for attr_id in attr_ids:
                image_metadata[image_id]['attributes'].add(attributes_map.get(attr_id))
    
    structured_metadata = []
    for data in image_metadata.values():
        structured_attrs = map_attributes_to_schema(data['categories'], data['attributes'])
        data['structured_metadata'] = structured_attrs
        structured_metadata.append(data)
    
    random.shuffle(structured_metadata)
    return structured_metadata

def upload_to_supabase(bucket_name: str, table_name: str, items: list):
    print(f"\nUploading {len(items)} items to Supabase table '{table_name}' and bucket '{bucket_name}'...")
    
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if bucket_name not in bucket_names:
            print(f"Bucket '{bucket_name}' not found. Creating it now...")
            try:
                supabase.storage.create_bucket(bucket_name)
                print(f"Bucket '{bucket_name}' created successfully.")
            except Exception as e:
                print(f"Failed to create bucket '{bucket_name}': {e}")
                return
        else:
            print(f"Storage bucket '{bucket_name}' already exists.")
    except Exception as e:
        print(f"An error occurred during bucket setup: {e}")
        return

    for item in tqdm(items, desc=f"Uploading to {bucket_name}"):
        try:
            image_id = item['id']
            local_path = item['path']
            if not os.path.exists(local_path):
                tqdm.write(f"Image not found: {local_path}")
                continue

            if item['structured_metadata']['primary_color'] == "unknown":
                item['structured_metadata']['primary_color'] = detect_dominant_color(local_path)
                tqdm.write(f"Detected color for {image_id}: {item['structured_metadata']['primary_color']}")

            bucket_file_path = f"{image_id}.jpg"
            existing_files = supabase.storage.from_(bucket_name).list()
            existing_file_names = [f['name'] for f in existing_files]
            if bucket_file_path in existing_file_names:
                tqdm.write(f"File {bucket_file_path} already exists in bucket {bucket_name}. Skipping upload.")
            else:
                with open(local_path, 'rb') as f:
                    supabase.storage.from_(bucket_name).upload(
                        file=f,
                        path=bucket_file_path,
                        file_options={"content-type": "image/jpeg"}
                    )
                tqdm.write(f"Uploaded {bucket_file_path} to bucket {bucket_name}.")

            public_url = supabase.storage.from_(bucket_name).get_public_url(bucket_file_path)
            db_record = {
                "name": item['id'],
                "image_url": public_url,
                "metadata": item['structured_metadata']
            }
            supabase.table(table_name).upsert(db_record, on_conflict="name").execute()
        except Exception as e:
            tqdm.write(f"Failed to upload {image_id}: {e}")

def build_embedding_store(items: list):
    print(f"\nBuilding embedding store with {len(items)} items...")
    model = SentenceTransformer('clip-ViT-B-32')
    embedding_dim = 512
    all_embeddings, all_metadata = [], []

    for item in tqdm(items, desc="Generating embeddings"):
        bucket_file_path = f"{item['id']}.jpg"
        public_url = supabase.storage.from_(EMBEDDING_BUCKET).get_public_url(bucket_file_path)
        item['path'] = public_url
        try:
            response = requests.get(public_url, stream=True, timeout=10)
            if response.status_code != 200:
                tqdm.write(f"Failed to fetch image {item['id']} from {public_url}: Status {response.status_code}")
                continue
            image = Image.open(response.raw).convert("RGB")
            embedding = model.encode([image])[0]
            all_embeddings.append(embedding)
            all_metadata.append(item)
            tqdm.write(f"Successfully processed image {item['id']}")
        except Exception as e:
            tqdm.write(f"Skipping image {item['id']} due to error: {e}")
            continue
    
    if not all_embeddings:
        print("No embeddings generated. Exiting.")
        return

    embeddings_np = np.array(all_embeddings).astype('float32')
    index = faiss.IndexFlatL2(embedding_dim)
    index.add(embeddings_np)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    faiss.write_index(index, INDEX_FILE)
    print(f"FAISS index saved to {INDEX_FILE}")
    with open(METADATA_FILE, 'wb') as f:
        pickle.dump(all_metadata, f)
    print(f"Metadata saved to {METADATA_FILE}")

def main():
    print("--- Starting Full Data Pipeline ---")
    all_data = load_and_preprocess_data()
    
    quiz_pool = all_data[:QUIZ_POOL_SIZE]
    embedding_pool = all_data[QUIZ_POOL_SIZE:6001]
    print(f"Data split: {len(quiz_pool)} for quizzes, {len(embedding_pool)} for recommendations.")

    # upload_to_supabase(INITIAL_QUIZ_BUCKET, "initial_quiz_img", quiz_pool[:INITIAL_QUIZ_SIZE])
    # upload_to_supabase(REFINE_QUIZ_BUCKET, "refine_quiz_img", quiz_pool[INITIAL_QUIZ_SIZE:INITIAL_QUIZ_SIZE + REFINE_QUIZ_SIZE])
    # upload_to_supabase(QUIZ_POOL_BUCKET, "quiz_pool_img", quiz_pool)
    # upload_to_supabase(EMBEDDING_BUCKET, EMBEDDING_TABLE, embedding_pool)

    build_embedding_store(embedding_pool)

    print("--- Full Data Pipeline Finished Successfully ---")

if __name__ == "__main__":
    main()