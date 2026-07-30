-- ============================================================================
-- POLICY DELLA TABELLA `paginas_menu`
--
-- Esegui nel SQL Editor di Supabase. È idempotente.
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
--   Lo sbarramento è qui, nel database: vale anche per chi chiama l'API
--   direttamente, senza passare dal gestionale.
-- ============================================================================

ALTER TABLE public.paginas_menu ENABLE ROW LEVEL SECURITY;

-- --- Pulizia delle policy precedenti, comunque si chiamassero ---------------
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'paginas_menu'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.paginas_menu', p.policyname);
  END LOOP;
END $$;

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

-- ============================================================================
-- CONTROLLO
-- ============================================================================

SELECT policyname, cmd, roles, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'paginas_menu'
 ORDER BY cmd, policyname;
