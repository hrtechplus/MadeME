from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.lg import logger
from models.connecteduserssingleton import connected_users
import json

router = APIRouter()


@router.websocket(path="/ws/users/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    try:
        await websocket.accept()
        connected_users.add_user(user_id, websocket)
        logger.info(f"User {user_id} connected to WebSocket.")

        while True:
            try:
                data = await websocket.receive_text()
                user_data = json.loads(data)

                # Check message type
                message_type = user_data.get("type", "USER_UPDATE")
                
                if message_type == "USER_UPDATE":
                    # Handle user location update
                    latitude = user_data.get("location", {}).get('latitude')
                    longitude = user_data.get("location", {}).get('longitude')
                    order_id = user_data.get("orderId")

                    # Update user information
                    connected_users.update_location(user_id, latitude, longitude)
                    if order_id:
                        connected_users.update_order(user_id, order_id)

                    logger.info(f"User {user_id} updated location: {latitude}, {longitude}, order: {order_id}")
                    await websocket.send_text(f"Location updated for user {user_id}")
                
                elif message_type == "JOIN_ORDER_TRACKING":
                    # User wants to join a room to track a specific order
                    order_id = user_data.get("orderId")
                    if order_id:
                        connected_users.join_room(user_id, f"order_{order_id}")
                        logger.info(f"User {user_id} joined tracking for order {order_id}")
                        await websocket.send_text(json.dumps({
                            "type": "JOIN_SUCCESS",
                            "message": f"Now tracking order {order_id}",
                            "orderId": order_id
                        }))
                
                elif message_type == "LEAVE_ORDER_TRACKING":
                    # User wants to leave a tracking room
                    order_id = user_data.get("orderId")
                    if order_id:
                        connected_users.leave_room(user_id, f"order_{order_id}")
                        logger.info(f"User {user_id} left tracking for order {order_id}")
                        await websocket.send_text(json.dumps({
                            "type": "LEAVE_SUCCESS",
                            "message": f"No longer tracking order {order_id}",
                            "orderId": order_id
                        }))
                
                else:
                    # Unknown message type
                    logger.warning(f"Unknown message type from user {user_id}: {message_type}")

            except WebSocketDisconnect:
                logger.info(f"User {user_id} disconnected.")
                connected_users.remove_user(user_id)
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop for user {user_id}: {e}")
                connected_users.remove_user(user_id)
                await websocket.close()
                break

    except WebSocketDisconnect:
        connected_users.remove_user(user_id)
        logger.info(f"User {user_id} disconnected.")
        await websocket.close()
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket endpoint for user {user_id}: {e}")
        connected_users.remove_user(user_id)
        await websocket.close()


async def send_notification_to_user(user_id: str, message: str, order: dict = None):
    websocket = connected_users.get_websocket(user_id)
    if websocket:
        try:
            payload = {
                "type": "NOTIFICATION",
                "message": message,
                "order": order
            }
            if message:
                await websocket.send_text(json.dumps(payload))
            else:
                logger.warning("Empty message cannot be sent.")
        except Exception as e:
            logger.error(f"Failed to send message to user {user_id}: {e}")
    else:
        logger.warning(f"User {user_id} not connected.")


async def send_order_update_to_tracking_users(order_id: str, update_data: dict):
    """Send real-time updates to all users tracking a specific order"""
    try:
        room_name = f"order_{order_id}"
        users_in_room = connected_users.get_users_in_room(room_name)
        
        if not users_in_room:
            logger.info(f"No users tracking order {order_id}")
            return
        
        update_data["type"] = "ORDER_UPDATE"
        payload = json.dumps(update_data)
        
        for user_id in users_in_room:
            websocket = connected_users.get_websocket(user_id)
            if websocket:
                try:
                    await websocket.send_text(payload)
                    logger.info(f"Sent order update to user {user_id} for order {order_id}")
                except Exception as e:
                    logger.error(f"Failed to send order update to user {user_id}: {e}")
            
    except Exception as e:
        logger.error(f"Error sending order update for order {order_id}: {e}")
