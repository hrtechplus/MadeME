import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt

from services.lg import logger
from models.connecteddriverssingleton import connected_drivers

router = APIRouter()

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in environment variables")


@router.websocket(path="/ws/drivers/{driver_id}")
async def websocket_endpoint(websocket: WebSocket, driver_id: str):
    try:
        # Authenticate driver
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008, reason="Missing token")
            return

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "delivery_driver":
            await websocket.close(code=1008, reason="Invalid role")
            return

        # Accept WebSocket connection
        await websocket.accept()
        logger.info(f"Driver {driver_id} connected to WebSocket.")

        while True:
            data = await websocket.receive_text()

            try:
                location_data = json.loads(data)
                latitude = location_data.get('latitude')
                longitude = location_data.get('longitude')

                if latitude is None or longitude is None:
                    logger.warning(f"Invalid location data from driver {driver_id}: {location_data}")
                    continue  # Ignore bad data

                connected_drivers.update_location(driver_id, latitude, longitude)
                logger.info(f"Driver {driver_id} updated location: {latitude}, {longitude}")

                await websocket.send_text(f"Location updated for driver {driver_id}")

            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON from driver {driver_id}: {data}")
                continue

    except WebSocketDisconnect:
        connected_drivers.remove_driver(driver_id)
        logger.info(f"Driver {driver_id} disconnected.")

    except Exception as e:
        logger.error(f"Unexpected error for driver {driver_id}: {e}")
        connected_drivers.remove_driver(driver_id)
