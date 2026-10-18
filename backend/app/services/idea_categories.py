"""Idea categories: the id the frontend sends → the words searched on Google Maps.

Kept in step with the table in frontend-spec.md §4.5.1. Any category works for any trip;
the frontend decides which ones to show for each Trip Type.
"""

SEARCH_WORDS = {
    # Every trip
    "top-sights": "top attractions",
    "museums": "museums",
    "parks": "parks and gardens",
    "restaurants": "restaurants",
    "cafes": "cafes",
    # Solo
    "walking-tours": "walking tours",
    "viewpoints": "viewpoints",
    "markets": "markets",
    # Couple (plus viewpoints)
    "romantic-dinner": "romantic restaurants",
    "wine-bars": "wine bars",
    # Family
    "kid-friendly": "kid friendly activities",
    "zoos-aquariums": "zoo aquarium",
    "playgrounds": "playgrounds",
    # Friends
    "nightlife": "nightlife",
    "food-markets": "food markets",
    "group-activities": "group activities",
}
