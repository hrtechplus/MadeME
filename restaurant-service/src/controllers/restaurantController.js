const Restaurant = require("../models/Restaurant");
const { validationResult } = require("express-validator");

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const { cuisine, name, sort = "-createdAt" } = req.query;

    // Build query
    const query = { isActive: true };
    if (cuisine) query.cuisine = cuisine;
    if (name) query.name = { $regex: name, $options: "i" }; // Case-insensitive search

    const restaurants = await Restaurant.find(query)
      .select("-menu") // Exclude menu items for performance
      .sort(sort);

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({
      message: "Error fetching restaurants",
      error: error.message,
    });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (!restaurant.isActive) {
      return res
        .status(404)
        .json({ message: "Restaurant is currently unavailable" });
    }

    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({
      message: "Error fetching restaurant",
      error: error.message,
    });
  }
};

// Create restaurant
exports.createRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Use the userId from the token as the owner
    const ownerId = req.userId;

    const restaurant = new Restaurant({
      ...req.body,
      ownerId,
      menu: [], // Start with empty menu
    });

    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({
      message: "Error creating restaurant",
      error: error.message,
    });
  }
};

// Update restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Make sure user is the owner or admin
    if (req.userRole !== "admin" && restaurant.ownerId !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this restaurant" });
    }

    // Prevent updating menu through this endpoint
    const updates = { ...req.body };
    delete updates.menu;
    delete updates.ownerId; // Don't allow owner transfer

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.json(updatedRestaurant);
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({
      message: "Error updating restaurant",
      error: error.message,
    });
  }
};

// Delete restaurant (soft delete)
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Make sure user is the owner or admin
    if (req.userRole !== "admin" && restaurant.ownerId !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this restaurant" });
    }

    // Soft delete
    restaurant.isActive = false;
    await restaurant.save();

    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    res.status(500).json({
      message: "Error deleting restaurant",
      error: error.message,
    });
  }
};

// Get restaurants by owner
exports.getRestaurantsByOwner = async (req, res) => {
  try {
    const ownerId = req.params.ownerId || req.userId;

    // Verify authorization
    if (req.userRole !== "admin" && ownerId !== req.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these restaurants" });
    }

    const restaurants = await Restaurant.find({ ownerId });
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching owner restaurants:", error);
    res.status(500).json({
      message: "Error fetching owner restaurants",
      error: error.message,
    });
  }
};
