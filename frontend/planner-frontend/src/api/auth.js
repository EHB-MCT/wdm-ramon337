// API Base URL
// In a production environment, this should be accessed via import.meta.env.VITE_API_BASE_URL
const API_BASE_URL = "http://localhost:8080/api";

/**
 * Registers a new user.
 * @param {Object} userData - Contains email, password, and preferences.
 * @returns {Promise<Object>} - Returns the token and user role.
 */
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
    console.error("Auth API Error (Register):", error.message);
    throw error;
  }
};

/**
 * Logs in an existing user.
 * @param {Object} credentials - Contains email and password.
 * @returns {Promise<Object>} - Returns the JWT token and user UID.
 */
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
    console.error("Auth API Error (Login):", error.message);
    throw error;
  }
};

/**
 * Fetches the current user's profile using the JWT token.
 * @param {string} token - The JWT auth token.
 * @returns {Promise<Object>} - The user profile object.
 */
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
    console.error("Auth API Error (Fetch Profile):", error.message);
    throw error;
  }
};

/**
 * Checks if an email is already registered (used for form validation).
 * @param {string} email - The email to check.
 * @returns {Promise<boolean>} - True if exists, False otherwise.
 */
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
    // Fail silently for UI checks, default to false
    return false; 
  }
};