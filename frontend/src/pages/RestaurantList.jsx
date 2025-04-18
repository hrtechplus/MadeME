import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockRestaurants } from "../data/mockRestaurants";
import "../styles/RestaurantList.css";

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // For now, use mock data
        setRestaurants(mockRestaurants);
        setLoading(false);
      } catch (err) {
        setError("Failed to load restaurants. Please try again later.");
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

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
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="restaurant-image"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x200?text=Restaurant";
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
                  onClick={() => navigate(`/restaurant/${restaurant._id}`)}
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
