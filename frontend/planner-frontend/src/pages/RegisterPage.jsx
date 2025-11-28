import React from 'react';
import RegisterForm from '../components/RegisterForm';

function RegisterPage() {
  return (
    <div style={{ marginTop: '50px' }}>
      <h2 style={{ textAlign: 'center' }}>Create a new account</h2>
      <RegisterForm />
    </div>
  );
}

export default RegisterPage;