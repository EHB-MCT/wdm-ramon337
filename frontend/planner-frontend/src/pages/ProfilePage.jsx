// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { fetchUserProfile } from "../api/auth";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("userToken");
      try {
        const data = await fetchUserProfile(token);
        setUser(data);
      } catch (err) {
        console.error("Kon profiel niet laden", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Geen data gevonden. Ben je ingelogd?</p>;

  return (
    <div style={{ padding: '0px 20px' }}>
      <h1>Welkom, {user.email}</h1>
      <p>Je doel is om {user.initialPreferences.workHours} uur te werken per week.</p>
    </div>
  );
}

export default ProfilePage;
