import hashlib
from typing import Optional, List

import bcrypt
from pydantic import BaseModel
from enum import Enum

from pydantic.v1 import validator
from bson import ObjectId


class Status(Enum):
    idle = 'idle'
    on_route = 'on-route'
    arrived = 'arrived'
    delivered = 'delivered'


class VehicleSize(Enum):
    small = 'small'
    medium = 'medium'
    large = 'large'


class DeliveryDriver(BaseModel):
    name: str
    email: str
    password: str
    address: str
    city: str
    phone: str
    status: Status
    location: str
    vehicle: VehicleSize
    deliveries: int
    rating: float
    currentdelivery: Optional[List[ObjectId]]

    class Config:
        arbitrary_types_allowed = True

    @validator("password", pre=True, always=True)
    def hash_password(cls, value):
        if not value:
            raise ValueError("Password cannot be empty")
        hashed_password = bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()
        return hashed_password


class TokenData(BaseModel):
    email: Optional[str] = None
