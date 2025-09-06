from fastapi import FastAPI
from api import quiz_routes, recommendation_routes # Import both routers
import uvicorn

app = FastAPI(
    title="Thuli Fashion Recommendation API",
    description="API for the DressUp personalized styling app.",
    version="1.0.0"
)

# --- This is the crucial part that was missing ---
# Include the routers with a prefix. Now your app will recognize
# routes like /api/quiz/initial and /api/recommendations
app.include_router(quiz_routes.router, prefix="/api", tags=["Quiz"])
app.include_router(recommendation_routes.router, prefix="/api", tags=["Recommendations"])


@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Thuli Hackathon API!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

