import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { FeedFiltersProvider } from './FeedFiltersContext.jsx'
import { ProfileSettingsProvider } from './ProfileSettingsContext.jsx'
import { SessionProvider } from './SessionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <ProfileSettingsProvider>
          <FeedFiltersProvider>
            <App />
          </FeedFiltersProvider>
        </ProfileSettingsProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
