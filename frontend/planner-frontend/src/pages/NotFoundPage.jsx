import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '10px', color: '#dc3545' }}>404</h1>
      <p style={{ fontSize: '1.5rem' }}>Page not found.</p>
      <Link to="/" style={{ color: '#007bff', textDecoration: 'underline' }}>Go back home</Link>
    </div>
  );
}

export default NotFoundPage;