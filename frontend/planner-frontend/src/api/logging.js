const API_BASE_URL = "http://localhost:8080/api";

/**
 * Logs user interactions to the backend surveillance system.
 * This feeds the "Shadow Profile" of the user.
 * * @param {string} eventType - Type of event (e.g., 'TASK_MOVED', 'PAGE_VIEW').
 * @param {object} data - Specific event data (e.g., coordinates, duration).
 * @param {object} meta - Optional metadata (e.g., screen size).
 */
export const logEvent = async (eventType, data = {}, meta = {}) => {
  const token = localStorage.getItem("userToken");
  const uid = localStorage.getItem("userUID");

  // Fail silently if not authenticated (don't break the UI for logging)
  if (!token || !uid) {
    return;
  }

  // Construct the body to match backend/models/Event.js
  // We merge 'data' and 'meta' into 'eventData' so everything gets saved.
  const body = {
    eventType,
    eventData: {
      ...data,
      ...meta,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent, // 🕵️‍♂️ Extra surveillance data
    },
  };

  try {
    // Use 'keepalive: true' to ensure the request completes even if the user closes the tab
    const response = await fetch(`${API_BASE_URL}/log/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      keepalive: true, 
    });

    if (!response.ok) {
      // Only log errors in development to keep console clean for the user
      if (process.env.NODE_ENV === 'development') {
        const errorData = await response.json();
        console.error("Failed to log event:", eventType, errorData.message);
      }
    }
  } catch (error) {
    // Silent fail on network error to prevent blocking the main thread
    if (process.env.NODE_ENV === 'development') {
      console.error("Network error while logging event:", error);
    }
  }
};