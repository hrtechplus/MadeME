const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Sample restaurant data with menus
const sampleRestaurants = [
  {
    name: "Italiano Delight",
    description:
      "Authentic Italian cuisine using traditional recipes and fresh ingredients",
    cuisine: "Italian",
    address: {
      street: "123 Pasta Lane",
      city: "New York",
      state: "NY",
      zipCode: "10001",
    },
    contactPhone: "212-555-1234",
    contactEmail: "info@italianodelight.com",
    rating: 4.7,
    reviewCount: 253,
    operatingHours: {
      monday: { open: "11:00", close: "22:00" },
      tuesday: { open: "11:00", close: "22:00" },
      wednesday: { open: "11:00", close: "22:00" },
      thursday: { open: "11:00", close: "22:00" },
      friday: { open: "11:00", close: "23:00" },
      saturday: { open: "11:00", close: "23:00" },
      sunday: { open: "12:00", close: "21:00" },
    },
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    ownerId: "resto-owner-1",
    menu: [
      {
        name: "Margherita Pizza",
        description:
          "Classic pizza with tomato sauce, fresh mozzarella, and basil",
        price: 14.99,
        category: "Pizza",
        imageUrl:
          "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
        isAvailable: true,
      },
      {
        name: "Pepperoni Pizza",
        description: "Traditional pizza topped with pepperoni slices",
        price: 16.99,
        category: "Pizza",
        imageUrl:
          "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500",
        isAvailable: true,
      },
      {
        name: "Spaghetti Carbonara",
        description:
          "Pasta with creamy egg sauce, pancetta, and parmesan cheese",
        price: 18.99,
        category: "Pasta",
        imageUrl:
          "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500",
        isAvailable: true,
      },
      {
        name: "Lasagna",
        description:
          "Layers of pasta, meat sauce, and cheese, baked to perfection",
        price: 19.99,
        category: "Pasta",
        imageUrl:
          "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500",
        isAvailable: true,
      },
      {
        name: "Tiramisu",
        description:
          "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
        price: 8.99,
        category: "Dessert",
        imageUrl:
          "https://images.unsplash.com/photo-1571877899582-ab394694e686?w=500",
        isAvailable: true,
      },
    ],
    isActive: true,
  },
  {
    name: "Burger Palace",
    description:
      "Gourmet burgers made with premium ingredients and house-made sauces",
    cuisine: "American",
    address: {
      street: "456 Patty Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
    },
    contactPhone: "310-555-7890",
    contactEmail: "hello@burgerpalace.com",
    rating: 4.5,
    reviewCount: 187,
    operatingHours: {
      monday: { open: "11:30", close: "21:00" },
      tuesday: { open: "11:30", close: "21:00" },
      wednesday: { open: "11:30", close: "21:00" },
      thursday: { open: "11:30", close: "21:00" },
      friday: { open: "11:30", close: "22:00" },
      saturday: { open: "11:30", close: "22:00" },
      sunday: { open: "12:00", close: "20:00" },
    },
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    ownerId: "resto-owner-2",
    menu: [
      {
        name: "Classic Burger",
        description:
          "Beef patty with lettuce, tomato, onion, and special sauce",
        price: 12.99,
        category: "Burgers",
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        isAvailable: true,
      },
      {
        name: "Cheeseburger",
        description: "Classic burger topped with American cheese",
        price: 13.99,
        category: "Burgers",
        imageUrl:
          "https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=500",
        isAvailable: true,
      },
      {
        name: "Bacon Burger",
        description: "Burger with crispy bacon strips and cheddar cheese",
        price: 15.99,
        category: "Burgers",
        imageUrl:
          "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?w=500",
        isAvailable: true,
      },
      {
        name: "French Fries",
        description: "Crispy golden fries with sea salt",
        price: 4.99,
        category: "Sides",
        imageUrl:
          "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500",
        isAvailable: true,
      },
      {
        name: "Onion Rings",
        description: "Battered and fried onion rings with dipping sauce",
        price: 5.99,
        category: "Sides",
        imageUrl:
          "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500",
        isAvailable: true,
      },
      {
        name: "Chocolate Milkshake",
        description:
          "Thick and creamy chocolate shake topped with whipped cream",
        price: 6.99,
        category: "Drinks",
        imageUrl:
          "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500",
        isAvailable: true,
      },
    ],
    isActive: true,
  },
  {
    name: "Sushi Master",
    description:
      "Authentic Japanese sushi prepared by master chefs with the freshest ingredients",
    cuisine: "Japanese",
    address: {
      street: "789 Ocean Drive",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
    },
    contactPhone: "415-555-3456",
    contactEmail: "info@sushimaster.com",
    rating: 4.8,
    reviewCount: 320,
    operatingHours: {
      monday: { open: "17:00", close: "22:00" },
      tuesday: { open: "17:00", close: "22:00" },
      wednesday: { open: "17:00", close: "22:00" },
      thursday: { open: "17:00", close: "22:00" },
      friday: { open: "17:00", close: "23:00" },
      saturday: { open: "16:00", close: "23:00" },
      sunday: { open: "16:00", close: "22:00" },
    },
    imageUrl:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
    ownerId: "resto-owner-3",
    menu: [
      {
        name: "California Roll",
        description:
          "Crab, avocado, and cucumber rolled in sushi rice and seaweed",
        price: 8.99,
        category: "Rolls",
        imageUrl:
          "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500",
        isAvailable: true,
      },
      {
        name: "Salmon Nigiri",
        description: "Fresh salmon slices on pressed sushi rice",
        price: 7.99,
        category: "Nigiri",
        imageUrl:
          "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500",
        isAvailable: true,
      },
      {
        name: "Spicy Tuna Roll",
        description: "Spicy tuna mix rolled in sushi rice and seaweed",
        price: 9.99,
        category: "Rolls",
        imageUrl:
          "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500",
        isAvailable: true,
      },
      {
        name: "Dragon Roll",
        description: "Eel and cucumber roll topped with avocado and eel sauce",
        price: 14.99,
        category: "Specialty Rolls",
        imageUrl:
          "https://images.unsplash.com/photo-1617196034738-26c5f7c977ce?w=500",
        isAvailable: true,
      },
      {
        name: "Miso Soup",
        description: "Traditional Japanese soup with tofu and seaweed",
        price: 3.99,
        category: "Sides",
        imageUrl:
          "https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=500",
        isAvailable: true,
      },
      {
        name: "Edamame",
        description: "Steamed soybean pods with sea salt",
        price: 4.99,
        category: "Sides",
        imageUrl:
          "https://images.unsplash.com/photo-1622205313162-be1d5712a43c?w=500",
        isAvailable: true,
      },
    ],
    isActive: true,
  },
  {
    name: "Taco Fiesta",
    description:
      "Authentic Mexican street food with made-from-scratch tortillas and salsas",
    cuisine: "Mexican",
    address: {
      street: "321 Salsa Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
    },
    contactPhone: "512-555-6789",
    contactEmail: "hola@tacofiesta.com",
    rating: 4.6,
    reviewCount: 215,
    operatingHours: {
      monday: { open: "11:00", close: "21:00" },
      tuesday: { open: "11:00", close: "21:00" },
      wednesday: { open: "11:00", close: "21:00" },
      thursday: { open: "11:00", close: "21:00" },
      friday: { open: "11:00", close: "22:00" },
      saturday: { open: "11:00", close: "22:00" },
      sunday: { open: "12:00", close: "20:00" },
    },
    imageUrl:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
    ownerId: "resto-owner-4",
    menu: [
      {
        name: "Street Tacos",
        description:
          "Three corn tortillas with choice of meat, onions, cilantro, and salsa",
        price: 9.99,
        category: "Tacos",
        imageUrl:
          "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500",
        isAvailable: true,
      },
      {
        name: "Quesadilla",
        description: "Flour tortilla filled with cheese and choice of meat",
        price: 11.99,
        category: "Entrees",
        imageUrl:
          "https://images.unsplash.com/photo-1618040996337-56904b7cce13?w=500",
        isAvailable: true,
      },
      {
        name: "Burrito",
        description:
          "Large flour tortilla filled with rice, beans, choice of meat, and toppings",
        price: 12.99,
        category: "Entrees",
        imageUrl:
          "https://images.unsplash.com/photo-1566740933430-9587c87a3048?w=500",
        isAvailable: true,
      },
      {
        name: "Nachos Supreme",
        description:
          "Tortilla chips topped with beans, cheese, meat, guacamole, and sour cream",
        price: 13.99,
        category: "Appetizers",
        imageUrl:
          "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500",
        isAvailable: true,
      },
      {
        name: "Guacamole & Chips",
        description: "Freshly made guacamole with crispy tortilla chips",
        price: 7.99,
        category: "Appetizers",
        imageUrl:
          "https://images.unsplash.com/photo-1600850561965-1c8affd620ce?w=500",
        isAvailable: true,
      },
      {
        name: "Churros",
        description:
          "Fried dough pastry dusted with cinnamon sugar and served with chocolate sauce",
        price: 6.99,
        category: "Desserts",
        imageUrl:
          "https://images.unsplash.com/photo-1624471324074-398064269a3f?w=500",
        isAvailable: true,
      },
    ],
    isActive: true,
  },
  {
    name: "Spice of India",
    description:
      "Traditional Indian cuisine featuring aromatic curries and freshly baked naan",
    cuisine: "Indian",
    address: {
      street: "567 Curry Lane",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
    },
    contactPhone: "312-555-9012",
    contactEmail: "info@spiceofindia.com",
    rating: 4.7,
    reviewCount: 275,
    operatingHours: {
      monday: { open: "16:00", close: "22:00" },
      tuesday: { open: "16:00", close: "22:00" },
      wednesday: { open: "16:00", close: "22:00" },
      thursday: { open: "16:00", close: "22:00" },
      friday: { open: "16:00", close: "23:00" },
      saturday: { open: "12:00", close: "23:00" },
      sunday: { open: "12:00", close: "22:00" },
    },
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
    ownerId: "resto-owner-5",
    menu: [
      {
        name: "Butter Chicken",
        description: "Tender chicken in a rich tomato and butter sauce",
        price: 16.99,
        category: "Main Courses",
        imageUrl:
          "https://images.unsplash.com/photo-1626143508000-4b5904e0f4f2?w=500",
        isAvailable: true,
      },
      {
        name: "Vegetable Curry",
        description: "Mixed vegetables in a flavorful curry sauce",
        price: 14.99,
        category: "Vegetarian",
        imageUrl:
          "https://images.unsplash.com/photo-1631292784640-2b24be784d1d?w=500",
        isAvailable: true,
      },
      {
        name: "Garlic Naan",
        description: "Freshly baked flatbread with garlic and butter",
        price: 3.99,
        category: "Bread",
        imageUrl:
          "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500",
        isAvailable: true,
      },
      {
        name: "Chicken Biryani",
        description:
          "Fragrant basmati rice cooked with spiced chicken and herbs",
        price: 17.99,
        category: "Rice Dishes",
        imageUrl:
          "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=500",
        isAvailable: true,
      },
      {
        name: "Samosas",
        description: "Crispy pastry filled with spiced potatoes and peas",
        price: 6.99,
        category: "Appetizers",
        imageUrl:
          "https://images.unsplash.com/photo-1589352216929-013dcce1ac53?w=500",
        isAvailable: true,
      },
      {
        name: "Mango Lassi",
        description: "Refreshing yogurt drink with mango puree",
        price: 4.99,
        category: "Drinks",
        imageUrl:
          "https://images.unsplash.com/photo-1626202882446-5a365ff5ae0d?w=500",
        isAvailable: true,
      },
    ],
    isActive: true,
  },
];

// Connect to MongoDB
const seedDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mademe-restaurants"
    );
    console.log("Connected to MongoDB for seeding...");

    // Delete existing restaurants
    await Restaurant.deleteMany({});
    console.log("Cleared existing restaurant data");

    // Insert sample restaurants
    await Restaurant.insertMany(sampleRestaurants);
    console.log(`Seeded ${sampleRestaurants.length} restaurants successfully`);

    // Disconnect after seeding
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedDB();
