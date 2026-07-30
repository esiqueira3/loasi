-- ============================================================================
-- CHIUDE LE SCRITTURE ANONIME RIMASTE APERTE
--
-- Esegui nel SQL Editor di Supabase. È idempotente e non tocca i dati.
--
-- IL PROBLEMA
--   Su `diretoria` è sopravvissuta una policy "Escrita na diretoria" di tipo
--   ALL concessa al ruolo `public`: chiunque, con la sola chiave pubblica
--   presente nel codice del sito, poteva aggiungere, modificare o cancellare
--   i collaboratori delle comunità.
--   È sfuggita agli script precedenti perché li avevo scritti per rimuovere
--   policy con nomi noti, e questa aveva un nome diverso.
--
-- L'APPROCCIO, STAVOLTA
--   Non si va più per nome: si cerca QUALSIASI policy di scrittura concessa a
--   `public` o `anon`, su tutto lo schema, e la si rimuove. Le policy corrette
--   per gli utenti autenticati restano al loro posto.
--
-- COSA NON CAMBIA
--   La lettura pubblica: il sito deve continuare a mostrare indirizzi,
--   collaboratori, eventi e testimonianze ai visitatori.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout = '15s';

DO $$
DECLARE
  vittime  RECORD;
  elencate TEXT := '';
BEGIN
  -- L'elenco viene materializzato prima dei DROP: nessuna scansione del
  -- catalogo resta aperta durante il DDL (era la causa del deadlock).
  FOR vittime IN
    SELECT tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND cmd <> 'SELECT'                          -- la lettura pubblica resta
       AND (roles::text[] && ARRAY['public', 'anon'])
     ORDER BY tablename, policyname
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', vittime.policyname, vittime.tablename);
    elencate := elencate || vittime.tablename || '.' || vittime.policyname || '  ';
  END LOOP;

  IF elencate = '' THEN
    RAISE NOTICE 'Nessuna scrittura anonima trovata: era già tutto chiuso.';
  ELSE
    RAISE NOTICE 'Policy rimosse: %', elencate;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- CONTROLLO — deve restituire ZERO righe.
-- Ogni riga qui è una tabella che chiunque può ancora modificare.
-- ============================================================================

SELECT tablename  AS tabella,
       policyname AS policy,
       cmd        AS operazione,
       roles      AS ruoli
  FROM pg_policies
 WHERE schemaname = 'public'
   AND cmd <> 'SELECT'
   AND (roles::text[] && ARRAY['public', 'anon'])
 ORDER BY tablename, cmd;
