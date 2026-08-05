import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'

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
          <Route path="/descubrir" element={<OceanLanding />} />
          <Route path="/descubrir/:city" element={<OceanLanding />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/rack/lugares" element={<RackPlaces />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
