const API_BASE_URL = "http://localhost:8080/api";

/**
 * @param {string} eventType - Type of event (bv. 'TASK_MOVED', 'HOVER').
 * @param {object} payload - Specific data (bv. coördinaten, duur).
 * @param {object} meta - Optional metadata (bv. schermgrootte).
 */

export const logEvent = async (eventType, payload = {}, meta = {}) => {
  const token = localStorage.getItem("userToken");
  const uid = localStorage.getItem("userUID");

  if (!token || !uid) {
    console.warn("Logging prevented: User not authenticated.");
    return;
  }

  const body = {
    eventType,
    payload,
    meta: {
      ...meta,
      appVersion: "1.0",
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}/log/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to log event:", eventType, errorData.message);
    }
  } catch (error) {
    console.error("Network error while logging event:", error);
  }
};
