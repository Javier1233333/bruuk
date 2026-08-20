import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import { LegacyRackRedirect } from './components/LegacyRedirects'
import { RouteSeo } from './components/RouteSeo'
import { ScrollToTop } from './components/ScrollToTop'
import { RecommendationLoadingScreen, RecommendationTransitionProvider } from './components/RecommendationTransition'

const App = lazy(() => import('./App.tsx'))
const OceanLanding = lazy(() => import('./components/OceanLanding'))
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  })),
)
const RackPlaces = lazy(() =>
  import('./rack/RackPlaces').then((module) => ({
    default: module.RackPlaces,
  })),
)
const CityHomePage = lazy(() => import('./pages/CityHomePage'))
const BruukoPage = lazy(() =>
  import('./pages/BruukoPage').then((module) => ({ default: module.BruukoPage })),
)
const MuseumRoutePage = lazy(() =>
  import('./pages/MuseumRoutePage').then((module) => ({ default: module.MuseumRoutePage })),
)
const RadarPage = lazy(() =>
  import('./pages/RadarPage').then((module) => ({ default: module.RadarPage })),
)
const RadarCabanasPage = lazy(() =>
  import('./pages/RadarCabanasPage').then((module) => ({ default: module.RadarCabanasPage })),
)
const RadarMazRoutePage = lazy(() =>
  import('./pages/RadarMazRoutePage').then((module) => ({ default: module.RadarMazRoutePage })),
)

const isMuseumMicrosite = window.location.hostname.toLowerCase() === 'museos.bruuk.space'

const routeFallback = (
  <RecommendationLoadingScreen />
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <RecommendationTransitionProvider>
        <RouteSeo />
        <ScrollToTop />
        <Suspense fallback={routeFallback}>
          <Routes>
          <Route path="/" element={isMuseumMicrosite ? <MuseumRoutePage /> : <App />} />
          <Route path="/descubrir" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/descubrir/:city" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/lleva-bruuk" element={<BruukoPage />} />
          <Route path="/radar" element={<Navigate to="/guadalajara/senales" replace />} />
          <Route path="/radar/museo-cabanas-cafe-redescubrimiento" element={<RadarCabanasPage />} />
          <Route path="/radar/maz-desayuno-cafe-zapopan" element={<RadarMazRoutePage />} />
          <Route path="/guadalajara/ruta-museos" element={<MuseumRoutePage />} />
          <Route path="/rack/lugares" element={<LegacyRackRedirect />} />
          <Route path="/planes" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/planes/:slug" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/para-lugares" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/admin/eventos" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/:city/spots" element={<OceanLanding />} />
          <Route path="/:city/rack" element={<RackPlaces />} />
          <Route path="/:city/planes" element={<Navigate to="/guadalajara/senales" replace />} />
          <Route path="/:city/senales" element={<RadarPage />} />
          <Route path="/:city/planes/:slug" element={<Navigate to="/guadalajara" replace />} />
          <Route path="/:city" element={<CityHomePage />} />
          </Routes>
        </Suspense>
      </RecommendationTransitionProvider>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
