import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockRestaurants } from "../data/mockRestaurants";
import "../styles/RestaurantMenu.css";

const RestaurantMenu = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        // For now, use mock data
        const foundRestaurant = mockRestaurants.find(
          (r) => r._id === restaurantId
        );
        if (!foundRestaurant) {
          throw new Error("Restaurant not found");
        }
        setRestaurant(foundRestaurant);
        setLoading(false);
      } catch (err) {
        setError("Failed to load restaurant menu. Please try again later.");
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem._id === item._id
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading menu...</div>
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
    <div className="restaurant-menu">
      <div className="menu-header">
        <h2>{restaurant.name}</h2>
        <p className="cuisine">{restaurant.cuisine}</p>
      </div>

      <div className="menu-content">
        <div className="menu-items">
          <h3>Menu Items</h3>
          <div className="items-grid">
            {restaurant.menu.map((item) => (
              <div key={item._id} className="menu-item">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="item-image"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/200x150?text=Food";
                  }}
                />
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="description">{item.description}</p>
                  <p className="price">${item.price.toFixed(2)}</p>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(item)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-sidebar">
          <h3>Your Cart</h3>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p>${item.price.toFixed(2)}</p>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item._id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <h4>Total: ${getTotalPrice().toFixed(2)}</h4>
                <button
                  className="checkout-btn"
                  onClick={() => navigate("/checkout", { state: { cart } })}
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenu;
