import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastContainer } from "react-toastify";
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
    <ToastContainer position='bottom-right' autoClose={3000} />
  </React.StrictMode>
);