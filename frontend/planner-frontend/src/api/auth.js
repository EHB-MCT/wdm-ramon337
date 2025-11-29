// frontend/planner-frontend/src/api/auth.js

const API_BASE_URL = "http://localhost:8080/api";

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Registration failed");
    return data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");
    return data;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export const fetchUserProfile = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch profile");
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

export const checkEmailExists = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    if (!response.ok) return false; 
    
    return data.exists;
  } catch (error) {
    console.error("Email check failed:", error);
    return false; 
  }
};