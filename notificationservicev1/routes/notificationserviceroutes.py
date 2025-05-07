from fastapi import APIRouter, HTTPException, status, Body
from typing import List

from schemas.serializer import serialize_dict
from services.notificationcontrollerservice import create, get_by_id, get_all, update, delete, get_by_user
from routes.realtimenotificationservice import send_notification_to_user, send_order_update_to_tracking_users

router = APIRouter()


@router.post("/create", description="Create a notification", status_code=status.HTTP_201_CREATED)
async def create_notification(notification_data: dict = Body(...)):
    try:
        notification_data.setdefault('status', False)
        notification_id = await create(notification_data)
        notification_data["_id"] = notification_id
        
        # Send real-time notification to user if connected
        try:
            user_id = notification_data.get('userId')
            message = notification_data.get('message')
            order = notification_data.get('order')
            
            if user_id and message:
                await send_notification_to_user(user_id, message, order)
        except Exception as e:
            print(f"Error sending real-time notification: {e}")
        
        return serialize_dict(notification_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Creation Failed: {str(e)}")


@router.post("/order-update/{order_id}", description="Send real-time update about an order", status_code=status.HTTP_200_OK)
async def send_order_update(order_id: str, update_data: dict = Body(...)):
    try:
        # Validate required fields
        if not update_data.get('status'):
            raise HTTPException(status_code=400, detail="Order status is required")
        
        # Send real-time update to all users tracking this order
        await send_order_update_to_tracking_users(order_id, update_data)
        
        # Optionally, also create a persistent notification
        if update_data.get('userId') and update_data.get('message'):
            notification_data = {
                'userId': update_data['userId'],
                'message': update_data['message'],
                'type': 'ORDER_UPDATE',
                'orderId': order_id,
                'status': False,
                'orderStatus': update_data.get('status')
            }
            notification_id = await create(notification_data)
        
        return {"success": True, "message": "Order update sent successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Order Update Failed: {str(e)}")


@router.get("/get_all", description="Get all notifications", status_code=status.HTTP_200_OK)
async def get_all_notifications():
    try:
        notifications = await get_all()
        return notifications
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Get All Failed: {str(e)}")


@router.get(path="/get_all/{user_id}", description="get all notifications of a user", status_code=status.HTTP_200_OK)
async def get_all_usernotifications(user_id):
    try:
        notifications = await get_by_user(user_id)
        return notifications
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Get All user notifications Failed: {str(e)}")


@router.get("/get/{notification_id}", description="Get a notification by ID", status_code=status.HTTP_200_OK)
async def get_notification_by_id(notification_id: str):
    try:
        notification = await get_by_id(notification_id)
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        return notification
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Get By ID Failed: {str(e)}")


@router.put("/update/{notification_id}", description="Update a notification", status_code=status.HTTP_200_OK)
async def update_notification(notification_id: str, notification_data: dict = Body(...)):
    try:
        updated_notification = await update(notification_id, notification_data)
        if not updated_notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        return updated_notification
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update Failed: {str(e)}")


@router.delete("/delete/{notification_id}", description="Delete a notification", status_code=status.HTTP_200_OK)
async def delete_notification(notification_id: str):
    try:
        deleted = await delete(notification_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"message": "Notification deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete Failed: {str(e)}")
