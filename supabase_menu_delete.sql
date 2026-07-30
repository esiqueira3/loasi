-- ============================================================================
-- POLICY DI ELIMINAZIONE PER `paginas_menu`
--
-- La diagnostica ha confermato che alla tabella manca SOLO la policy di
-- DELETE: lettura, inserimento e modifica funzionano già (infatti le pagine
-- si creano e si nascondono senza problemi).
--
-- Questo script fa quindi il minimo indispensabile: due istruzioni, nessun
-- ciclo sul catalogo, nessun lock esclusivo prolungato. È l'opposto della
-- versione che aveva causato il deadlock.
--
-- REGOLA
--   Si eliminano solo le voci NON di sistema: quelle di sistema reggono il
--   menu del sito e si possono soltanto nascondere. Il vincolo sta qui, nel
--   database, quindi vale anche per chi chiama l'API direttamente.
-- ============================================================================

DROP POLICY IF EXISTS "Eliminazione" ON public.paginas_menu;

CREATE POLICY "Eliminazione"
  ON public.paginas_menu
  FOR DELETE TO authenticated
  USING (public.puo_scrivere('Chiese') AND tipo <> 'sistema');
