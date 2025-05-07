class ConnectedDrivers:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.drivers = {}  # The shared dictionary
        return cls._instance

    def update_location(self, driver_id, latitude, longitude):
        self.drivers[driver_id] = {"latitude": latitude, "longitude": longitude}

    def get_location(self, driver_id):
        return self.drivers.get(driver_id)

    def remove_driver(self, driver_id):
        if driver_id in self.drivers:
            del self.drivers[driver_id]

    def get_connected_drivers(self):
        return self.drivers


connected_drivers = ConnectedDrivers()
