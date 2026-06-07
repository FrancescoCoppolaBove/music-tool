import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './shared/context/AuthContext.tsx'
import { StatsProvider } from './shared/context/StatsContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <StatsProvider>
        <App />
      </StatsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
