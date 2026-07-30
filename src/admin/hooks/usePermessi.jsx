import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Permessi dell'utente collegato.
 *
 *   const { puo, soloLettura, profilo } = usePermessi()
 *   puo('Finanze')             → almeno la lettura
 *   puo('Finanze', 'completo') → può anche modificare
 *
 * I livelli arrivano dalla funzione `mio_profilo()` di Supabase, che gira in
 * SECURITY DEFINER: così sapere chi sei non dipende dal permesso di leggere la
 * tabella `utenti`. Se la funzione non esiste ancora (database non aggiornato)
 * si ripiega sulla lettura diretta.
 *
 * Queste regole governano l'interfaccia. La barriera vera sono le policy RLS
 * installate da `supabase_permessi.sql`, che applicano gli stessi livelli anche
 * a chi interroga l'API fuori dal gestionale.
 */

const PermessiContext = createContext(null)

const APERTO = {
  caricamento: false,
  utente: null,
  profilo: null,
  accessoAperto: true,
  livello: () => 'completo',
  puo: () => true,
  soloLettura: () => false,
}

export function PermessiProvider({ children }) {
  const [stato, setStato] = useState({ caricamento: true, utente: null, profilo: null, aperto: true })

  useEffect(() => {
    let annullato = false

    async function carica() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user?.email) {
        if (!annullato) setStato({ caricamento: false, utente: null, profilo: null, aperto: true })
        return
      }

      // aggancia l'account alla riga in `utenti` e segna l'ultimo accesso
      try {
        await supabase.rpc('collega_utente_corrente')
      } catch {
        /* database non ancora aggiornato: si prosegue */
      }

      const { data, error } = await supabase.rpc('mio_profilo')

      if (annullato) return

      if (!error && data) {
        setStato({
          caricamento: false,
          utente: data.utente || null,
          profilo: data.profilo || null,
          aperto: Boolean(data.aperto),
        })
        return
      }

      /* Ripiego: database senza la funzione. */
      const { data: riga } = await supabase
        .from('utenti')
        .select('*, profilo:profili(*)')
        .ilike('email', auth.user.email)
        .maybeSingle()

      if (annullato) return

      setStato({
        caricamento: false,
        utente: riga || null,
        profilo: riga?.profilo || null,
        aperto: !riga?.profilo || Boolean(riga.profilo.sistema),
      })
    }

    carica()
    return () => {
      annullato = true
    }
  }, [])

  const valore = useMemo(() => {
    const { aperto, profilo, utente, caricamento } = stato
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
        return minimo === 'lettura' && l === 'lettura'
      },
      soloLettura: (modulo) => livello(modulo) === 'lettura',
    }
  }, [stato])

  return <PermessiContext.Provider value={valore}>{children}</PermessiContext.Provider>
}

export function usePermessi() {
  /* Fuori dal provider non si blocca nulla. */
  return useContext(PermessiContext) || APERTO
}
