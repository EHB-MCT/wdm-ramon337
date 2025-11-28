import React from 'react';

function ProfilePage() {
  const uid = localStorage.getItem('userUID');
  const token = localStorage.getItem('userToken');

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>User Profile</h1>
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <p><strong>User ID:</strong> {uid}</p>
        <p><strong>Account Status:</strong> Active</p>
        <div style={{ marginTop: '20px', wordBreak: 'break-all', fontSize: '12px', color: '#888' }}>
          <strong>Session Token:</strong>
          <br />
          {token}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;