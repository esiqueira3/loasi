/**
 * Costanti condivise dal gestionale: colori dei moduli, voci di menu e
 * formattazione italiana (date, valuta). Tutto ciò che è "trasversale"
 * alle schermate vive qui, così le pagine restano leggibili.
 */

/* ---------------------------------------------------------------- */
/* Colori d'accento per modulo                                       */
/* ---------------------------------------------------------------- */

export const ACCENT = {
  dashboard: '#A67C3D', // oro del marchio
  chiese: '#0891B2',
  dipartimenti: '#7C3AED',
  membri: '#2563EB',
  finanze: '#107C42', // verde del modulo finanziario
}

export const PALETTE_CATEGORIE = [
  '#107C42', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4',
  '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#64748B', '#84CC16',
]

/** Colori usati per distinguere le categorie nei grafici di spesa. */
export const COLORI_GRAFICO = [
  '#EF4444', '#4C5FD5', '#DB2777', '#EA580C', '#7C3AED', '#0D9488',
  '#0891B2', '#D97706', '#8B5CF6', '#059669', '#E11D48', '#2563EB',
]

/* ---------------------------------------------------------------- */
/* Menu laterale                                                     */
/* ---------------------------------------------------------------- */

export const MENU = [
  { key: 'dashboard', label: 'Home', icon: 'space_dashboard', to: '/admin/dashboard', accent: ACCENT.dashboard },
  { key: 'chiese', label: 'Chiese', icon: 'church', to: '/admin/chiese', accent: ACCENT.chiese },
  { key: 'dipartimenti', label: 'Dipartimenti', icon: 'diversity_3', to: '/admin/dipartimenti', accent: ACCENT.dipartimenti },
  { key: 'membri', label: 'Membri', icon: 'badge', to: '/admin/membri', accent: ACCENT.membri },
  {
    key: 'finanze',
    label: 'Finanze',
    icon: 'payments',
    accent: ACCENT.finanze,
    children: [
      { key: 'finanze-home', label: 'Panoramica', icon: 'account_balance_wallet', to: '/admin/finanze' },
      { key: 'categorie', label: 'Categorie', icon: 'category', to: '/admin/finanze/categorie' },
    ],
  },
]

/* ---------------------------------------------------------------- */
/* Formattazione italiana                                            */
/* ---------------------------------------------------------------- */

export const OGGI = (() => {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d
})()

/** Converte una data ISO (`2026-03-04`) in Date a mezzogiorno, senza sorprese di fuso. */
export const toDate = (iso) => (iso ? new Date(`${String(iso).slice(0, 10)}T12:00:00`) : null)

export const toISO = (d) => {
  if (!d) return null
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const addMonths = (d, n) => {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export const fmtMoney = (v) => (v == null ? '—' : eur.format(Number(v)))

export const fmtData = (iso) => {
  const d = toDate(iso)
  return d ? d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
}

export const fmtDataLunga = (iso) => {
  const d = toDate(iso)
  return d ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
}

export const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

export const monthKey = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '')

export const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
    .replace('.', '')
}

/** Abbrevia i valori sugli assi dei grafici: 12500 → 13k */
export const fmtAsse = (v) => {
  const a = Math.abs(v)
  if (a >= 1000000) return `${(v / 1000000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}M`
  if (a >= 1000) return `${Math.round(v / 1000)}k`
  return `${Math.round(v)}`
}

/** Arrotonda il massimo dell'asse a un valore "tondo" leggibile. */
export const niceCeil = (v) => {
  if (v <= 0) return 10
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10
  return step * mag
}

export const pctLabel = (p) =>
  `${Number(p).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`

/**
 * Riconosce l'errore "tabella inesistente".
 * PostgREST risponde `PGRST205` quando la tabella non è nella schema cache;
 * `42P01` è il codice Postgres nativo, che arriva da alcune RPC.
 */
export const tabellaMancante = (error) =>
  !!error &&
  (error.code === 'PGRST205' ||
    error.code === '42P01' ||
    /schema cache|does not exist/i.test(error.message || ''))

export const saluto = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buongiorno'
  if (h < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}
