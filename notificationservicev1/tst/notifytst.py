from fastapi import APIRouter, WebSocket

from routes.realtimenotificationservice import send_notification_to_user

router = APIRouter()


@router.post("/notify/{driver_id}")
async def notify_driver(driver_id: str):
    order = {
        "id": "order123",
        "pickup": "Pizza Place",
        "dropoff": "Customer House",
        "price": 20.5
    }
    await send_notification_to_user(
        user_id=driver_id,
        message="New delivery available!",
        order=order
    )
    return {"detail": "Notification sent."}
