from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorCollection
from starlette import status

from schemas.serializer import serializedict
from services.adminauth import login_for_access_token_admin
from services.deliverydriverservice import create

from services.deliverydriverauth import login_for_access_token, get_collection

router = APIRouter()


@router.post("/auth/login", description="Login functionality for delivery drivers",
             status_code=status.HTTP_202_ACCEPTED)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        collection: AsyncIOMotorCollection = Depends(get_collection)
):
    return await login_for_access_token(form_data, collection)


@router.post(path="/auth/register", description="Register functionality for delivery drivers",
             status_code=status.HTTP_200_OK)
async def create_driver(driver_data: dict):
    try:
        driver_id = await create(driver_data)
        driver_data["_id"] = driver_id
        return serializedict(driver_data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/auth/login/admin", description="Login functionality for delivery drivers",
             status_code=status.HTTP_202_ACCEPTED)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        collection: AsyncIOMotorCollection = Depends(get_collection)
):
    return await login_for_access_token_admin(form_data, collection)
