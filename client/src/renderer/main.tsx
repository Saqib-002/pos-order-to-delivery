import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastContainer } from "react-toastify";
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmProvider } from './contexts/confirmContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </AuthProvider>
    <ToastContainer position='bottom-right' autoClose={3000} />
  </React.StrictMode>
);