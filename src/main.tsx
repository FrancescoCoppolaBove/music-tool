import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './shared/context/AuthContext.tsx'
import { UserProfileProvider } from './shared/context/UserProfileContext.tsx'
import { StatsProvider } from './shared/context/StatsContext.tsx'
import { GlobalKeyProvider } from './shared/context/GlobalKeyContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProfileProvider>
        <StatsProvider>
          <GlobalKeyProvider>
            <App />
          </GlobalKeyProvider>
        </StatsProvider>
      </UserProfileProvider>
    </AuthProvider>
  </React.StrictMode>,
)
