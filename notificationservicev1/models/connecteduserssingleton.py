from fastapi import WebSocket
from services.lg import logger

class ConnectedUsers:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.users = {}
        return cls._instance

    def update_location(self, user_id, latitude, longitude):
        if user_id in self.users:
            self.users[user_id]["latitude"] = latitude
            self.users[user_id]["longitude"] = longitude

    def update_order(self, user_id, order: dict):
        if user_id in self.users:
            self.users[user_id]["order"] = order
            logger.info(self.users)

    def add_user(self, user_id, websocket: WebSocket):
        self.users[user_id] = {
            "latitude": None,
            "longitude": None,
            "websocket": websocket
        }

    def get_location(self, user_id):
        user = self.users.get(user_id)
        if user:
            return {"latitude": user["latitude"], "longitude": user["longitude"]}
        return None

    def get_websocket(self, user_id):
        user = self.users.get(user_id)
        if user:
            return user["websocket"]
        return None

    def remove_user(self, user_id):
        if user_id in self.users:
            del self.users[user_id]

    def get_connected_users(self):
        return self.users


connected_users = ConnectedUsers()
