import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MarketingLayout } from './components/MarketingLayout'
import App from './App.tsx'
import './index.css'


const AppShell = lazy(() =>
  import('./components/AppShell').then(module => ({ default: module.AppShell })),
)
const OceanLanding = lazy(() =>
  import('./components/OceanLanding').then(module => ({ default: module.OceanLanding })),
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
const NosotrosPage = lazy(() =>
  import('./pages/NosotrosPage').then(module => ({ default: module.NosotrosPage })),
)
const ExperienciasPage = lazy(() => import('./pages/ExperienciasPage'))
const ChatsPage = lazy(() => import('./pages/ChatsPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="loading-fallback" style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
          <Routes>
            {/* Marketing Layout Routes (Header & Footer) */}
            <Route element={<MarketingLayout />}>
              <Route path="/" element={<App />} />
              <Route path="/nosotros" element={<NosotrosPage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            
            {/* Public Mobile App Shell Routes */}
            <Route path="/descubrir" element={<AppShell><OceanLanding /></AppShell>} />
            <Route path="/descubrir/:city" element={<AppShell><OceanLanding /></AppShell>} />
            <Route path="/experiencias" element={<AppShell><ExperienciasPage /></AppShell>} />
            <Route path="/experiencias/:city" element={<AppShell><ExperienciasPage /></AppShell>} />
            <Route path="/profile/:username" element={<AppShell><ProfilePage /></AppShell>} />

            {/* Rutas Protegidas de la Aplicación */}
            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<ProfileSetupPage />} />
              <Route path="/app" element={<AppShell><DashboardPage /></AppShell>} />
              <Route path="/chats" element={<AppShell><ChatsPage /></AppShell>} />
              <Route path="/perfil" element={<AppShell><ProfilePage /></AppShell>} />
              <Route path="/verify" element={<AppShell><VerifyInvitePage /></AppShell>} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
