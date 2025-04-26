import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import {
  Add,
  Edit,
  Delete,
  VisibilityOff,
  Visibility,
  RestaurantMenu,
  ArrowBack,
  Close,
  Save,
} from "@mui/icons-material";
import "../styles/RestaurantManagement.css";

const RestaurantManagement = () => {
  const navigate = useNavigate();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  // Form states
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    description: "",
    cuisine: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    contactPhone: "",
    contactEmail: "",
    operatingHours: {
      monday: { open: "", close: "" },
      tuesday: { open: "", close: "" },
      wednesday: { open: "", close: "" },
      thursday: { open: "", close: "" },
      friday: { open: "", close: "" },
      saturday: { open: "", close: "" },
      sunday: { open: "", close: "" },
    },
    imageUrl: "",
  });

  const [menuItemForm, setMenuItemForm] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    imageUrl: "",
    isAvailable: true,
  });

  useEffect(() => {
    fetchMyRestaurants();
  }, []);

  const fetchMyRestaurants = async () => {
    try {
      setLoading(true);
      const response = await handleApiCall(
        fetch(`${serviceUrls.restaurant}/api/restaurants/owner/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
      );

      if (response && response.data) {
        setRestaurants(response.data.restaurants || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("Failed to load your restaurants. Please try again later.");
      setLoading(false);
    }
  };

  const handleCreateRestaurant = () => {
    setEditMode(false);
    setRestaurantForm({
      name: "",
      description: "",
      cuisine: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      contactPhone: "",
      contactEmail: "",
      operatingHours: {
        monday: { open: "", close: "" },
        tuesday: { open: "", close: "" },
        wednesday: { open: "", close: "" },
        thursday: { open: "", close: "" },
        friday: { open: "", close: "" },
        saturday: { open: "", close: "" },
        sunday: { open: "", close: "" },
      },
      imageUrl: "",
    });
    setShowRestaurantModal(true);
  };

  const handleEditRestaurant = (restaurant) => {
    setEditMode(true);
    setSelectedRestaurant(restaurant);
    setRestaurantForm({
      name: restaurant.name,
      description: restaurant.description,
      cuisine: restaurant.cuisine,
      address: { ...restaurant.address },
      contactPhone: restaurant.contactPhone,
      contactEmail: restaurant.contactEmail,
      operatingHours: { ...restaurant.operatingHours },
      imageUrl: restaurant.imageUrl,
    });
    setShowRestaurantModal(true);
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        // Update existing restaurant
        await handleApiCall(
          fetch(
            `${serviceUrls.restaurant}/api/restaurants/${selectedRestaurant._id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(restaurantForm),
            }
          )
        );

        showToast("Restaurant updated successfully", "success");

        // Update the restaurant in state
        setRestaurants(
          restaurants.map((restaurant) =>
            restaurant._id === selectedRestaurant._id
              ? { ...restaurant, ...restaurantForm }
              : restaurant
          )
        );
      } else {
        // Create new restaurant
        const response = await handleApiCall(
          fetch(`${serviceUrls.restaurant}/api/restaurants`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(restaurantForm),
          })
        );

        showToast("Restaurant created successfully", "success");

        // Add the new restaurant to state
        setRestaurants([...restaurants, response.data]);
      }

      setShowRestaurantModal(false);
    } catch (error) {
      console.error("Error saving restaurant:", error);
      showToast(
        `Failed to ${
          editMode ? "update" : "create"
        } restaurant. Please try again.`,
        "error"
      );
    }
  };

  const handleRestaurantFormChange = (e) => {
    const { name, value } = e.target;

    // Handle nested properties (e.g., address.street)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setRestaurantForm({
        ...restaurantForm,
        [parent]: {
          ...restaurantForm[parent],
          [child]: value,
        },
      });
    } else {
      setRestaurantForm({ ...restaurantForm, [name]: value });
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setRestaurantForm({
      ...restaurantForm,
      operatingHours: {
        ...restaurantForm.operatingHours,
        [day]: {
          ...restaurantForm.operatingHours[day],
          [field]: value,
        },
      },
    });
  };

  const handleToggleRestaurantStatus = async (restaurantId, currentStatus) => {
    try {
      await handleApiCall(
        fetch(`${serviceUrls.restaurant}/api/restaurants/${restaurantId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        })
      );

      showToast(
        `Restaurant ${
          currentStatus ? "deactivated" : "activated"
        } successfully`,
        "success"
      );

      // Update the restaurant status in state
      setRestaurants(
        restaurants.map((restaurant) =>
          restaurant._id === restaurantId
            ? { ...restaurant, isActive: !currentStatus }
            : restaurant
        )
      );
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      showToast("Failed to update restaurant status", "error");
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) {
      return;
    }

    try {
      await handleApiCall(
        fetch(`${serviceUrls.restaurant}/api/restaurants/${restaurantId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
      );

      showToast("Restaurant deleted successfully", "success");

      // Remove the restaurant from state
      setRestaurants(restaurants.filter((r) => r._id !== restaurantId));
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      showToast("Failed to delete restaurant", "error");
    }
  };

  const handleManageMenuClick = (restaurantId) => {
    navigate(`/restaurant-menu/${restaurantId}`);
  };

  // Menu Item Management Functions
  const handleCreateMenuItem = (restaurantId) => {
    setEditMode(false);
    setSelectedRestaurant(restaurants.find((r) => r._id === restaurantId));
    setMenuItemForm({
      name: "",
      description: "",
      price: 0,
      category: "",
      imageUrl: "",
      isAvailable: true,
    });
    setShowMenuItemModal(true);
  };

  const handleEditMenuItem = (restaurant, menuItem) => {
    setEditMode(true);
    setSelectedRestaurant(restaurant);
    setSelectedMenuItem(menuItem);
    setMenuItemForm({
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      category: menuItem.category,
      imageUrl: menuItem.imageUrl,
      isAvailable: menuItem.isAvailable,
    });
    setShowMenuItemModal(true);
  };

  const handleMenuItemFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuItemForm({
      ...menuItemForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleMenuItemSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        // Update existing menu item
        await handleApiCall(
          fetch(
            `${serviceUrls.restaurant}/api/restaurants/${selectedRestaurant._id}/menu/${selectedMenuItem._id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(menuItemForm),
            }
          )
        );

        showToast("Menu item updated successfully", "success");

        // Update the menu item in state
        const updatedRestaurants = restaurants.map((restaurant) => {
          if (restaurant._id === selectedRestaurant._id) {
            return {
              ...restaurant,
              menu: restaurant.menu.map((item) =>
                item._id === selectedMenuItem._id
                  ? { ...item, ...menuItemForm }
                  : item
              ),
            };
          }
          return restaurant;
        });

        setRestaurants(updatedRestaurants);
      } else {
        // Create new menu item
        const response = await handleApiCall(
          fetch(
            `${serviceUrls.restaurant}/api/restaurants/${selectedRestaurant._id}/menu`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify(menuItemForm),
            }
          )
        );

        showToast("Menu item added successfully", "success");

        // Add the new menu item to state
        const updatedRestaurants = restaurants.map((restaurant) => {
          if (restaurant._id === selectedRestaurant._id) {
            return {
              ...restaurant,
              menu: [...(restaurant.menu || []), response.data],
            };
          }
          return restaurant;
        });

        setRestaurants(updatedRestaurants);
      }

      setShowMenuItemModal(false);
    } catch (error) {
      console.error("Error saving menu item:", error);
      showToast(
        `Failed to ${editMode ? "update" : "add"} menu item. Please try again.`,
        "error"
      );
    }
  };

  const handleDeleteMenuItem = async (restaurantId, menuItemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      await handleApiCall(
        fetch(
          `${serviceUrls.restaurant}/api/restaurants/${restaurantId}/menu/${menuItemId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
      );

      showToast("Menu item deleted successfully", "success");

      // Remove the menu item from state
      const updatedRestaurants = restaurants.map((restaurant) => {
        if (restaurant._id === restaurantId) {
          return {
            ...restaurant,
            menu: restaurant.menu.filter((item) => item._id !== menuItemId),
          };
        }
        return restaurant;
      });

      setRestaurants(updatedRestaurants);
    } catch (error) {
      console.error("Error deleting menu item:", error);
      showToast("Failed to delete menu item", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchMyRestaurants}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="restaurant-management-container">
      <h1 className="section-title">My Restaurants</h1>

      <button className="add-button" onClick={handleCreateRestaurant}>
        <Add /> Add New Restaurant
      </button>

      {restaurants.length === 0 ? (
        <div className="empty-state">
          <h3>No Restaurants Found</h3>
          <p>You don't have any restaurants yet. Create one to get started!</p>
        </div>
      ) : (
        restaurants.map((restaurant) => (
          <div key={restaurant._id} className="restaurant-card">
            <div className="restaurant-header">
              <h3 className="restaurant-name">{restaurant.name}</h3>
              <span
                className={`restaurant-status ${
                  restaurant.isActive ? "status-active" : "status-inactive"
                }`}
              >
                {restaurant.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="restaurant-details">
              <div className="detail-item">
                <span className="detail-label">Cuisine</span>
                <span className="detail-value">{restaurant.cuisine}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">
                  {restaurant.address?.street}, {restaurant.address?.city},{" "}
                  {restaurant.address?.state} {restaurant.address?.zipCode}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Contact</span>
                <span className="detail-value">
                  {restaurant.contactPhone} | {restaurant.contactEmail}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">
                  {formatDate(restaurant.createdAt)}
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => handleManageMenuClick(restaurant._id)}
              >
                <RestaurantMenu /> Manage Menu
              </button>

              <button
                className="btn btn-primary"
                onClick={() => handleEditRestaurant(restaurant)}
              >
                <Edit /> Edit
              </button>

              <button
                className={`btn ${
                  restaurant.isActive ? "btn-danger" : "btn-success"
                }`}
                onClick={() =>
                  handleToggleRestaurantStatus(
                    restaurant._id,
                    restaurant.isActive
                  )
                }
              >
                {restaurant.isActive ? (
                  <>
                    <VisibilityOff /> Deactivate
                  </>
                ) : (
                  <>
                    <Visibility /> Activate
                  </>
                )}
              </button>

              <button
                className="btn btn-danger"
                onClick={() => handleDeleteRestaurant(restaurant._id)}
              >
                <Delete /> Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* Restaurant Modal */}
      {showRestaurantModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editMode ? "Edit Restaurant" : "Add New Restaurant"}
              </h2>
              <button
                className="close-button"
                onClick={() => setShowRestaurantModal(false)}
              >
                <Close />
              </button>
            </div>

            <form onSubmit={handleRestaurantSubmit}>
              <div className="form-group">
                <label htmlFor="name">Restaurant Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={restaurantForm.name}
                  onChange={handleRestaurantFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={restaurantForm.description}
                  onChange={handleRestaurantFormChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="cuisine">Cuisine Type</label>
                <input
                  type="text"
                  id="cuisine"
                  name="cuisine"
                  value={restaurantForm.cuisine}
                  onChange={handleRestaurantFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={restaurantForm.imageUrl}
                  onChange={handleRestaurantFormChange}
                />
              </div>

              <h3>Address</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="address.street">Street</label>
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={restaurantForm.address.street}
                    onChange={handleRestaurantFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.city">City</label>
                  <input
                    type="text"
                    id="address.city"
                    name="address.city"
                    value={restaurantForm.address.city}
                    onChange={handleRestaurantFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.state">State</label>
                  <input
                    type="text"
                    id="address.state"
                    name="address.state"
                    value={restaurantForm.address.state}
                    onChange={handleRestaurantFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address.zipCode">Zip Code</label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={restaurantForm.address.zipCode}
                    onChange={handleRestaurantFormChange}
                    required
                  />
                </div>
              </div>

              <h3>Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="contactPhone">Phone</label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={restaurantForm.contactPhone}
                    onChange={handleRestaurantFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactEmail">Email</label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={restaurantForm.contactEmail}
                    onChange={handleRestaurantFormChange}
                    required
                  />
                </div>
              </div>

              <h3>Operating Hours</h3>
              {Object.keys(restaurantForm.operatingHours).map((day) => (
                <div key={day} className="form-grid">
                  <div className="form-group">
                    <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        type="time"
                        value={restaurantForm.operatingHours[day].open}
                        onChange={(e) =>
                          handleOperatingHoursChange(
                            day,
                            "open",
                            e.target.value
                          )
                        }
                        placeholder="Opening Time"
                      />
                      <span style={{ alignSelf: "center" }}>to</span>
                      <input
                        type="time"
                        value={restaurantForm.operatingHours[day].close}
                        onChange={(e) =>
                          handleOperatingHoursChange(
                            day,
                            "close",
                            e.target.value
                          )
                        }
                        placeholder="Closing Time"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRestaurantModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save /> {editMode ? "Update" : "Create"} Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {showMenuItemModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editMode ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <button
                className="close-button"
                onClick={() => setShowMenuItemModal(false)}
              >
                <Close />
              </button>
            </div>

            <form onSubmit={handleMenuItemSubmit}>
              <div className="form-group">
                <label htmlFor="name">Item Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={menuItemForm.name}
                  onChange={handleMenuItemFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={menuItemForm.description}
                  onChange={handleMenuItemFormChange}
                  required
                ></textarea>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="price">Price ($)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={menuItemForm.price}
                    onChange={handleMenuItemFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={menuItemForm.category}
                    onChange={handleMenuItemFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={menuItemForm.imageUrl}
                  onChange={handleMenuItemFormChange}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={menuItemForm.isAvailable}
                    onChange={handleMenuItemFormChange}
                  />
                  Item is available for ordering
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMenuItemModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save /> {editMode ? "Update" : "Add"} Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagement;
