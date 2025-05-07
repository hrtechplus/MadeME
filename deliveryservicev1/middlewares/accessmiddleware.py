import os

from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError

from services.deliverydriverauth import oauth2_scheme

SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("SECRET_KEY and ALGORITHM must be set in environment variables")


async def get_current_user_with_role(required_role: str, token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_role: str = payload.get("role")
        if user_role is None or user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
