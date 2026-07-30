-- ============================================================================
-- DIAGNOSTICA DEI PERMESSI — sola lettura, non modifica nulla
--
-- Esegui nel SQL Editor di Supabase e incolla il risultato.
-- Serve a capire perché le eliminazioni vengono rifiutate.
-- ============================================================================

-- 1. CHI SEI PER IL SISTEMA -------------------------------------------------
--    L'e-mail di `utenti` deve coincidere ESATTAMENTE con quella dell'account.
--    Se non coincide, `mio_livello()` non ti trova e nega tutto.
SELECT
  'utente'                       AS cosa,
  u.email                        AS email_in_utenti,
  a.email                        AS email_in_auth,
  (lower(u.email) = lower(a.email)) AS combaciano,
  u.attivo,
  p.nome                         AS profilo,
  p.sistema                      AS profilo_di_sistema,
  p.permessi
FROM public.utenti u
LEFT JOIN public.profili p ON p.id = u.profilo_id
FULL OUTER JOIN auth.users a ON lower(a.email) = lower(u.email);

-- 2. LIVELLO CALCOLATO PER OGNI MODULO --------------------------------------
--    Simula quello che farebbe la policy, per l'utente della riga sopra.
SELECT
  m.modulo,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.utenti) THEN 'completo (nessun utente registrato)'
    ELSE COALESCE(
      (SELECT CASE
                WHEN u.attivo IS FALSE THEN 'nessuno (utente disattivato)'
                WHEN p.id IS NULL      THEN 'completo (senza profilo)'
                WHEN p.sistema         THEN 'completo (profilo di sistema)'
                ELSE COALESCE(p.permessi ->> m.modulo, 'nessuno (modulo assente dal profilo)')
              END
         FROM public.utenti u
         LEFT JOIN public.profili p ON p.id = u.profilo_id
        LIMIT 1),
      'nessuno')
  END AS livello
FROM (VALUES ('Home'), ('Chiese'), ('Eventi'), ('Dipartimenti'),
             ('Membri'), ('Finanze'), ('Utenti')) AS m(modulo);

-- 3. LE FUNZIONI ESISTONO? --------------------------------------------------
SELECT p.proname AS funzione, pg_get_function_identity_arguments(p.oid) AS argomenti
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('mio_livello', 'puo_leggere', 'puo_scrivere', 'mio_profilo', 'collega_utente_corrente')
 ORDER BY p.proname;

-- 4. POLICY DI ELIMINAZIONE ATTIVE ------------------------------------------
--    Se una tabella non compare qui, nessuno può eliminarne le righe.
SELECT c.relname AS tabella,
       c.relrowsecurity AS rls_attiva,
       COALESCE(pol.policyname, '— NESSUNA POLICY DELETE —') AS policy_delete,
       pol.qual AS condizione
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policies pol
         ON pol.schemaname = 'public'
        AND pol.tablename = c.relname
        AND pol.cmd = 'DELETE'
 WHERE n.nspname = 'public'
   AND c.relkind = 'r'
   AND c.relname IN ('paginas_menu', 'titoli_finanziari', 'rate_finanziarie',
                     'membri', 'dipartimenti', 'categorie_finanziarie', 'eventos')
 ORDER BY c.relname;
