"""The only code that calls SerpApi (Google Maps engine), for the Ideas panel.

Free plan: 250 searches a month, so there is no retry; a retry would spend another search.
"""

import httpx2

from ..config import get_settings

SEARCH_URL = "https://serpapi.com/search.json"
TIMEOUT_SECONDS = 10
MAX_IDEAS = 10


class SerpApiError(Exception):
    """SerpApi couldn't answer. The message is safe to log: it never contains the key."""


def search_places(query: str) -> list[dict]:
    """Up to 10 places for e.g. "museums in Paris, France", in the API's `Idea` shape."""
    key = get_settings().serpapi_key
    if not key:
        raise SerpApiError("SERPAPI_KEY is not set")
    params = {"engine": "google_maps", "type": "search", "q": query, "hl": "en", "api_key": key}
    try:
        response = httpx2.get(SEARCH_URL, params=params, timeout=TIMEOUT_SECONDS)
        data = response.json()
    except (httpx2.HTTPError, ValueError) as exc:
        # Only the class name: an httpx error's text can include the URL, and so the key.
        raise SerpApiError(exc.__class__.__name__) from None

    error = data.get("error") if isinstance(data, dict) else "not a JSON object"
    if error:
        # SerpApi reports "nothing found" as an error; for us it's an empty list.
        if "hasn't returned any results" in str(error):
            return []
        raise SerpApiError(f"HTTP {response.status_code}: {error}")
    if response.status_code != 200:
        raise SerpApiError(f"HTTP {response.status_code}")

    places = data.get("local_results")
    if places is None and isinstance(data.get("place_results"), dict):
        places = [data["place_results"]]  # the search matched one exact place
    return _to_ideas(places or [])


def _to_ideas(places: list) -> list[dict]:
    ideas: list[dict] = []
    seen: set[str] = set()
    for place in places:
        name = _text(place.get("title")) if isinstance(place, dict) else None
        if not name:
            continue
        idea = {
            "id": _text(place.get("place_id")) or _text(place.get("data_id")) or name,
            "name": name,
            "rating": _number(place.get("rating"), float),
            "reviews": _number(place.get("reviews"), int),
            "priceLevel": _text(place.get("price")),
            "type": _text(place.get("type")),
            "address": _text(place.get("address")),
            "thumbnailUrl": _https(place.get("thumbnail")),
        }
        if idea["id"] in seen:
            continue
        seen.add(idea["id"])
        ideas.append(idea)
        if len(ideas) == MAX_IDEAS:
            break
    return ideas


def _text(value) -> str | None:
    return (value.strip() or None) if isinstance(value, str) else None


def _number(value, kind):
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    return kind(value)


def _https(value) -> str | None:
    url = _text(value)
    return url if url and url.startswith("https://") else None
