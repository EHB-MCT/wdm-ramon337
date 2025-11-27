const API_BASE_URL = "http://localhost:8080/api";

/**
 * Registers a new user en sends the initial preferences.
 * @param {object} userData - email, password, en initial preferences.
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }
    return data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};
