import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import { LegacyRackRedirect } from './components/LegacyRedirects'

const App = lazy(() => import('./App.tsx'))
const OceanLanding = lazy(() => import('./components/OceanLanding'))
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const RackPlaces = lazy(() =>
  import('./rack/RackPlaces').then((module) => ({
    default: module.RackPlaces,
  })),
)
const CityHomePage = lazy(() => import('./pages/CityHomePage'))

const routeFallback = (
  <div className="route-loading" role="status" aria-live="polite">
    <span>CARGANDO BRUUK…</span>
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={routeFallback}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/descubrir" element={<Navigate to="/guadalajara/spots" replace />} />
          <Route path="/descubrir/:city" element={<Navigate to="/guadalajara/spots" replace />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/rack/lugares" element={<LegacyRackRedirect />} />
          <Route path="/planes" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/planes/:slug" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/para-lugares" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/admin/eventos" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/:city/spots" element={<OceanLanding />} />
          <Route path="/:city/rack" element={<RackPlaces />} />
          <Route path="/:city/planes" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/:city/planes/:slug" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/:city" element={<CityHomePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
