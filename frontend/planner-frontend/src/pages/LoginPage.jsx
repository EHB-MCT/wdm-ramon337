import React from 'react';
import LoginForm from '../components/LoginForm';

/**
 * LoginPage
 * Wrapper page for the LoginForm component.
 */
function LoginPage() {
  return (
    <div style={{ marginTop: '50px' }}>
      <h2 style={{ textAlign: 'center' }}>Login to your account</h2>
      <LoginForm />
    </div>
  );
}

export default LoginPage;