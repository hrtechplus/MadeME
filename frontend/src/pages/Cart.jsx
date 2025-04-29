import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ApiContext } from "../context/ApiContext";
import { ToastContext } from "../context/ToastContext";
import "../styles/Cart.css";

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart } =
    useContext(CartContext);
  const { api } = useContext(ApiContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedOrder, setModifiedOrder] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    // Check URL for order modification mode
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("modify");

    if (orderId) {
      setIsModifying(true);
      // Fetch the order to be modified
      loadOrderForModification(orderId);
    }
  }, []);

  const loadOrderForModification = async (orderId) => {
    try {
      const response = await api.get(`/api/order/${orderId}`);
      setModifiedOrder(response.data);

      // Pre-fill the cart with order items
      clearCart();
      response.data.items.forEach((item) => {
        updateCartItem({
          ...item,
          quantity: item.quantity,
        });
      });

      // Set special instructions if any
      if (response.data.specialInstructions) {
        setSpecialInstructions(response.data.specialInstructions);
      }

      // Set delivery address
      if (response.data.deliveryAddress) {
        setDeliveryAddress(response.data.deliveryAddress);
      }

      showToast("Order loaded for modification", "info");
    } catch (error) {
      console.error("Error loading order for modification:", error);
      showToast("Could not load order for modification", "error");
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity >= 1) {
      updateCartItem({
        ...item,
        quantity: newQuantity,
      });
    }
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item);
  };

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      showToast("Your cart is empty", "warning");
      return;
    }

    if (isModifying && modifiedOrder) {
      handleModifyOrder();
    } else {
      navigate("/checkout", {
        state: {
          cartItems: cart,
          total: calculateTotal(),
          specialInstructions,
          deliveryAddress,
        },
      });
    }
  };

  const handleModifyOrder = async () => {
    try {
      const orderData = {
        items: cart.map((item) => ({
          itemId: item.itemId || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        specialInstructions,
        deliveryAddress,
      };

      const response = await api.patch(
        `/api/order/${modifiedOrder._id}/modify`,
        orderData
      );

      if (response.data.success) {
        showToast("Order modified successfully", "success");
        // Clear the cart and redirect to order tracking
        clearCart();
        navigate(`/order-tracking/${modifiedOrder._id}`);
      }
    } catch (error) {
      console.error("Error modifying order:", error);
      showToast(
        "Failed to modify order. " +
          (error.response?.data?.message || "Please try again."),
        "error"
      );
    }
  };

  return (
    <div className="cart-container">
      <h1>{isModifying ? "Modify Order" : "Your Cart"}</h1>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button onClick={() => navigate("/restaurants")}>
            Browse Restaurants
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item, index) => (
              <div className="cart-item" key={index}>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="item-quantity">
                  <button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
                <div className="item-total">
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="special-instructions">
            <h3>Special Instructions</h3>
            <textarea
              rows="3"
              placeholder="Add any special instructions or requests..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            ></textarea>
          </div>

          <div className="delivery-address">
            <h3>Delivery Address</h3>
            <div className="address-form">
              <div className="form-group">
                <label>Street</label>
                <input
                  type="text"
                  name="street"
                  value={deliveryAddress.street}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryAddress.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={deliveryAddress.state}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={deliveryAddress.zipCode}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <h3>Order Total</h3>
              <p>${calculateTotal()}</p>
            </div>

            <div className="cart-actions">
              <button onClick={() => navigate(-1)}>Continue Shopping</button>
              <button
                className="checkout-btn"
                onClick={handleProceedToCheckout}
                disabled={cart.length === 0}
              >
                {isModifying ? "Save Changes" : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
