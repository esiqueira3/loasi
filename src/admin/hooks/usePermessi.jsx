import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { tabellaMancante } from '../theme'

/**
 * Permessi dell'utente collegato.
 *
 *   const { puo, soloLettura, profilo } = usePermessi()
 *   puo('Finanze')            → true se ha almeno la lettura
 *   puo('Finanze', 'completo') → true solo con accesso completo
 *
 * SICUREZZA — questi permessi governano l'interfaccia, non il database.
 * Nascondere una voce di menu non impedisce a nessuno di interrogare l'API:
 * la barriera vera resta la Row Level Security di Supabase, che oggi concede
 * tutto a chi è autenticato. Finché non ci saranno policy per profilo, questo
 * è un filtro di comodità fra persone di fiducia, non una difesa.
 */

const PermessiContext = createContext(null)

/** Senza tabelle o senza riga in `utenti` si concede tutto: meglio che chiudersi fuori. */
const ACCESSO_TOTALE = { tipo: 'aperto' }

export function PermessiProvider({ children }) {
  const [stato, setStato] = useState({ caricamento: true, utente: null, profilo: null, modalita: 'aperto' })

  useEffect(() => {
    let annullato = false

    async function carica() {
      const { data: auth } = await supabase.auth.getUser()
      const email = auth?.user?.email
      if (!email) {
        if (!annullato) setStato({ caricamento: false, utente: null, profilo: null, modalita: 'aperto' })
        return
      }

      // aggancia l'account alla riga in `utenti` e aggiorna l'ultimo accesso
      await supabase.rpc('collega_utente_corrente').catch(() => {})

      const { data, error } = await supabase
        .from('utenti')
        .select('*, profilo:profili(*)')
        .ilike('email', email)
        .maybeSingle()

      if (annullato) return

      if (error && tabellaMancante(error)) {
        setStato({ caricamento: false, utente: null, profilo: null, modalita: 'aperto' })
        return
      }

      if (!data || !data.profilo) {
        // registrato ma senza profilo, oppure non registrato: nessuna restrizione
        setStato({ caricamento: false, utente: data || null, profilo: null, modalita: 'aperto' })
        return
      }

      setStato({
        caricamento: false,
        utente: data,
        profilo: data.profilo,
        modalita: data.profilo.sistema ? 'aperto' : 'profilo',
      })
    }

    carica()
    return () => {
      annullato = true
    }
  }, [])

  const valore = useMemo(() => {
    const { modalita, profilo, utente, caricamento } = stato
    const aperto = modalita === 'aperto'
    const permessi = profilo?.permessi || {}

    const livello = (modulo) => (aperto ? 'completo' : permessi[modulo] || 'nessuno')

    return {
      caricamento,
      utente,
      profilo,
      accessoAperto: aperto,
      livello,
      /** `puo('Membri')` = almeno lettura · `puo('Membri','completo')` = scrittura */
      puo: (modulo, minimo = 'lettura') => {
        const l = livello(modulo)
        if (l === 'completo') return true
        if (minimo === 'lettura') return l === 'lettura'
        return false
      },
      soloLettura: (modulo) => livello(modulo) === 'lettura',
    }
  }, [stato])

  return <PermessiContext.Provider value={valore}>{children}</PermessiContext.Provider>
}

export function usePermessi() {
  const ctx = useContext(PermessiContext)
  /* Fuori dal provider (o durante i test) non si blocca nulla. */
  return (
    ctx || {
      caricamento: false,
      utente: null,
      profilo: null,
      accessoAperto: true,
      livello: () => 'completo',
      puo: () => true,
      soloLettura: () => false,
      ...ACCESSO_TOTALE,
    }
  )
}
