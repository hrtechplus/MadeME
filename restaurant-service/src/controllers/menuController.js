const Restaurant = require("../models/Restaurant");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

// Add menu item to restaurant
exports.addMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Verify user is owner or admin
    if (req.userRole !== "admin" && restaurant.ownerId !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this restaurant's menu" });
    }

    // Add the new menu item
    restaurant.menu.push(req.body);
    await restaurant.save();

    // Return the newly added menu item
    const newMenuItem = restaurant.menu[restaurant.menu.length - 1];
    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({
      message: "Error adding menu item",
      error: error.message,
    });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { restaurantId, menuItemId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Verify user is owner or admin
    if (req.userRole !== "admin" && restaurant.ownerId !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this restaurant's menu" });
    }

    // Find the menu item
    const menuItemIndex = restaurant.menu.findIndex(
      (item) => item._id.toString() === menuItemId
    );

    if (menuItemIndex === -1) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Update the menu item fields
    Object.keys(req.body).forEach((key) => {
      restaurant.menu[menuItemIndex][key] = req.body[key];
    });

    await restaurant.save();

    res.json(restaurant.menu[menuItemIndex]);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({
      message: "Error updating menu item",
      error: error.message,
    });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Verify user is owner or admin
    if (req.userRole !== "admin" && restaurant.ownerId !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this restaurant's menu" });
    }

    // Find the menu item
    const menuItemIndex = restaurant.menu.findIndex(
      (item) => item._id.toString() === menuItemId
    );

    if (menuItemIndex === -1) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Remove the menu item using the findByIdAndUpdate with $pull
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $pull: { menu: { _id: menuItemId } },
    });

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({
      message: "Error deleting menu item",
      error: error.message,
    });
  }
};

// Get all menu items for a restaurant
exports.getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category } = req.query;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    let menuItems = restaurant.menu;

    // Filter by category if provided
    if (category) {
      menuItems = menuItems.filter((item) => item.category === category);
    }

    res.json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({
      message: "Error fetching menu items",
      error: error.message,
    });
  }
};

// Get menu item by ID
exports.getMenuItemById = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItem = restaurant.menu.find(
      (item) => item._id.toString() === menuItemId
    );

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({
      message: "Error fetching menu item",
      error: error.message,
    });
  }
};
