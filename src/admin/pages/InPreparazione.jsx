import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import AdminLayout, { PageTitle } from '../components/AdminLayout'
import { Panel } from '../components/ui'

/**
 * Segnaposto per le sezioni del gestionale non ancora sviluppate.
 * Meglio una pagina onesta che una voce di menu che porta a un errore.
 */
export default function InPreparazione({ titolo, icona, accent, descrizione }) {
  return (
    <AdminLayout titolo={titolo} icona={icona} accent={accent}>
      <div className="mx-auto max-w-[900px]">
        <PageTitle titolo={titolo} sottotitolo={descrizione} />

        <Panel className="p-10 text-center lg:p-16">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            <Icon name={icona} className="text-[32px]" />
          </div>

          <h3 className="font-display-lg mb-3 text-[24px] font-light text-ink lg:text-[28px]">
            Sezione in preparazione
          </h3>
          <p className="mx-auto max-w-md text-[14px] leading-relaxed text-ink-muted-80">
            Questa schermata non è ancora stata sviluppata. Il menu e il layout sono già pronti: appena il modulo sarà
            disponibile comparirà qui, senza altri passaggi.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 rounded-xl border border-hairline px-5 py-2.5 text-[13px] font-semibold text-ink-muted-80 transition-all hover:bg-canvas-parchment hover:text-ink"
            >
              <Icon name="arrow_back" className="text-[17px]" />
              Torna alla Home
            </Link>
            <Link
              to="/admin/finanze"
              style={{ backgroundColor: accent }}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:brightness-110"
            >
              <Icon name="payments" className="text-[17px]" />
              Vai alle Finanze
            </Link>
          </div>
        </Panel>
      </div>
    </AdminLayout>
  )
}
