import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import "./styles/index.css";

// 🔥 IMPORT THIS
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🔥 WRAP APP */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)