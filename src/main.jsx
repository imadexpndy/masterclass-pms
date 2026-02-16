import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import { seedDatabase } from './db/seed'
import './index.css'

import { LangProvider } from './context/LangContext'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to the user
    // For this app, let's just log it or auto-reload if safe, but usually prompt is better.
    // We'll keep it simple: console log. In a real app, use a Toast/Snackbar.
    console.log('New content available, reload to update.')
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

// Seed DB on first load
seedDatabase().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
)
