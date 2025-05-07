import os
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt

from services.lg import logger
from models.connecteddriverssingleton import connected_drivers
from services.deliverydriverservice import get_by_id, update

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
        
        # Store the WebSocket connection
        connected_drivers.add_driver(driver_id, websocket)
        
        # Update driver status to ONLINE in database
        try:
            driver = await get_by_id(driver_id)
            if driver:
                await update(driver_id, {"status": "ONLINE"})
                connected_drivers.update_driver_status(driver_id, "ONLINE")
        except Exception as e:
            logger.error(f"Error updating driver status: {e}")

        while True:
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)
                
                # Handle different message types
                message_type = message_data.get('type', 'LOCATION_UPDATE')
                
                if message_type == 'LOCATION_UPDATE':
                    latitude = message_data.get('latitude')
                    longitude = message_data.get('longitude')
                    
                    if latitude is None or longitude is None:
                        logger.warning(f"Invalid location data from driver {driver_id}: {message_data}")
                        continue  # Ignore bad data
                    
                    # Update location in our singleton
                    connected_drivers.update_location(driver_id, latitude, longitude)
                    logger.info(f"Driver {driver_id} updated location: {latitude}, {longitude}")
                    
                    # Check if driver has a current order
                    current_order_id = message_data.get('currentOrderId')
                    if current_order_id:
                        # Forward location to order service for tracking
                        try:
                            from urllib.request import Request, urlopen
                            import urllib.error
                            import urllib.parse
                            
                            # Prepare the request data
                            data = {
                                "driverId": driver_id,
                                "latitude": latitude,
                                "longitude": longitude
                            }
                            
                            # Convert data to JSON and encode to bytes
                            encoded_data = json.dumps(data).encode('utf-8')
                            
                            # Set up the request
                            url = f"{os.getenv('ORDER_SERVICE_URL', 'http://localhost:8004')}/api/orders/{current_order_id}/location"
                            headers = {
                                'Content-Type': 'application/json'
                            }
                            req = Request(url, data=encoded_data, headers=headers, method='POST')
                            
                            # Send the request
                            with urlopen(req) as response:
                                response_data = response.read().decode('utf-8')
                                logger.info(f"Location update sent to order service: {response_data}")
                        except urllib.error.URLError as e:
                            logger.error(f"Error sending location to order service: {e}")
                    
                    await websocket.send_text(f"Location updated for driver {driver_id}")
                
                elif message_type == 'STATUS_UPDATE':
                    status = message_data.get('status')
                    valid_statuses = ["ONLINE", "OFFLINE", "BUSY", "AVAILABLE", "ON_DELIVERY"]
                    
                    if status and status in valid_statuses:
                        connected_drivers.update_driver_status(driver_id, status)
                        await update(driver_id, {"status": status})
                        await websocket.send_text(f"Status updated for driver {driver_id} to {status}")
                    else:
                        logger.warning(f"Invalid status update from driver {driver_id}: {message_data}")
                
                elif message_type == 'ORDER_UPDATE':
                    order_id = message_data.get('orderId')
                    order_status = message_data.get('orderStatus')
                    
                    valid_statuses = ["PICKED_UP", "DELIVERED", "DELAYED"]
                    if order_id and order_status and order_status in valid_statuses:
                        # Update order status by calling order service
                        try:
                            from urllib.request import Request, urlopen
                            import urllib.error
                            import urllib.parse
                            
                            data = {
                                "status": "DELIVERED" if order_status == "DELIVERED" else "OUT_FOR_DELIVERY"
                            }
                            
                            encoded_data = json.dumps(data).encode('utf-8')
                            url = f"{os.getenv('ORDER_SERVICE_URL', 'http://localhost:8004')}/api/orders/{order_id}/status"
                            headers = {
                                'Content-Type': 'application/json'
                            }
                            req = Request(url, data=encoded_data, headers=headers, method='PATCH')
                            
                            with urlopen(req) as response:
                                response_data = response.read().decode('utf-8')
                                logger.info(f"Order status update sent: {response_data}")
                                
                                # If order delivered, update driver status
                                if order_status == "DELIVERED":
                                    connected_drivers.update_driver_status(driver_id, "AVAILABLE")
                                    await update(driver_id, {"status": "AVAILABLE", "currentOrderId": None})
                                
                                await websocket.send_text(f"Order {order_id} status updated to {order_status}")
                        except urllib.error.URLError as e:
                            logger.error(f"Error updating order status: {e}")
                    else:
                        logger.warning(f"Invalid order update from driver {driver_id}: {message_data}")
                        
            except json.JSONDecodeError:
                logger.warning(f"Received invalid JSON from driver {driver_id}: {data}")
                continue

    except WebSocketDisconnect:
        connected_drivers.remove_driver(driver_id)
        # Update driver status to OFFLINE in database
        try:
            await update(driver_id, {"status": "OFFLINE"})
        except Exception as e:
            logger.error(f"Error updating driver status on disconnect: {e}")
        logger.info(f"Driver {driver_id} disconnected.")

    except Exception as e:
        logger.error(f"Unexpected error for driver {driver_id}: {e}")
        connected_drivers.remove_driver(driver_id)
        # Update driver status to OFFLINE in database
        try:
            await update(driver_id, {"status": "OFFLINE"})
        except Exception as e:
            logger.error(f"Error updating driver status on error: {e}")
