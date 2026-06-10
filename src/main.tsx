import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './app/AppShell'
import { VerifyInvitePage } from './pages/VerifyInvitePage'
import { OceanLanding } from './components/OceanLanding'
import { RackLanding } from './rack/RackLanding'
import { RackExplore } from './rack/RackExplore'
import { RackProductDetail } from './rack/RackProductDetail'
import { RackDrops } from './rack/RackDrops'
import { RackCart } from './rack/RackCart'
import { RackSuccess } from './rack/RackSuccess'
import { CartProvider } from './rack/cart/CartContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/descubrir" element={<OceanLanding />} />
          <Route path="/rack" element={<RackLanding />} />
          <Route path="/rack/explorar" element={<RackExplore />} />
          <Route path="/rack/pieza/:slug" element={<RackProductDetail />} />
          <Route path="/rack/drops" element={<RackDrops />} />
          <Route path="/rack/carrito" element={<RackCart />} />
          <Route path="/rack/gracias" element={<RackSuccess />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyInvitePage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
