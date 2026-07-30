import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'

/**
 * Notifiche leggere, senza dipendenze esterne.
 *
 *   import { toast, ToastHost } from './Toast'
 *   toast.success('Salvato!')
 *
 * `<ToastHost />` va montato una volta sola, nel guscio del gestionale.
 */

let listener = null
let seq = 0

const emit = (tipo, messaggio, durata) => {
  if (!listener) return
  listener({ id: ++seq, tipo, messaggio, durata })
}

export const toast = {
  success: (m, durata = 3800) => emit('success', m, durata),
  error: (m, durata = 5200) => emit('error', m, durata),
  info: (m, durata = 3800) => emit('info', m, durata),
}

const STILI = {
  success: { icona: 'check_circle', colore: '#107C42' },
  error: { icona: 'error', colore: '#EF4444' },
  info: { icona: 'info', colore: '#2563EB' },
}

export function ToastHost() {
  const [items, setItems] = useState([])

  useEffect(() => {
    listener = (t) => {
      setItems((prev) => [...prev, t])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id))
      }, t.durata)
    }
    return () => {
      listener = null
    }
  }, [])

  const chiudi = (id) => setItems((prev) => prev.filter((x) => x.id !== id))

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(92vw,380px)] flex-col gap-2.5">
      {items.map((t) => {
        const s = STILI[t.tipo] || STILI.info
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-hairline bg-surface-pearl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${s.colore}15`, color: s.colore }}
            >
              <Icon name={s.icona} className="text-[20px]" />
            </span>
            <p className="flex-1 pt-1.5 text-[13.5px] font-semibold leading-snug text-ink">{t.messaggio}</p>
            <button
              type="button"
              onClick={() => chiudi(t.id)}
              aria-label="Chiudi"
              className="rounded-lg p-1 text-ink-muted-48 transition-colors hover:text-ink"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
