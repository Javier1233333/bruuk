import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { VerifyInvitePage } from './pages/VerifyInvitePage'
import { OceanLanding } from './components/OceanLanding'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { ProfilePage } from './pages/ProfilePage'
import { AppShell } from './components/AppShell'
import ExperienciasPage from './pages/ExperienciasPage'
import ChatsPage from './pages/ChatsPage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <ProfileSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* Mobile App Shell Routes */}
          <Route path="/descubrir" element={<AppShell><OceanLanding /></AppShell>} />
          <Route path="/descubrir/:city" element={<AppShell><OceanLanding /></AppShell>} />
          <Route path="/experiencias" element={<AppShell><ExperienciasPage /></AppShell>} />
          <Route path="/experiencias/:city" element={<AppShell><ExperienciasPage /></AppShell>} />
          <Route path="/chats" element={<AppShell><ChatsPage /></AppShell>} />
          <Route path="/perfil" element={<AppShell><ProfilePage /></AppShell>} />
          <Route path="/profile/:username" element={<AppShell><ProfilePage /></AppShell>} />
          <Route path="/verify" element={<AppShell><VerifyInvitePage /></AppShell>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
