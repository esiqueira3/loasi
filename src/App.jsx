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
const Dashboard = lazy(() => import('./admin/pages/Dashboard'))
const Finanze = lazy(() => import('./admin/pages/Finanze'))
const Categorie = lazy(() => import('./admin/pages/Categorie'))
const InPreparazione = lazy(() => import('./admin/pages/InPreparazione'))

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

/* Rotte protette del gestionale. Le sezioni non ancora sviluppate mostrano un
   segnaposto invece di rompere la navigazione. */
const adminRoutes = [
  ['/admin/dashboard', <Dashboard key="dash" />],
  ['/admin/finanze', <Finanze key="fin" />],
  ['/admin/finanze/categorie', <Categorie key="cat" />],
  [
    '/admin/chiese',
    <InPreparazione
      key="chiese"
      titolo="Chiese"
      icona="church"
      accent="#0891B2"
      descrizione="Anagrafica delle comunità: indirizzi, contatti, orari dei culti e galleria."
    />,
  ],
  [
    '/admin/dipartimenti',
    <InPreparazione
      key="dip"
      titolo="Dipartimenti"
      icona="diversity_3"
      accent="#7C3AED"
      descrizione="Gruppi e ministeri della chiesa, con i rispettivi responsabili."
    />,
  ],
  [
    '/admin/membri',
    <InPreparazione
      key="membri"
      titolo="Membri"
      icona="badge"
      accent="#2563EB"
      descrizione="Anagrafica dei membri, dati di contatto e appartenenza ai dipartimenti."
    />,
  ],
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
        {adminRoutes.map(([path, element]) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <Suspense fallback={<AdminFallback />}>{element}</Suspense>
              </ProtectedRoute>
            }
          />
        ))}

        {/* --- Pagina non trovata --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}
