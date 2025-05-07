import os
from datetime import datetime, timedelta
from typing import Optional, Any, Mapping

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from motor.motor_asyncio import AsyncIOMotorCollection

from services.db import get_db

ACCESS_TOKEN_EXPIRE_MINUTES = 30
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in environment variables")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/deliverydriver/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    if plain_password == hashed_password:
        return True
    else:
        return False


async def authenticate_user(collection: AsyncIOMotorCollection, email: str, password: str) -> Mapping[str, Any] | None:
    driver_dict = await collection.find_one({"email": email})
    if not driver_dict:
        return None

    if not verify_password(password, driver_dict["password"]):
        return None

    return driver_dict


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_collection(db=Depends(get_db)):
    return db[os.environ.get('DELIVERY_DRIVER_DB', 'delivery_drivers')]


async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    collection: AsyncIOMotorCollection = Depends(get_collection)
):
    user = await authenticate_user(collection, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": "delivery_driver", "id": str(user["_id"])},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

