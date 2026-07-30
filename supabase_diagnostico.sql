-- ============================================================================
-- DIAGNOSTICA DEFINITIVA — le funzioni valutate con la TUA identità
--
-- Sola lettura sui dati: crea solo una funzione di appoggio.
--
-- PERCHÉ COSÌ
--   Il tentativo precedente usava due istruzioni separate: `set_config` non
--   sopravvive se l'editor le esegue in transazioni diverse. Dentro una
--   funzione plpgsql, invece, l'impostazione vale di sicuro per le righe
--   successive. Questo riproduce esattamente ciò che fa il database quando
--   decide se lasciarti eliminare una riga.
--
-- COME LEGGERLO
--   email_dal_token = 'chiesaloasi@gmail.com'  → le funzioni ti riconoscono
--   email_dal_token vuoto                      → `auth.jwt()` non arriva alle
--                                                funzioni: è questa la causa
--   scrittura_finanze / scrittura_chiese true  → il database ti lascia
--                                                eliminare, e il problema è
--                                                altrove
-- ============================================================================

CREATE OR REPLACE FUNCTION public.diagnostica_permessi(p_email TEXT)
RETURNS TABLE (
  email_dal_token   TEXT,
  livello_finanze   TEXT,
  lettura_finanze   BOOLEAN,
  scrittura_finanze BOOLEAN,
  livello_chiese    TEXT,
  scrittura_chiese  BOOLEAN,
  righe_in_utenti   BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- finge il token che PostgREST allega a ogni richiesta autenticata
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('email', p_email, 'role', 'authenticated')::text,
    true
  );

  RETURN QUERY
  SELECT
    auth.jwt() ->> 'email',
    public.mio_livello('Finanze'),
    public.puo_leggere('Finanze'),
    public.puo_scrivere('Finanze'),
    public.mio_livello('Chiese'),
    public.puo_scrivere('Chiese'),
    (SELECT count(*) FROM public.utenti);
END $$;

SELECT * FROM public.diagnostica_permessi('chiesaloasi@gmail.com');
