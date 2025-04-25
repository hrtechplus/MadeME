const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const restaurantController = require("../controllers/restaurantController");
const menuController = require("../controllers/menuController");
const { auth, restaurantOwnerAuth, adminAuth } = require("../middleware/auth");

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "restaurant-service",
  });
});

// Public routes
// -------------

// Get all restaurants (public)
router.get("/", restaurantController.getAllRestaurants);

// Get restaurant by ID (public)
router.get("/:id", restaurantController.getRestaurantById);

// Get menu items for a restaurant (public)
router.get("/:restaurantId/menu", menuController.getMenuItems);

// Get menu item by ID (public)
router.get("/:restaurantId/menu/:menuItemId", menuController.getMenuItemById);

// Protected routes (require authentication)
// ----------------------------------------

// Apply authentication middleware to all routes below
router.use(auth);

// Get restaurants owned by the user
router.get("/owner/me", restaurantController.getRestaurantsByOwner);

// Get restaurants by owner ID (admin only)
router.get(
  "/owner/:ownerId",
  adminAuth,
  restaurantController.getRestaurantsByOwner
);

// Create restaurant (restaurant owners and admins only)
router.post(
  "/",
  restaurantOwnerAuth,
  [
    body("name").notEmpty().withMessage("Restaurant name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("cuisine").notEmpty().withMessage("Cuisine type is required"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.state").notEmpty().withMessage("State is required"),
    body("address.zipCode").notEmpty().withMessage("Zip code is required"),
    body("contactPhone").notEmpty().withMessage("Contact phone is required"),
    body("contactEmail").isEmail().withMessage("Valid email is required"),
  ],
  restaurantController.createRestaurant
);

// Update restaurant (restaurant owner and admins only)
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .notEmpty()
      .withMessage("Restaurant name cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("cuisine")
      .optional()
      .notEmpty()
      .withMessage("Cuisine type cannot be empty"),
    body("contactPhone")
      .optional()
      .notEmpty()
      .withMessage("Contact phone cannot be empty"),
    body("contactEmail")
      .optional()
      .isEmail()
      .withMessage("Valid email is required"),
  ],
  restaurantController.updateRestaurant
);

// Delete restaurant (restaurant owner and admins only)
router.delete("/:id", restaurantController.deleteRestaurant);

// Menu item routes (all require authentication)
// -------------------------------------------

// Add menu item
router.post(
  "/:restaurantId/menu",
  [
    body("name").notEmpty().withMessage("Item name is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  menuController.addMenuItem
);

// Update menu item
router.put(
  "/:restaurantId/menu/:menuItemId",
  [
    body("name").optional().notEmpty().withMessage("Item name cannot be empty"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("category")
      .optional()
      .notEmpty()
      .withMessage("Category cannot be empty"),
  ],
  menuController.updateMenuItem
);

// Delete menu item
router.delete("/:restaurantId/menu/:menuItemId", menuController.deleteMenuItem);

module.exports = router;
