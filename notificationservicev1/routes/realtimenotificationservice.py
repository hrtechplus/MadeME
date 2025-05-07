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

                latitude = user_data.get("location", {}).get('latitude')
                longitude = user_data.get("location", {}).get('longitude')
                order = user_data.get("order")

                connected_users.update_location(user_id, latitude, longitude)
                connected_users.update_order(user_id, order)

                logger.info(f"User {user_id} updated location: {latitude}, {longitude}, {order}")

                await websocket.send_text(f"Location updated for driver {user_id}")

            except WebSocketDisconnect:
                logger.info(f"Driver {user_id} disconnected.")
                connected_users.remove_user(user_id)
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop for user {user_id}: {e}")
                connected_users.remove_user(user_id)
                await websocket.close()
                break

    except WebSocketDisconnect:
        connected_users.remove_user(user_id)
        logger.info(f"Driver {user_id} disconnected.")
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
