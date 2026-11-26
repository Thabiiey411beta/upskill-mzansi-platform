import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { applySiteUrl } from './lib/seo'
import './index.css'

// Canonical URL + og:url from VITE_SITE_URL (no-op until the real
// Vercel URL is set — see src/lib/seo.ts).
applySiteUrl()

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BlinkUIProvider theme="linear" darkMode="system">
        <AuthProvider>
          <Toaster />
          <div className="flex w-full flex-1 flex-col min-h-0">
            <App />
          </div>
        </AuthProvider>
      </BlinkUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
