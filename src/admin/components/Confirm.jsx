import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import { BtnGhost, Modal } from './ui'

/**
 * Dialogo di conferma con API a promessa.
 *
 *   const confirm = useConfirm()
 *   if (await confirm({ titolo: 'Eliminare?', messaggio: '…', intent: 'danger' })) { … }
 */

const ConfirmContext = createContext(null)

export function useConfirm() {
  const confirm = useContext(ConfirmContext)

  /* Fuori dal provider il vecchio valore predefinito rispondeva sempre «no»:
     ogni eliminazione veniva annullata senza dialogo e senza errore. Meglio
     un rifiuto rumoroso, che si nota subito. */
  if (!confirm) {
    return () => {
      console.error(
        '[L’Oasi] useConfirm() usato fuori da <AdminProviders>: la conferma non può funzionare. ' +
          'Monta i provider sopra le pagine, non dentro AdminLayout.'
      )
      return Promise.resolve(false)
    }
  }

  return confirm
}

export function ConfirmProvider({ children }) {
  const [stato, setStato] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((opzioni) => {
    setStato({
      titolo: 'Confermi?',
      messaggio: '',
      testoConferma: 'Conferma',
      testoAnnulla: 'Annulla',
      intent: 'default',
      ...opzioni,
    })
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const rispondi = (valore) => {
    resolver.current?.(valore)
    resolver.current = null
    setStato(null)
  }

  const pericolo = stato?.intent === 'danger'
  const accent = pericolo ? '#EF4444' : '#107C42'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {stato && (
        <Modal
          onClose={() => rispondi(false)}
          titolo={stato.titolo}
          sottotitolo={stato.sottotitolo}
          icona={pericolo ? 'warning' : 'help'}
          accent={accent}
        >
          {stato.messaggio && (
            <p className="text-[14px] leading-relaxed text-ink-muted-80">{stato.messaggio}</p>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-hairline pt-4">
            <BtnGhost onClick={() => rispondi(false)}>{stato.testoAnnulla}</BtnGhost>
            <button
              type="button"
              onClick={() => rispondi(true)}
              style={{ backgroundColor: accent }}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
            >
              <Icon name={pericolo ? 'delete' : 'check'} className="text-[16px]" />
              {stato.testoConferma}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  )
}
