from ninja import NinjaAPI
from api.api import router as github_router

api = NinjaAPI(
    title="Dev Analytics API",
    version="1.0.0",
    description="Backend API for fetching and analyzing GitHub profiles."
)

api.add_router("/github", github_router)

@api.get("/health", tags=["System"])
def health_check(request):
    """
    Endpoint to verify if the API is running correctly.
    Used by monitoring tools and load balancers.
    """
    return {"status": "ok", "message": "Service is healthy"}
