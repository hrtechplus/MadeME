from fastapi import WebSocket
from services.lg import logger

class ConnectedUsers:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.users = {}  # {user_id: websocket}
            cls._instance.user_locations = {}  # {user_id: {latitude, longitude}}
            cls._instance.user_orders = {}  # {user_id: order_id}
            cls._instance.rooms = {}  # {room_name: set(user_ids)}
            cls._instance.user_rooms = {}  # {user_id: set(room_names)}
        return cls._instance

    def add_user(self, user_id, websocket):
        self.users[user_id] = websocket
        self.user_rooms[user_id] = set()

    def update_location(self, user_id, latitude, longitude):
        if latitude and longitude:
            self.user_locations[user_id] = {"latitude": latitude, "longitude": longitude}

    def update_order(self, user_id, order_id):
        self.user_orders[user_id] = order_id
        # Automatically add user to tracking room for their order
        self.join_room(user_id, f"order_{order_id}")

    def get_websocket(self, user_id):
        return self.users.get(user_id)

    def remove_user(self, user_id):
        if user_id in self.users:
            del self.users[user_id]
        if user_id in self.user_locations:
            del self.user_locations[user_id]
        if user_id in self.user_orders:
            del self.user_orders[user_id]
        
        # Remove user from all rooms
        if user_id in self.user_rooms:
            for room_name in self.user_rooms[user_id]:
                if room_name in self.rooms and user_id in self.rooms[room_name]:
                    self.rooms[room_name].remove(user_id)
            del self.user_rooms[user_id]

    def join_room(self, user_id, room_name):
        """Add a user to a specific room (e.g., for order tracking)"""
        if room_name not in self.rooms:
            self.rooms[room_name] = set()
        
        self.rooms[room_name].add(user_id)
        
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
            
        self.user_rooms[user_id].add(room_name)

    def leave_room(self, user_id, room_name):
        """Remove a user from a specific room"""
        if room_name in self.rooms and user_id in self.rooms[room_name]:
            self.rooms[room_name].remove(user_id)
        
        if user_id in self.user_rooms and room_name in self.user_rooms[user_id]:
            self.user_rooms[user_id].remove(room_name)

    def get_users_in_room(self, room_name):
        """Get all users in a specific room"""
        return list(self.rooms.get(room_name, set()))

    def get_user_rooms(self, user_id):
        """Get all rooms a user is in"""
        return list(self.user_rooms.get(user_id, set()))


connected_users = ConnectedUsers()
