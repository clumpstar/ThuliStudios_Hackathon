from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from enum import IntEnum

# Enum for swipe values
class SwipeValue(IntEnum):
    DISLIKE = 0
    LIKE = 1

class Swipe(BaseModel):
    imageId: str | int
    swipe: SwipeValue
    metadata: Dict[str, Any]

    @validator('imageId', pre=True)
    def convert_image_id_to_str(cls, v):
        """Convert imageId to string for consistency."""
        return str(v)

    class Config:
        orm_mode = True

class Recommendation(BaseModel):
    id: str
    name: str
    image: str
    fit: Optional[str] = "regular"
    primary_color: Optional[str] = "unknown"
    brand: Optional[str] = "Unknown Brand"
    price: Optional[float] = 0.0

    class Config:
        orm_mode = True

class QuizImage(BaseModel):
    id: int
    name: str
    uri: str
    metadata: Dict[str, Any]

    class Config:
        orm_mode = True

class UserRequest(BaseModel):
    user_id: str

    class Config:
        orm_mode = True

class RefineTasteRequest(BaseModel):
    user_id: str
    swipes: List[Swipe]

    class Config:
        orm_mode = True

class InitialQuizSubmission(BaseModel):
    user_id: str
    swipes: List[Swipe]

class Config:
    orm_mode = True