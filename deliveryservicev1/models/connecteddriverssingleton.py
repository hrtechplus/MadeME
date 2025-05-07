class ConnectedDrivers:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.drivers = {}  # The shared dictionary for locations
            cls._instance.driver_sockets = {}  # Store WebSockets
            cls._instance.driver_statuses = {}  # Store driver statuses
        return cls._instance

    def update_location(self, driver_id, latitude, longitude):
        self.drivers[driver_id] = {"latitude": latitude, "longitude": longitude}

    def get_location(self, driver_id):
        return self.drivers.get(driver_id)

    def add_driver(self, driver_id, websocket):
        self.driver_sockets[driver_id] = websocket
        self.driver_statuses[driver_id] = "AVAILABLE"

    def update_driver_status(self, driver_id, status):
        self.driver_statuses[driver_id] = status

    def get_driver_status(self, driver_id):
        return self.driver_statuses.get(driver_id, "OFFLINE")

    def is_driver_connected(self, driver_id):
        return driver_id in self.driver_sockets

    def get_driver_websocket(self, driver_id):
        return self.driver_sockets.get(driver_id)

    def remove_driver(self, driver_id):
        if driver_id in self.drivers:
            del self.drivers[driver_id]
        if driver_id in self.driver_sockets:
            del self.driver_sockets[driver_id]
        if driver_id in self.driver_statuses:
            del self.driver_statuses[driver_id]

    def get_connected_drivers(self):
        # Enhanced response with status and location information
        result = {}
        for driver_id in self.driver_sockets:
            result[driver_id] = {
                "location": self.drivers.get(driver_id, {}),
                "status": self.driver_statuses.get(driver_id, "AVAILABLE"),
                "connected": True
            }
        return result


connected_drivers = ConnectedDrivers()
