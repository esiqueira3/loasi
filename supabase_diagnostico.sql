-- ============================================================================
-- DIAGNOSTICA — simula la valutazione delle policy con la TUA identità
--
-- Sola lettura: non modifica nulla.
-- I dati risultano corretti, quindi il problema è nella VALUTAZIONE a runtime.
-- Qui fingiamo il token di `chiesaloasi@gmail.com` e chiediamo alle funzioni
-- che cosa rispondono: è esattamente ciò che fa il database quando decide se
-- lasciarti eliminare una riga.
--
-- COME LEGGERLO
--   email_dal_token NULL → il token simulato non è arrivato alle funzioni:
--                          il test non è valido (l'editor ha usato più
--                          transazioni). Dimmelo e cambiamo approccio.
--   scrittura_finanze    → deve essere true. Se è false, il difetto è dentro
--                          `mio_livello` e lo correggo.
--   scrittura_chiese     → riguarda il menu e le pagine.
-- ============================================================================

SELECT set_config(
  'request.jwt.claims',
  '{"email":"chiesaloasi@gmail.com","role":"authenticated"}',
  true   -- valido solo per questa transazione
);

SELECT
  auth.jwt() ->> 'email'          AS email_dal_token,
  public.mio_livello('Finanze')   AS livello_finanze,
  public.puo_leggere('Finanze')   AS lettura_finanze,
  public.puo_scrivere('Finanze')  AS scrittura_finanze,
  public.mio_livello('Chiese')    AS livello_chiese,
  public.puo_scrivere('Chiese')   AS scrittura_chiese,
  (SELECT count(*) FROM public.utenti) AS righe_in_utenti;
