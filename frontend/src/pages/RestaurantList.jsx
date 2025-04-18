import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import "../styles/RestaurantList.css";

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const { loading, error, handleApiCall, serviceUrls } = useApi();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data } = await handleApiCall(
          `${serviceUrls.restaurant}/api/restaurants`
        );
        setRestaurants(data || []);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        // Error is already handled by the ApiContext
      }
    };

    fetchRestaurants();
  }, [handleApiCall, serviceUrls.restaurant]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading restaurants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="restaurant-list">
      <h2>Available Restaurants</h2>
      {restaurants.length === 0 ? (
        <div className="no-restaurants">
          <p>No restaurants available at the moment.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map((restaurant) => (
            <div key={restaurant._id} className="restaurant-card">
              <img
                src={restaurant.imageUrl || "/default-restaurant.jpg"}
                alt={restaurant.name}
                className="restaurant-image"
                onError={(e) => {
                  e.target.src = "/default-restaurant.jpg";
                }}
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
      )}
    </div>
  );
};

export default RestaurantList;
