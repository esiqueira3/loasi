-- ============================================================================
-- PERMESSI VERI, A LIVELLO DI DATABASE
--
-- Esegui nel SQL Editor di Supabase, DOPO `supabase_utenti.sql`. È idempotente.
--
-- COSA CAMBIA
--   Finora ogni persona autenticata poteva leggere e scrivere tutto: i profili
--   filtravano solo il menu. Da qui in avanti le policy interrogano il profilo
--   di chi fa la richiesta, quindi la restrizione vale anche per chi chiama
--   l'API di Supabase direttamente, fuori dal gestionale.
--
-- REGOLE DI ACCESSO
--   · `utenti` vuota            → tutto consentito (fase di avvio)
--   · autenticato ma NON in `utenti` → nessun accesso (non è stato invitato)
--   · `attivo = false`          → nessun accesso
--   · registrato senza profilo  → accesso completo (scelta esplicita)
--   · profilo di sistema        → accesso completo
--   · altrimenti                → quanto dice `profili.permessi`
-- ============================================================================

-- ============================================================================
-- 1. FUNZIONI DI SUPPORTO
--    SECURITY DEFINER: leggono `utenti`/`profili` scavalcando la RLS, altrimenti
--    servirebbe il permesso proprio per calcolare il permesso.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mio_livello(p_modulo TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.utenti) THEN 'completo'
    ELSE COALESCE(
      (
        SELECT CASE
                 WHEN u.attivo IS FALSE THEN 'nessuno'
                 WHEN p.id IS NULL      THEN 'completo'
                 WHEN p.sistema         THEN 'completo'
                 ELSE COALESCE(p.permessi ->> p_modulo, 'nessuno')
               END
          FROM public.utenti u
          LEFT JOIN public.profili p ON p.id = u.profilo_id
         WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
         LIMIT 1
      ),
      'nessuno'
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.puo_leggere(p_modulo TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.mio_livello(p_modulo) IN ('lettura', 'completo'); $$;

CREATE OR REPLACE FUNCTION public.puo_scrivere(p_modulo TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.mio_livello(p_modulo) = 'completo'; $$;

/* Profilo dell'utente collegato, per il gestionale.
   Passa da qui e non dalla tabella, così il calcolo dei permessi non dipende
   dai permessi stessi. */
CREATE OR REPLACE FUNCTION public.mio_profilo()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
               'utente',  to_jsonb(u) - 'auth_user_id',
               'profilo', to_jsonb(p),
               'aperto',  (p.id IS NULL OR p.sistema)
             )
        FROM public.utenti u
        LEFT JOIN public.profili p ON p.id = u.profilo_id
       WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
       LIMIT 1
    ),
    -- non invitato: aperto solo se il sistema non è ancora stato configurato
    jsonb_build_object(
      'utente', NULL,
      'profilo', NULL,
      'aperto', NOT EXISTS (SELECT 1 FROM public.utenti)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.mio_livello(TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.puo_leggere(TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.puo_scrivere(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mio_profilo()      TO authenticated;

-- ============================================================================
-- 2. TABELLE DEL GESTIONALE
--    Lettura e scrittura separate, entrambe legate al modulo.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('membri',                'Membri'),
      ('dipartimenti',          'Dipartimenti'),
      ('categorie_finanziarie', 'Finanze'),
      ('titoli_finanziari',     'Finanze'),
      ('rate_finanziarie',      'Finanze')
    ) AS t(tabella, modulo)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Accesso autenticato" ON public.%I', r.tabella);
    EXECUTE format('DROP POLICY IF EXISTS "Lettura" ON public.%I', r.tabella);
    EXECUTE format('DROP POLICY IF EXISTS "Inserimento" ON public.%I', r.tabella);
    EXECUTE format('DROP POLICY IF EXISTS "Modifica" ON public.%I', r.tabella);
    EXECUTE format('DROP POLICY IF EXISTS "Eliminazione" ON public.%I', r.tabella);

    EXECUTE format(
      'CREATE POLICY "Lettura" ON public.%I FOR SELECT TO authenticated USING (public.puo_leggere(%L))',
      r.tabella, r.modulo);
    EXECUTE format(
      'CREATE POLICY "Inserimento" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.puo_scrivere(%L))',
      r.tabella, r.modulo);
    EXECUTE format(
      'CREATE POLICY "Modifica" ON public.%I FOR UPDATE TO authenticated USING (public.puo_scrivere(%L)) WITH CHECK (public.puo_scrivere(%L))',
      r.tabella, r.modulo, r.modulo);
    EXECUTE format(
      'CREATE POLICY "Eliminazione" ON public.%I FOR DELETE TO authenticated USING (public.puo_scrivere(%L))',
      r.tabella, r.modulo);
  END LOOP;
END $$;

-- ============================================================================
-- 3. UTENTI E PROFILI
--    Chiunque sia autenticato deve poter leggere la propria riga, altrimenti
--    il gestionale non saprebbe chi è. Tutto il resto passa dal modulo Utenti.
-- ============================================================================

DROP POLICY IF EXISTS "Accesso autenticato" ON public.utenti;
DROP POLICY IF EXISTS "Lettura" ON public.utenti;
DROP POLICY IF EXISTS "Inserimento" ON public.utenti;
DROP POLICY IF EXISTS "Modifica" ON public.utenti;
DROP POLICY IF EXISTS "Eliminazione" ON public.utenti;

CREATE POLICY "Lettura" ON public.utenti
  FOR SELECT TO authenticated
  USING (public.puo_leggere('Utenti') OR lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Inserimento" ON public.utenti
  FOR INSERT TO authenticated WITH CHECK (public.puo_scrivere('Utenti'));

-- Nessuno può promuoversi da solo: per cambiare una riga serve il modulo Utenti.
CREATE POLICY "Modifica" ON public.utenti
  FOR UPDATE TO authenticated
  USING (public.puo_scrivere('Utenti')) WITH CHECK (public.puo_scrivere('Utenti'));

CREATE POLICY "Eliminazione" ON public.utenti
  FOR DELETE TO authenticated USING (public.puo_scrivere('Utenti'));

DROP POLICY IF EXISTS "Accesso autenticato" ON public.profili;
DROP POLICY IF EXISTS "Lettura" ON public.profili;
DROP POLICY IF EXISTS "Inserimento" ON public.profili;
DROP POLICY IF EXISTS "Modifica" ON public.profili;
DROP POLICY IF EXISTS "Eliminazione" ON public.profili;

-- I profili non contengono dati sensibili e servono a mostrare il proprio ruolo.
CREATE POLICY "Lettura" ON public.profili FOR SELECT TO authenticated USING (true);

CREATE POLICY "Inserimento" ON public.profili
  FOR INSERT TO authenticated WITH CHECK (public.puo_scrivere('Utenti'));
CREATE POLICY "Modifica" ON public.profili
  FOR UPDATE TO authenticated
  USING (public.puo_scrivere('Utenti')) WITH CHECK (public.puo_scrivere('Utenti'));
CREATE POLICY "Eliminazione" ON public.profili
  FOR DELETE TO authenticated USING (public.puo_scrivere('Utenti') AND sistema = FALSE);

-- ============================================================================
-- 4. TABELLE DEL SITO PUBBLICO
--    La lettura resta aperta a tutti: serve al sito. Cambia solo chi può
--    scrivere, ora legato al modulo Chiese.
-- ============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['igrejas', 'igreja_fotos', 'diretoria', 'banners', 'eventos', 'depoimentos']
  LOOP
    -- le vecchie policy davano scrittura a chiunque fosse autenticato
    EXECUTE format('DROP POLICY IF EXISTS "Escrita autenticada em igrejas" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Escrita autenticada em fotos de igrejas" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Escrita autenticada na diretoria" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Escrita autenticada em banners" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Escrita autenticada em eventos" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Escrita autenticada em depoimentos" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Inserimento" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Modifica" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Eliminazione" ON public.%I', t);

    EXECUTE format(
      'CREATE POLICY "Inserimento" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.puo_scrivere(''Chiese''))', t);
    EXECUTE format(
      'CREATE POLICY "Modifica" ON public.%I FOR UPDATE TO authenticated USING (public.puo_scrivere(''Chiese'')) WITH CHECK (public.puo_scrivere(''Chiese''))', t);
    EXECUTE format(
      'CREATE POLICY "Eliminazione" ON public.%I FOR DELETE TO authenticated USING (public.puo_scrivere(''Chiese''))', t);
  END LOOP;
END $$;

-- ============================================================================
-- 5. CONTROLLO FINALE
--    Elenca le policy attive, per verificare a colpo d'occhio.
-- ============================================================================

SELECT tablename, policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public'
 ORDER BY tablename, cmd, policyname;
