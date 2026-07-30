import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'

import ScrollManager from './components/ScrollManager'

import Home from './pages/Home'
import About from './pages/About'
import Faith from './pages/Faith'
import ChiesaDetail from './pages/ChiesaDetail'
import Mission from './pages/Mission'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

import ProtectedRoute from './components/ProtectedRoute'

/* L'area riservata viene caricata solo quando serve: il sito pubblico resta leggero. */
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 text-gold-400">
      <p className="text-[11px] font-bold uppercase tracking-widest2">Caricamento area riservata…</p>
    </div>
  )
}

/** Vecchi indirizzi del sito statico → nuove rotte (link esterni e SEO). */
const legacyRedirects = [
  ['/index.html', '/'],
  ['/about-us', '/chi-siamo'],
  ['/about-us.html', '/chi-siamo'],
  ['/fede.html', '/fede'],
  ['/chiesa-latina', '/chiese/latina'],
  ['/chiesa-latina.html', '/chiese/latina'],
  ['/chiesa-terracina', '/chiese/terracina'],
  ['/chiesa-terracina.html', '/chiese/terracina'],
  ['/chiesa-gaeta', '/chiese/gaeta'],
  ['/chiesa-gaeta.html', '/chiese/gaeta'],
  ['/argentina', '/missioni/argentina'],
  ['/argentina.html', '/missioni/argentina'],
  ['/cambogia', '/missioni/cambogia'],
  ['/cambogia.html', '/missioni/cambogia'],
  ['/politica-riservatezza', '/privacy'],
  ['/politica-riservatezza.html', '/privacy'],
]

export default function App() {
  return (
    <Router>
      <ScrollManager />
      <Routes>
        {/* --- Sito pubblico --- */}
        <Route path="/" element={<Home />} />
        <Route path="/chi-siamo" element={<About />} />
        <Route path="/fede" element={<Faith />} />
        <Route path="/chiese/:slug" element={<ChiesaDetail />} />
        <Route path="/missioni/:slug" element={<Mission />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* --- Compatibilità con i vecchi indirizzi --- */}
        {legacyRedirects.map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}

        {/* --- Area riservata (gestionale) --- */}
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<AdminFallback />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* --- Pagina non trovata --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
