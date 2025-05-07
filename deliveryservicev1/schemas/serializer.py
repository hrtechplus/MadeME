from typing import List

from bson import ObjectId


def serializedict(document: dict) -> dict:
    return {
        str(key): str(value) if isinstance(value, ObjectId) else value
        for key, value in document.items()
    }


def serializelist(documents: List[dict]) -> List[dict]:
    return [serializedict(doc) for doc in documents]
