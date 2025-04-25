// Sample user credentials for testing
export const sampleUser = {
  email: "test@example.com",
  password: "password123",
  userId: "user123",
  role: "user",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiaWF0IjoxNzEyMzQ1Njc5fQ.2QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8", // This is a sample JWT token
};

// Admin user credentials
export const adminUser = {
  email: "admin@mademe.com",
  password: "admin123",
  userId: "admin456",
  role: "admin",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbjQ1NiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcxMjM0NTY3OX0.adminJWTsignatureXYZ123", // Sample admin JWT token
};

// Function to simulate login
export const loginWithSampleUser = async (email, password) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let user;

  // Check if login is for admin or regular user
  if (email === adminUser.email && password === adminUser.password) {
    user = adminUser;
  } else if (email === sampleUser.email && password === sampleUser.password) {
    user = sampleUser;
  } else {
    throw new Error("Invalid credentials");
  }

  // Store the user's token, ID and role
  localStorage.setItem("token", user.token);
  localStorage.setItem("userId", user.userId);
  localStorage.setItem("userRole", user.role);

  return {
    token: user.token,
    userId: user.userId,
    role: user.role,
  };
};

// Function to make the current user an admin for testing
export const makeUserAdmin = () => {
  localStorage.setItem("userRole", "admin");
  console.log(
    "User role set to admin. You can now access the admin dashboard."
  );
  return true;
};

// Function to remove admin privileges for testing
export const removeAdminRole = () => {
  localStorage.setItem("userRole", "user");
  console.log("Admin privileges removed.");
  return true;
};
