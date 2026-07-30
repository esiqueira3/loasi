import { ConfirmProvider } from './Confirm'
import { ToastHost } from './Toast'
import { PermessiProvider } from '../hooks/usePermessi'

/**
 * Contesti condivisi dal gestionale.
 *
 * Vanno montati SOPRA le pagine, non dentro AdminLayout: le pagine chiamano
 * `useConfirm()` e `usePermessi()` nel proprio corpo e renderizzano AdminLayout
 * come figlio, quindi un provider interno resterebbe sotto di loro e i hook
 * ricadrebbero sul valore predefinito. Con `useConfirm` questo significava una
 * conferma che rispondeva sempre «no»: nessun dialogo, nessuna eliminazione e
 * nessun errore.
 */
export default function AdminProviders({ children }) {
  return (
    <PermessiProvider>
      <ConfirmProvider>
        {children}
        <ToastHost />
      </ConfirmProvider>
    </PermessiProvider>
  )
}
