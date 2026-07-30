import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { OGGI, toDate, toISO, addMonths, tabellaMancante } from '../theme'

/* ------------------------------------------------------------------ */
/* Regole di dominio                                                   */
/* ------------------------------------------------------------------ */

export const TIPI = {
  entrata: { label: 'Entrata', icona: 'arrow_upward', entrata: true, colore: '#107C42' },
  uscita: { label: 'Uscita', icona: 'arrow_downward', entrata: false, colore: '#EF4444' },
}

export const isEntrata = (titolo) => titolo?.tipo === 'entrata'

export const rataScaduta = (r) => r.stato === 'aperta' && toDate(r.scadenza) < OGGI

export function statoTitolo(t) {
  const rate = t.rate || []
  if (!rate.length) return { key: 'vuoto', label: 'Senza rate', color: '#7A7A7A', bg: 'rgba(122,122,122,0.15)' }
  const tutteSaldate = rate.every((r) => r.stato === 'saldata')
  const qualcunaSaldata = rate.some((r) => r.stato === 'saldata')
  const qualcunaScaduta = rate.some(rataScaduta)
  if (tutteSaldate)
    return {
      key: 'saldato',
      label: isEntrata(t) ? 'Incassato' : 'Pagato',
      color: '#107C42',
      bg: 'rgba(16,124,66,0.15)',
    }
  if (qualcunaScaduta) return { key: 'scaduto', label: 'Scaduto', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' }
  if (qualcunaSaldata) return { key: 'parziale', label: 'Parziale', color: '#B08D45', bg: 'rgba(176,141,69,0.15)' }
  return { key: 'aperto', label: 'Da saldare', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' }
}

export function statoRata(r) {
  if (r.stato === 'saldata') return { label: 'Saldata', color: '#107C42', bg: 'rgba(16,124,66,0.15)' }
  if (rataScaduta(r)) return { label: 'Scaduta', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' }
  const giorni = Math.round((toDate(r.scadenza) - OGGI) / 86400000)
  if (giorni <= 7)
    return {
      label: giorni <= 0 ? 'Scade oggi' : `Scade tra ${giorni}g`,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.15)',
    }
  return { label: 'In scadenza', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' }
}

/* ------------------------------------------------------------------ */
/* Costruzione del piano rate                                          */
/* ------------------------------------------------------------------ */

/**
 * Divide `totale` in `numero` rate, spingendo gli arrotondamenti sull'ultima
 * così la somma torna sempre esatta al centesimo.
 */
export function costruisciRate({ totale, numero, primaScadenza }) {
  const n = Math.max(1, Number(numero) || 1)
  const centesimi = Math.round(Number(totale) * 100)
  const base = Math.floor(centesimi / n)
  const resto = centesimi - base * n

  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    totale_rate: n,
    importo: (i === n - 1 ? base + resto : base) / 100,
    scadenza: toISO(addMonths(toDate(primaScadenza) || OGGI, i)),
    stato: 'aperta',
  }))
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useFinanze() {
  const [titoli, setTitoli] = useState([])
  const [categorie, setCategorie] = useState([])
  const [chiese, setChiese] = useState([])
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)

  const carica = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('titoli_finanziari')
      .select(
        '*, rate:rate_finanziarie(*), categoria:categorie_finanziarie(id, nome, colore), chiesa:igrejas(id, cidade)'
      )
      .order('created_at', { ascending: false })

    if (error) {
      if (tabellaMancante(error)) setSetupNeeded(true)
      setTitoli([])
      setLoading(false)
      return
    }

    setSetupNeeded(false)
    setTitoli(
      (data || []).map((t) => ({
        ...t,
        rate: [...(t.rate || [])].sort((a, b) => a.numero - b.numero),
      }))
    )

    const [{ data: cats }, { data: ch }] = await Promise.all([
      supabase.from('categorie_finanziarie').select('*').order('tipo').order('nome'),
      supabase.from('igrejas').select('id, cidade').order('cidade'),
    ])
    setCategorie(cats || [])
    setChiese(ch || [])

    setLoading(false)
  }, [])

  useEffect(() => {
    carica()
  }, [carica])

  /* --- Comandi --- */

  const creaTitolo = useCallback(
    async ({ descrizione, tipo, categoria_id, igreja_id, importo, numero_rate, prima_scadenza, note }) => {
      const { data: titolo, error } = await supabase
        .from('titoli_finanziari')
        .insert([
          {
            descrizione: descrizione.trim(),
            tipo,
            categoria_id: categoria_id || null,
            igreja_id: igreja_id || null,
            importo_totale: Number(importo),
            note: note?.trim() || null,
          },
        ])
        .select()
        .single()

      if (error) return { error }

      const rate = costruisciRate({ totale: importo, numero: numero_rate, primaScadenza: prima_scadenza })
      const { error: errRate } = await supabase
        .from('rate_finanziarie')
        .insert(rate.map((r) => ({ ...r, titolo_id: titolo.id })))

      if (errRate) return { error: errRate }

      await carica()
      return { data: titolo }
    },
    [carica]
  )

  const saldaRata = useCallback(
    async (rata, { data, importo, modalita }) => {
      const { error } = await supabase
        .from('rate_finanziarie')
        .update({
          stato: 'saldata',
          saldata_il: data,
          importo_saldato: Number(importo),
          modalita_pagamento: modalita || null,
        })
        .eq('id', rata.id)

      if (error) return { error }
      await carica()
      return {}
    },
    [carica]
  )

  const stornaRata = useCallback(
    async (rata) => {
      const { error } = await supabase
        .from('rate_finanziarie')
        .update({ stato: 'aperta', saldata_il: null, importo_saldato: null, modalita_pagamento: null })
        .eq('id', rata.id)

      if (error) return { error }
      await carica()
      return {}
    },
    [carica]
  )

  const eliminaTitolo = useCallback(
    async (id) => {
      // Cancella prima le rate associate al titolo per evitare errori di vincolo FK
      const { error: errRate } = await supabase.from('rate_finanziarie').delete().eq('titolo_id', id)
      if (errRate) return { error: errRate }

      const { error } = await supabase.from('titoli_finanziari').delete().eq('id', id)
      if (error) return { error }
      await carica()
      return {}
    },
    [carica]
  )

  const riprogrammaTitolo = useCallback(
    async (titolo, { numero_rate, prima_scadenza }) => {
      const { error: errDel } = await supabase.from('rate_finanziarie').delete().eq('titolo_id', titolo.id)
      if (errDel) return { error: errDel }

      const rate = costruisciRate({
        totale: titolo.importo_totale,
        numero: numero_rate,
        primaScadenza: prima_scadenza,
      })
      const { error } = await supabase
        .from('rate_finanziarie')
        .insert(rate.map((r) => ({ ...r, titolo_id: titolo.id })))

      if (error) return { error }
      await carica()
      return {}
    },
    [carica]
  )

  /* --- Tutte le rate, con il titolo agganciato --- */
  const rate = useMemo(
    () => titoli.flatMap((t) => (t.rate || []).map((r) => ({ ...r, titolo: t }))),
    [titoli]
  )

  return {
    titoli,
    rate,
    categorie,
    chiese,
    loading,
    setupNeeded,
    ricarica: carica,
    creaTitolo,
    saldaRata,
    stornaRata,
    eliminaTitolo,
    riprogrammaTitolo,
  }
}
