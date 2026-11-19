from ninja import Router
from django.core.cache import cache
import requests
from typing import Dict, Any, List
from collections import Counter

router = Router(tags=["GitHub"])

CACHE_TIMEOUT = 900

@router.get("/{username}/", response=Dict[str, Any])
def get_github_profile(request, username: str):
    """
    Fetches public GitHub profile data for a given username.
    Uses Django's caching framework to prevent rate-limiting.
    """
    cache_key = f"github_profile_{username.lower()}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    headers = {
        "User-Agent": "Dev-Analytics-Dashboard",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        response = requests.get(f"https://api.github.com/users/{username}", headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {"error": f"User not found or API rate limit exceeded (Status: {response.status_code})"}

        data = response.json()
        
        profile_data = {
            "username": data.get("login"),
            "name": data.get("name"),
            "avatar_url": data.get("avatar_url"),
            "bio": data.get("bio"),
            "public_repos": data.get("public_repos"),
            "followers": data.get("followers"),
            "following": data.get("following"),
        }

        cache.set(cache_key, profile_data, CACHE_TIMEOUT)
        return profile_data

    except requests.exceptions.RequestException:
        return {"error": "Could not connect to GitHub API. Please check your network."}


@router.get("/{username}/languages/", response=List[Dict[str, Any]])
def get_github_languages(request, username: str):
    """
    Fetches the user's repositories and aggregates the languages used.
    Returns a list of {name: str, value: int} sorted by frequency.
    """
    cache_key = f"github_langs_{username.lower()}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    headers = {
        "User-Agent": "Dev-Analytics-Dashboard",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        # Fetch up to 100 repos (max per page for public API)
        response = requests.get(
            f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated", 
            headers=headers, 
            timeout=10
        )
        
        if response.status_code != 200:
            return []

        repos = response.json()
        
        # Count languages
        languages = [repo.get("language") for repo in repos if repo.get("language")]
        language_counts = Counter(languages)
        
        # Format for Recharts
        result = [{"name": lang, "value": count} for lang, count in language_counts.most_common(6)]
        
        cache.set(cache_key, result, CACHE_TIMEOUT)
        return result

    except requests.exceptions.RequestException:
        return []
    