import { supabase } from '../../lib/supabase'

/**
 * Scritture che dicono la verità.
 *
 * Quando la Row Level Security rifiuta un'operazione, Supabase NON restituisce
 * un errore: risponde «tutto bene» con zero righe toccate. Senza `.select()`
 * l'interfaccia annuncia eliminazioni e modifiche che non sono mai avvenute,
 * e il dato ricompare al ricaricamento successivo.
 *
 * Questi helper aggiungono sempre `.select()` e trasformano lo «zero righe»
 * in un errore leggibile.
 */

export const ERRORE_PERMESSI =
  'Il database ha rifiutato l’operazione: il tuo profilo non ha i permessi di scrittura su questa sezione. ' +
  'Controlla il profilo in Utenti → Profili di accesso.'

const zeroRighe = () => ({ error: { message: ERRORE_PERMESSI, permessi: true } })

/** Elimina per chiave primaria. */
export async function eliminaPerId(tabella, id) {
  const { data, error } = await supabase.from(tabella).delete().eq('id', id).select()
  if (error) return { error }
  if (!data?.length) return zeroRighe()
  return { data }
}

/** Elimina tutte le righe che corrispondono a una colonna. */
export async function eliminaPerColonna(tabella, colonna, valore, { ammettiVuoto = false } = {}) {
  const { data, error } = await supabase.from(tabella).delete().eq(colonna, valore).select()
  if (error) return { error }
  if (!ammettiVuoto && !data?.length) return zeroRighe()
  return { data }
}

/** Aggiorna per chiave primaria. */
export async function aggiornaPerId(tabella, id, valori) {
  const { data, error } = await supabase.from(tabella).update(valori).eq('id', id).select()
  if (error) return { error }
  if (!data?.length) return zeroRighe()
  return { data }
}
