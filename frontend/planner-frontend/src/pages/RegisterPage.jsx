import React from 'react';
import Onboarding from '../components/Onboarding';

/**
 * RegisterPage
 * Wrapper for the Onboarding component (Create Account Wizard).
 */
function RegisterPage() {
  return (
    <div style={{ marginTop: '50px' }}>
      <h2 style={{ textAlign: 'center' }}>Create a new account</h2>
      <Onboarding />
    </div>
  );
}

export default RegisterPage;