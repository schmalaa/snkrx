import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Analytics } from '@vercel/analytics/react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in .env.local")
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#00d2ff',
          colorBackground: '#1a1d24',
          colorInputBackground: '#0d0f12',
          colorText: '#f0f0f0',
          colorTextSecondary: '#8a92a3',
          fontFamily: "'Outfit', sans-serif",
          borderRadius: '12px'
        },
        elements: {
          card: {
            boxShadow: '0 0 40px rgba(0, 210, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }
        }
      }}
    >
      <App />
      <Analytics />
    </ClerkProvider>
  </StrictMode>,
)
