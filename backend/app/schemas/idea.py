from .common import ResponseModel, UtcTimestamp


class IdeaOut(ResponseModel):
    id: str
    name: str
    rating: float | None
    reviews: int | None
    price_level: str | None
    type: str | None
    address: str | None
    thumbnail_url: str | None


class IdeasOut(ResponseModel):
    category: str
    query: str
    fetched_at: UtcTimestamp
    ideas: list[IdeaOut]
