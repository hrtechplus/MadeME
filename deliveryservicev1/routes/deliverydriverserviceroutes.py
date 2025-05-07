from typing import List

from fastapi import APIRouter, HTTPException, Depends
from starlette import status

from middlewares.accessmiddleware import get_current_user_with_role
from models.connecteddriverssingleton import connected_drivers
from services.deliverydriverauth import oauth2_scheme
from services.deliverydriverservice import get_all, get_by_id, update, delete

router = APIRouter()


async def delivery_driver_required(token: str = Depends(oauth2_scheme)):
    return await get_current_user_with_role("delivery_driver", token)


@router.get(path="/ws/drivers/cdrivers", description="get all connected drivers", response_model=dict)
async def get_currently_connected_drivers():
    return connected_drivers.get_connected_drivers()


@router.post(path="/assignments", description="handle new order assignment", status_code=status.HTTP_201_CREATED)
async def handle_order_assignment(assignment_data: dict):
    try:
        order_id = assignment_data.get("orderId")
        driver_id = assignment_data.get("driverId")
        order_details = assignment_data.get("orderDetails", {})
        
        if not order_id or not driver_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order ID and Driver ID are required")
        
        # Check if driver exists
        driver = await get_by_id(driver_id)
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        
        # Update driver with assignment
        driver_assignments = driver.get("assignments", [])
        driver_assignments.append({
            "orderId": order_id,
            "status": "ASSIGNED",
            "assignedAt": str(assignment_data.get("assignedAt", "")),
            "customerAddress": order_details.get("deliveryAddress", {}),
            "restaurantId": order_details.get("restaurantId", ""),
            "specialInstructions": order_details.get("specialInstructions", "")
        })
        
        # Update driver status to assigned
        update_data = {
            "status": "ASSIGNED",
            "currentOrderId": order_id,
            "assignments": driver_assignments
        }
        
        updated_driver = await update(driver_id, update_data)
        
        # If driver is connected, send them a real-time notification about the assignment
        if connected_drivers.is_driver_connected(driver_id):
            websocket = connected_drivers.get_driver_websocket(driver_id)
            if websocket:
                try:
                    await websocket.send_json({
                        "type": "NEW_ASSIGNMENT",
                        "orderId": order_id,
                        "customerAddress": order_details.get("deliveryAddress", {}),
                        "restaurantId": order_details.get("restaurantId", ""),
                        "items": order_details.get("items", 0),
                        "specialInstructions": order_details.get("specialInstructions", "")
                    })
                except Exception as e:
                    print(f"Error sending assignment notification to driver: {e}")
        
        return {"success": True, "message": "Assignment handled successfully", "driverId": driver_id, "orderId": order_id}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/drivers", response_model=List[dict], status_code=status.HTTP_200_OK,
            description="get all delivery drivers", dependencies=[Depends(delivery_driver_required)])
async def get_all_drivers():
    try:
        drivers = await get_all()
        return drivers
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/drivers/{driver_id}", response_model=dict, status_code=status.HTTP_200_OK,
            description="get driver details by id", dependencies=[Depends(delivery_driver_required)])
async def get_driver_by_id(driver_id: str):
    try:
        driver = await get_by_id(driver_id)
        if driver is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        return driver
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/drivers/{driver_id}", response_model=dict, status_code=status.HTTP_200_OK,
            description="update driver details", dependencies=[Depends(delivery_driver_required)])
async def update_driver(driver_id: str, update_data: dict):
    try:
        updated_driver = await update(driver_id, update_data)
        if not updated_driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        return updated_driver
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT,
               description="delete driver details", dependencies=[Depends(delivery_driver_required)])
async def delete_driver(driver_id: str,
                        driver_data: dict = Depends(delivery_driver_required)):
    try:
        deleted_count = await delete(driver_id)
        if deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
