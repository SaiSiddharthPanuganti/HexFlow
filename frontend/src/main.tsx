import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'
import './monitoring'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<main className="auth-screen"><div className="auth-card"><h1>HexFlow</h1><p>Something went wrong. Reload the page to try again.</p></div></main>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
