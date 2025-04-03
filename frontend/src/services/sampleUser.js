// Sample user credentials for testing
export const sampleUser = {
  email: "test@example.com",
  password: "password123",
  userId: "user123",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiaWF0IjoxNzEyMzQ1Njc5fQ.2QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8QJ8n8", // This is a sample JWT token
};

// Function to simulate login
export const loginWithSampleUser = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Store the sample user's token and ID
  localStorage.setItem("token", sampleUser.token);
  localStorage.setItem("userId", sampleUser.userId);

  return {
    token: sampleUser.token,
    userId: sampleUser.userId,
  };
};
