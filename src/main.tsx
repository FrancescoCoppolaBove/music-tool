import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ConsentBanner from './shared/components/ConsentBanner.tsx'
import { AuthProvider } from './shared/context/AuthContext.tsx'
import { UserProfileProvider } from './shared/context/UserProfileContext.tsx'
import { StatsProvider } from './shared/context/StatsContext.tsx'
import { GlobalKeyProvider } from './shared/context/GlobalKeyContext.tsx'
// Self-hosted fonts: no requests to Google Fonts (GDPR — the user's IP stays with us).
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/syne/700.css'
import '@fontsource/syne/800.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/400-italic.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/playfair-display/400-italic.css'
import './index.css'
import { initMonitoring } from './monitoring'
import ErrorBoundary from './shared/components/ErrorBoundary.tsx'

initMonitoring()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProfileProvider>
        <StatsProvider>
          <GlobalKeyProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </GlobalKeyProvider>
        </StatsProvider>
      </UserProfileProvider>
    </AuthProvider>
    <ConsentBanner />
  </React.StrictMode>,
)
