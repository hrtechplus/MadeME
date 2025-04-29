const express = require("express");
const router = express.Router();
const {
  createOrder,
  captureOrder,
} = require("../controllers/paypalController");

router.post("/create-order", createOrder);
router.post("/capture-order", captureOrder);

module.exports = router;
