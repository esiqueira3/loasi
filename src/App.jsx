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

/* Helper per gestire il caricamento dinamico con auto-reload se la versione sul server è cambiata */
const lazyLoad = (fn) =>
  lazy(() =>
    fn().catch((err) => {
      const reloaded = sessionStorage.getItem('loasi_chunk_reloaded')
      if (!reloaded) {
        sessionStorage.setItem('loasi_chunk_reloaded', '1')
        window.location.reload()
      }
      throw err
    })
  )

/* L'area riservata viene caricata solo quando serve: il sito pubblico resta leggero. */
const AdminLogin = lazyLoad(() => import('./pages/AdminLogin'))
const Dashboard = lazyLoad(() => import('./admin/pages/Dashboard'))
const MenuPagine = lazyLoad(() => import('./admin/pages/MenuPagine'))
const Finanze = lazyLoad(() => import('./admin/pages/Finanze'))
const Categorie = lazyLoad(() => import('./admin/pages/Categorie'))
const Chiese = lazyLoad(() => import('./admin/pages/Chiese'))
const Eventi = lazyLoad(() => import('./admin/pages/Eventi'))
const Dipartimenti = lazyLoad(() => import('./admin/pages/Dipartimenti'))
const Membri = lazyLoad(() => import('./admin/pages/Membri'))
const Utenti = lazyLoad(() => import('./admin/pages/Utenti'))
const Profili = lazyLoad(() => import('./admin/pages/Profili'))
const PaginaDinamica = lazyLoad(() => import('./pages/PaginaDinamica'))

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
  ['/chiese', '/#indirizzi'],
  ['/politica-riservatezza', '/privacy'],
  ['/politica-riservatezza.html', '/privacy'],
]

/* Rotte protette del gestionale. */
const adminRoutes = [
  ['/admin/dashboard', <Dashboard key="dash" />],
  ['/admin/menu', <MenuPagine key="menu" />],
  ['/admin/chiese', <Chiese key="chiese" />],
  ['/admin/eventi', <Eventi key="eventi" />],
  ['/admin/dipartimenti', <Dipartimenti key="dip" />],
  ['/admin/membri', <Membri key="membri" />],
  ['/admin/finanze', <Finanze key="fin" />],
  ['/admin/finanze/categorie', <Categorie key="cat" />],
  ['/admin/utenti', <Utenti key="utenti" />],
  ['/admin/utenti/profili', <Profili key="profili" />],
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
        <Route
          path="/pagine/:slug"
          element={
            <Suspense fallback={<AdminFallback />}>
              <PaginaDinamica />
            </Suspense>
          }
        />

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
