import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { FeedFiltersProvider } from './tools/context/FeedFiltersContext.jsx'
import { ProfileSettingsProvider } from './tools/context/ProfileSettingsContext.jsx'
import { SessionProvider } from './tools/cache/SessionContext.jsx'

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
