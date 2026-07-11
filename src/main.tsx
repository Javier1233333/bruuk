import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import App from './App.tsx'
import { MarketingLayout } from './components/MarketingLayout'
import './index.css'

const ExploreLandingPage = lazy(() =>
  import('./pages/ExploreLandingPage').then(module => ({ default: module.ExploreLandingPage })),
)
const DiscoverExperience = lazy(() =>
  import('./components/DiscoverExperience').then(module => ({ default: module.DiscoverExperience })),
)
const AppShell = lazy(() =>
  import('./components/AppShell').then(module => ({ default: module.AppShell })),
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(module => ({ default: module.LoginPage })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })),
)
const VerifyInvitePage = lazy(() =>
  import('./pages/VerifyInvitePage').then(module => ({ default: module.VerifyInvitePage })),
)
const ProfileSetupPage = lazy(() =>
  import('./pages/ProfileSetupPage').then(module => ({ default: module.ProfileSetupPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })),
)
const ExperienciasPage = lazy(() => import('./pages/ExperienciasPage'))
const ChatsPage = lazy(() => import('./pages/ChatsPage'))

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
