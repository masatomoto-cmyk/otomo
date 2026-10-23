import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { inject } from '@vercel/analytics'
import { AuthProvider } from './lib/auth'
import './index.css'

// Vercel Web Analytics（ページビューの計測。Cookie を使わない）
inject()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
