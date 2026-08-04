import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import { DashboardPage } from './pages/DashboardPage'
import { OceanLanding } from './components/OceanLanding'
import { PrivacyPage } from './pages/PrivacyPage'
import { RackPlaces } from './rack/RackPlaces'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/descubrir" element={<OceanLanding />} />
        <Route path="/descubrir/:city" element={<OceanLanding />} />
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/rack/lugares" element={<RackPlaces />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
