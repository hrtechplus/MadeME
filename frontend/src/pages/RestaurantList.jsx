import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import "../styles/RestaurantList.css";

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleApiCall } = useApi();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await handleApiCall(
          fetch("http://localhost:5000/api/restaurants")
        );
        setRestaurants(response.data);
      } catch (err) {
        setError("Failed to fetch restaurants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [handleApiCall]);

  if (loading) return <div className="loading">Loading restaurants...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="restaurant-list">
      <h2>Available Restaurants</h2>
      <div className="restaurants-grid">
        {restaurants.map((restaurant) => (
          <div key={restaurant._id} className="restaurant-card">
            <img
              src={restaurant.imageUrl || "/default-restaurant.jpg"}
              alt={restaurant.name}
              className="restaurant-image"
            />
            <div className="restaurant-info">
              <h3>{restaurant.name}</h3>
              <p className="cuisine">{restaurant.cuisine}</p>
              <p className="address">{restaurant.address}</p>
              <div className="restaurant-rating">
                <span>★</span>
                <span>{restaurant.rating || "N/A"}</span>
              </div>
              <button
                className="view-menu-btn"
                onClick={() =>
                  (window.location.href = `/restaurant/${restaurant._id}`)
                }
              >
                View Menu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;
