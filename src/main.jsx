import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { RouterProvider } from './context/RouterContext'
import { SettingsProvider } from './context/SettingsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* reducedMotion="user" makes every framer-motion animation in the app
        respect the OS-level prefers-reduced-motion setting automatically,
        without each of the ~20 components using motion.* needing its own
        media-query check. */}
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <RouterProvider>
                  <App />
                </RouterProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>,
)
