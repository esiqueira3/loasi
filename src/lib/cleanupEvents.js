import { supabase } from './supabase'
import { deleteImageFromStorage } from './r2'

/**
 * Rotina automática para deletar eventos que já aconteceram há mais de 15 dias.
 * Remove a foto do storage (Cloudflare R2 / Supabase Storage) e deleta o registro no banco.
 */
let isRunning = false

export async function cleanupExpiredEvents() {
  if (isRunning) return { count: 0, deleted: [] }
  isRunning = true

  try {
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000
    const thresholdDate = new Date(Date.now() - FIFTEEN_DAYS_MS)

    // 1. Buscar todos os eventos cadastrados
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('id, data_evento, imagem_url, titulo')

    if (error || !Array.isArray(eventos) || eventos.length === 0) {
      return { count: 0, deleted: [] }
    }

    // 2. Filtrar os eventos realizados há mais de 15 dias
    const expiredEvents = eventos.filter((ev) => {
      if (!ev.data_evento) return false
      const eventDate = new Date(ev.data_evento)
      if (Number.isNaN(eventDate.getTime())) return false
      return eventDate < thresholdDate
    })

    if (expiredEvents.length === 0) {
      return { count: 0, deleted: [] }
    }

    const deletedItems = []

    for (const ev of expiredEvents) {
      // a. Deletar a foto do Cloudflare R2 / Supabase Storage se existir
      if (ev.imagem_url) {
        try {
          await deleteImageFromStorage(ev.imagem_url)
        } catch (imgErr) {
          console.warn('[AutoCleanup] Falha ao deletar imagem no storage:', imgErr)
        }
      }

      // b. Deletar o registro no banco Supabase
      const { error: delErr } = await supabase.from('eventos').delete().eq('id', ev.id)
      if (!delErr) {
        deletedItems.push(ev)
      } else {
        console.error('[AutoCleanup] Falha ao deletar evento no Supabase:', delErr)
      }
    }

    return { count: deletedItems.length, deleted: deletedItems }
  } catch (err) {
    console.warn('[AutoCleanup] Erro durante a limpeza de eventos:', err)
    return { count: 0, deleted: [] }
  } finally {
    isRunning = false
  }
}
