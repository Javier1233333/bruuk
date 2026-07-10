import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { VerifyInvitePage } from './pages/VerifyInvitePage'
import { OceanLanding } from './components/OceanLanding'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/descubrir" element={<OceanLanding />} />
          <Route path="/descubrir/:city" element={<OceanLanding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<DashboardPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
