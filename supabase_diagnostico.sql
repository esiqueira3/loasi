-- ============================================================================
-- DIAGNOSTICA DEI PERMESSI — sola lettura, non modifica nulla
--
-- UNA SOLA query, di proposito: il SQL Editor di Supabase mostra soltanto il
-- risultato dell'ultima istruzione, quindi uno script con più SELECT ne
-- nasconderebbe la maggior parte.
--
-- Esegui e incolla il risultato.
--
-- COME LEGGERLO
--   email_account NULL  → in `utenti` c'è un'e-mail che non corrisponde a
--                         nessun account: `mio_livello()` non ti trova e nega
--                         ogni operazione
--   attivo = false      → accesso revocato
--   profilo_di_sistema  → se true, dovresti avere accesso completo ovunque
--   livello_finanze     → deve essere 'completo' per poter eliminare i
--                         movimenti; 'lettura' li mostra ma non li cancella
-- ============================================================================

SELECT
  u.nome,
  u.email                                        AS email_utenti,
  a.email                                        AS email_account,
  (u.auth_user_id IS NOT NULL)                   AS account_collegato,
  u.attivo,
  COALESCE(p.nome, '— senza profilo —')          AS profilo,
  COALESCE(p.sistema, FALSE)                     AS profilo_di_sistema,
  COALESCE(p.permessi ->> 'Finanze', '(assente)') AS livello_finanze,
  COALESCE(p.permessi ->> 'Chiese',  '(assente)') AS livello_chiese,
  COALESCE(p.permessi ->> 'Home',    '(assente)') AS livello_home,
  (SELECT string_agg(pr.proname, ', ' ORDER BY pr.proname)
     FROM pg_proc pr
     JOIN pg_namespace n ON n.oid = pr.pronamespace
    WHERE n.nspname = 'public'
      AND pr.proname IN ('mio_livello', 'puo_leggere', 'puo_scrivere',
                         'mio_profilo', 'collega_utente_corrente')
  )                                              AS funzioni_presenti
FROM public.utenti u
LEFT JOIN public.profili p ON p.id = u.profilo_id
LEFT JOIN auth.users   a ON lower(a.email) = lower(u.email)
ORDER BY u.created_at;
