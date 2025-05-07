from typing import Optional

from pydantic import BaseModel
from bson import ObjectId


class NotificationModel(BaseModel):
    user: ObjectId
    user_role: str
    order: Optional[ObjectId]
    type: Optional[str]
    message: Optional[str]
    status: bool

    class Config:
        arbitrary_types_allowed = True


