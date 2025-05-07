import os
from typing import List, Optional, Dict, Any

from bson import ObjectId

from models.deliverydriver import Status, VehicleSize
from schemas.serializer import serializelist, serializedict
from services.db import get_db

from services.lg import logger


async def create(driver_data: dict):
    if isinstance(driver_data['status'], str):
        driver_data['status'] = Status(driver_data['status']).value
    else:
        driver_data['status'] = driver_data['status'].value

    if isinstance(driver_data['vehicle'], str):
        driver_data['vehicle'] = VehicleSize(driver_data['vehicle']).value
    else:
        driver_data['vehicle'] = driver_data['vehicle'].value

    async for db in get_db():
        collection = db[os.environ.get('DELIVERY_DRIVER_DB', 'delivery_drivers')]
        if await collection.find_one({"email": driver_data["email"]}):
            logger.info(f"User with email {driver_data['email']} already exists.")
            return {"message": "Driver already exists"}
        result = await collection.insert_one(driver_data)
        return result.inserted_id


async def get_all() -> List[dict]:
    async for db in get_db():
        collection = db[os.environ.get('DELIVERY_DRIVER_DB', 'delivery_drivers')]
        drivers = await collection.find().to_list(length=100)

        serialized_drivers = serializelist(drivers)
        return serialized_drivers


async def get_by_id(driver_id: str) -> Optional[Dict]:
    async for db in get_db():
        collection = db[os.environ.get('DELIVERY_DRIVER_DB', 'delivery_drivers')]
        driver = await collection.find_one({"_id": ObjectId(driver_id)})
        if driver:
            return convert_enum_fields(serializedict(driver))
        return None


async def update(driver_id: str, update_data: Dict) -> dict:
    if 'status' in update_data:
        update_data['status'] = update_data['status'].value
    if 'vehicle' in update_data:
        update_data['vehicle'] = update_data['vehicle'].value

    async for db in get_db():
        collection = db[os.environ.get('DELIVERY_DRIVER_DB', 'delivery_drivers')]

        existing_driver = await collection.find_one({"_id": ObjectId(driver_id)})
        if not existing_driver:
            return {"message": "Driver not found"}

        result = await collection.update_one({"_id": ObjectId(driver_id)}, {"$set": update_data})
        if result.modified_count == 0:
            return serializedict(existing_driver)

        updated_driver = await collection.find_one({"_id": ObjectId(driver_id)})
        return serializedict(updated_driver)


async def delete(driver_id: str) -> int:
    async for db in get_db():
        collection = db[os.environ.get('DELIVERY_DRIVER_DB', 'delivery_drivers')]
        result = await collection.delete_one({"_id": ObjectId(driver_id)})
        return result.deleted_count


def convert_enum_fields(data: Any) -> Dict:
    if 'status' in data:
        data['status'] = Status(data['status'])
    if 'vehicle' in data:
        data['vehicle'] = VehicleSize(data['vehicle'])
    return data
