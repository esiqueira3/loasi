-- ============================================================================
-- BLINDATURA — chiude quanto emerso dalla verifica di sicurezza
--
-- Esegui nel SQL Editor di Supabase. È idempotente e non tocca i dati.
-- Chiudi prima le altre schede del gestionale: si prende un lock su
-- `paginas_menu`.
--
-- COSA SISTEMA
--   1. Rimuove `diagnostica_permessi`, la funzione creata per l'indagine:
--      era invocabile da chiunque e, dato un indirizzo e-mail, rivelava i
--      permessi di quella persona. Serviva a trovare un guasto, non a restare
--      in produzione.
--   2. Toglie a chi non ha fatto login il diritto di invocare le funzioni dei
--      permessi: non servono prima dell'accesso.
--   3. Restringe la lettura dei profili a chi è davvero registrato.
--   4. Lega i promemoria agli utenti registrati e attivi.
--   5. Ridà a `paginas_menu` le policy di scrittura corrette: la pulizia
--      precedente aveva rimosso quelle aperte a tutti, senza sostituirle.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '15s';
LOCK TABLE public.paginas_menu IN ACCESS EXCLUSIVE MODE;

-- ---------------------------------------------------------------------------
-- 1. Via la funzione di diagnostica
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.diagnostica_permessi(TEXT);

-- ---------------------------------------------------------------------------
-- 2. Le funzioni dei permessi solo a chi è autenticato
--    (di default Postgres concede l'esecuzione a chiunque)
-- ---------------------------------------------------------------------------
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.mio_livello(text)',
    'public.puo_leggere(text)',
    'public.puo_scrivere(text)',
    'public.mio_profilo()',
    'public.collega_utente_corrente()'
  ] LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', f);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Funzione assente, saltata: %', f;
    END;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. I profili si leggono solo se si è registrati
--    Il gestionale non ne soffre: usa `mio_profilo()`, che gira in
--    SECURITY DEFINER e non dipende da questa policy.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lettura" ON public.profili;
CREATE POLICY "Lettura" ON public.profili
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.utenti u
             WHERE lower(u.email) = lower(auth.jwt() ->> 'email'))
  );

-- ---------------------------------------------------------------------------
-- 4. Promemoria: propri, e solo per utenti registrati e attivi
--    Senza questo, chiunque si registri può scrivere righe nel database.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Promemoria personali" ON public.promemoria;
CREATE POLICY "Promemoria personali" ON public.promemoria
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.utenti u
                 WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
                   AND u.attivo IS NOT FALSE)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.utenti u
                 WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
                   AND u.attivo IS NOT FALSE)
  );

-- ---------------------------------------------------------------------------
-- 5. `paginas_menu`: rimette le policy di scrittura buone
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lettura pubblica" ON public.paginas_menu;
DROP POLICY IF EXISTS "Inserimento"      ON public.paginas_menu;
DROP POLICY IF EXISTS "Modifica"         ON public.paginas_menu;
DROP POLICY IF EXISTS "Eliminazione"     ON public.paginas_menu;

CREATE POLICY "Lettura pubblica" ON public.paginas_menu
  FOR SELECT USING (true);

CREATE POLICY "Inserimento" ON public.paginas_menu
  FOR INSERT TO authenticated WITH CHECK (public.puo_scrivere('Chiese'));

CREATE POLICY "Modifica" ON public.paginas_menu
  FOR UPDATE TO authenticated
  USING (public.puo_scrivere('Chiese')) WITH CHECK (public.puo_scrivere('Chiese'));

-- Le voci di sistema reggono il menu del sito: non si eliminano.
CREATE POLICY "Eliminazione" ON public.paginas_menu
  FOR DELETE TO authenticated
  USING (public.puo_scrivere('Chiese') AND tipo <> 'sistema');

COMMIT;

-- ============================================================================
-- CONTROLLO FINALE — deve restituire ZERO righe
-- ============================================================================

SELECT 'scrittura aperta agli anonimi' AS problema,
       tablename || ' · ' || policyname AS dettaglio
  FROM pg_policies
 WHERE schemaname = 'public'
   AND cmd <> 'SELECT'
   AND (roles::text[] && ARRAY['public', 'anon'])

UNION ALL

SELECT 'funzione di diagnostica ancora presente',
       p.proname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'diagnostica_permessi'

UNION ALL

SELECT 'tabella senza RLS',
       c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
