import os
from bson import ObjectId

from schemas.serializer import serialize_dict, serialize_list
from services.db import get_db
from services.emailservice import send_email


async def get_collection():
    async for db in get_db():
        yield db[os.environ.get('NOTIFICATION_DB', 'notification')]


async def create(notification_data: dict):
    if notification_data.get("user_role") == "delivery_driver" and notification_data.get("type") == "order_complete":
        order_id = notification_data.get("order")
        email_receiver = "bleezbub12@gmail.com"
        if email_receiver and order_id:
            message = f"You have completed the delivery. Order ID: {order_id}. Thank you!"
            send_email(email_receiver=email_receiver, message=message, subject="Order Completed")

    async for collection in get_collection():
        result = await collection.insert_one(notification_data)
        return str(result.inserted_id)


async def get_by_id(notification_id: str) -> dict:
    async for collection in get_collection():
        result = await collection.find_one({'_id': ObjectId(notification_id)})
        if result:
            return serialize_dict(result)
        return {'message': "notification not found"}


async def get_by_user(user_id: str) -> list:
    async for collection in get_collection():
        result = await collection.find({'user': user_id}).to_list(length=1000)
        if result:
            return serialize_list(result)
        return [{'message': "user not found"}]


async def get_all() -> list:
    async for collection in get_collection():
        results = await collection.find().to_list(length=1000)
        return serialize_list(results)


async def update(notification_id: str, notification_data: dict) -> dict:
    async for collection in get_collection():
        existing_notification = await collection.find_one({'_id': ObjectId(notification_id)})

        if not existing_notification:
            return None

        await collection.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": notification_data}
        )
        updated = await collection.find_one({"_id": ObjectId(notification_id)})
        return serialize_dict(updated)


async def delete(notification_id: str) -> bool:
    async for collection in get_collection():
        result = await collection.delete_one({"_id": ObjectId(notification_id)})
        return result.deleted_count > 0
