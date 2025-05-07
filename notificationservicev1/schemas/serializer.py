from typing import List

from bson import ObjectId


def serializedict(document: dict) -> dict:
    return {
        str(key): str(value) if isinstance(value, ObjectId) else value
        for key, value in document.items()
    }


def serializelist(documents: List[dict]) -> List[dict]:
    return [serializedict(doc) for doc in documents]


def serialize_dict(obj) -> dict:
    obj["_id"] = str(obj["_id"])
    return obj


def serialize_list(objs) -> list:
    return [serialize_dict(obj) for obj in objs]
