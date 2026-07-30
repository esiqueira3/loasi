import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Legge una tabella pubblica di Supabase con fallback statico.
 *
 * Finché il pastore non pubblica record dal gestionale, il sito mostra i
 * contenuti curati in `src/data/site.js`; appena esiste almeno un record
 * attivo, la sezione passa automaticamente ai dati del database.
 *
 *   const { rows, isLive } = useSupabaseTable('eventi', {
 *     fallback: fallbackEvents,
 *     order: { column: 'data_evento' },
 *     filters: { ativo: true },
 *   })
 */
export function useSupabaseTable(table, { fallback = [], order, filters, limit } = {}) {
  const [rows, setRows] = useState(fallback)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const filterKey = JSON.stringify(filters || {})
  const orderKey = JSON.stringify(order || {})

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        let query = supabase.from(table).select('*')

        const activeFilters = JSON.parse(filterKey)
        Object.entries(activeFilters).forEach(([column, value]) => {
          query = query.eq(column, value)
        })

        const activeOrder = JSON.parse(orderKey)
        if (activeOrder.column) {
          query = query.order(activeOrder.column, { ascending: activeOrder.ascending !== false })
        }
        if (limit) query = query.limit(limit)

        const { data, error } = await query
        if (cancelled) return

        if (!error && Array.isArray(data) && data.length > 0) {
          setRows(data)
          setIsLive(true)
        }
      } catch {
        /* offline o tabella assente: resta il contenuto statico */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [table, filterKey, orderKey, limit])

  return { rows, isLive, loading }
}
