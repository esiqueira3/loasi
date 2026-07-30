-- ============================================================================
-- POLICY DELLA TABELLA `paginas_menu`
--
-- Esegui nel SQL Editor di Supabase. È idempotente.
--
-- PRIMA DI ESEGUIRE
--   Chiudi le altre schede aperte sul gestionale (soprattutto /admin/menu):
--   questo script prende un lock esclusivo sulla tabella e, se qualcuno la sta
--   leggendo in continuazione, l'attesa può diventare lunga.
--
-- PERCHÉ SERVE
--   `paginas_menu` è nata dopo `supabase_permessi.sql`, che assegnava le policy
--   a un elenco fisso di tabelle. Le è rimasta la sola lettura pubblica: la
--   cancellazione veniva rifiutata in silenzio — zero righe toccate, nessun
--   errore — e il gestionale annunciava un'eliminazione mai avvenuta.
--
-- REGOLA CHIESTA
--   Le voci di sistema (`tipo = 'sistema'`) reggono il menu del sito e NON si
--   eliminano: si possono solo nascondere. La cancellazione resta possibile
--   solo per le voci aggiunte dopo (pagine dinamiche e link esterni).
--   Lo sbarramento è nel database, quindi vale anche per chi chiama l'API
--   direttamente, senza passare dal gestionale.
--
-- NOTA SUI LOCK
--   Tutto avviene in una sola transazione che prende subito il lock esclusivo
--   e lo tiene fino alla fine. La versione precedente lo prendeva e rilasciava
--   a ogni DROP, intrecciandosi con le letture del sito: da lì il deadlock.
--   Se il lock non arriva entro 15 secondi lo script si ferma con un errore
--   chiaro invece di restare appeso: chiudi le schede aperte e rilancia.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '15s';

-- Un solo lock, preso all'inizio e tenuto fino al COMMIT.
LOCK TABLE public.paginas_menu IN ACCESS EXCLUSIVE MODE;

-- --- Pulizia delle policy precedenti, comunque si chiamassero ---------------
-- L'elenco viene materializzato PRIMA di toccare qualsiasi cosa: nessuna
-- scansione del catalogo resta aperta mentre si eseguono i DROP.
DO $$
DECLARE
  nomi TEXT[];
  n    TEXT;
BEGIN
  SELECT array_agg(policyname)
    INTO nomi
    FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'paginas_menu';

  IF nomi IS NOT NULL THEN
    FOREACH n IN ARRAY nomi LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.paginas_menu', n);
    END LOOP;
  END IF;
END $$;

ALTER TABLE public.paginas_menu ENABLE ROW LEVEL SECURITY;

-- --- Lettura pubblica: il menu del sito deve funzionare per i visitatori ----
CREATE POLICY "Lettura pubblica"
  ON public.paginas_menu
  FOR SELECT
  USING (true);

-- --- Scrittura: riservata a chi gestisce il sito (modulo Chiese) ------------
CREATE POLICY "Inserimento"
  ON public.paginas_menu
  FOR INSERT TO authenticated
  WITH CHECK (public.puo_scrivere('Chiese'));

CREATE POLICY "Modifica"
  ON public.paginas_menu
  FOR UPDATE TO authenticated
  USING (public.puo_scrivere('Chiese'))
  WITH CHECK (public.puo_scrivere('Chiese'));

-- Eliminazione: mai le voci di sistema.
CREATE POLICY "Eliminazione"
  ON public.paginas_menu
  FOR DELETE TO authenticated
  USING (public.puo_scrivere('Chiese') AND tipo <> 'sistema');

COMMIT;

-- ============================================================================
-- CONTROLLO — devono comparire quattro righe: SELECT, INSERT, UPDATE, DELETE
-- ============================================================================

SELECT policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'paginas_menu'
 ORDER BY cmd, policyname;
