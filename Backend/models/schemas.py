from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Swipe(BaseModel):
    imageId: str | int
    swipe: int
    metadata: Dict[str, Any]

class Recommendation(BaseModel):
    id: str
    name: str
    image: str
    fit: Optional[str] = None
    primary_color: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None

class QuizImage(BaseModel):
    id: int
    name: str
    uri: str
    metadata: Dict[str, Any]

class UserRequest(BaseModel):
    user_id: str

class RefineTasteRequest(BaseModel):
    user_id: str
    swipes: List[Swipe]

class InitialQuizSubmission(BaseModel):
    user_id: str
    swipes: List[Swipe]