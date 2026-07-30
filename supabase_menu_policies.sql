-- ============================================================================
-- URGENTE — CHIUDE UNA FALLA DI SICUREZZA SU `paginas_menu`
--
-- Esegui nel SQL Editor di Supabase. È idempotente.
--
-- IL PROBLEMA
--   La tabella ha policy permissive che valgono anche per i visitatori non
--   autenticati: con la sola chiave pubblica — che è dentro al codice del sito,
--   quindi alla portata di chiunque — è possibile creare, modificare ed
--   eliminare voci di menu e il contenuto delle pagine dinamiche.
--   Verificato: un inserimento anonimo è andato a buon fine (poi rimosso).
--
-- DOPO QUESTO SCRIPT
--   · lettura  → pubblica, serve al menu del sito
--   · scrittura → solo utenti autenticati con il modulo Chiese
--   · eliminazione → mai le voci di sistema
--
-- PRIMA DI ESEGUIRE
--   Chiudi le altre schede del gestionale (soprattutto /admin/menu): lo script
--   prende un lock esclusivo e le letture continue lo farebbero attendere.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '15s';

-- Un solo lock, preso subito e tenuto fino al COMMIT: è ciò che evita il
-- deadlock contro le letture del sito.
LOCK TABLE public.paginas_menu IN ACCESS EXCLUSIVE MODE;

-- L'elenco viene materializzato PRIMA dei DROP: nessuna scansione del
-- catalogo resta aperta mentre si esegue il DDL.
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

CREATE POLICY "Lettura pubblica"
  ON public.paginas_menu
  FOR SELECT
  USING (true);

CREATE POLICY "Inserimento"
  ON public.paginas_menu
  FOR INSERT TO authenticated
  WITH CHECK (public.puo_scrivere('Chiese'));

CREATE POLICY "Modifica"
  ON public.paginas_menu
  FOR UPDATE TO authenticated
  USING (public.puo_scrivere('Chiese'))
  WITH CHECK (public.puo_scrivere('Chiese'));

CREATE POLICY "Eliminazione"
  ON public.paginas_menu
  FOR DELETE TO authenticated
  USING (public.puo_scrivere('Chiese') AND tipo <> 'sistema');

COMMIT;

-- ============================================================================
-- CONTROLLO — quali tabelle lasciano ancora scrivere a chi NON è autenticato?
--
-- Ogni riga qui sotto è una porta aperta: una policy di scrittura che si
-- applica anche al ruolo `anon` o a `public`. L'elenco dovrebbe restare vuoto.
-- ============================================================================

SELECT tablename   AS tabella,
       policyname  AS policy,
       cmd         AS operazione,
       roles       AS ruoli
  FROM pg_policies
 WHERE schemaname = 'public'
   AND cmd <> 'SELECT'
   AND (roles::text[] && ARRAY['public', 'anon'])
 ORDER BY tablename, cmd;
