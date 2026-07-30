-- ============================================================================
-- DADOS REAIS DAS IGREJAS L'OASI
--
-- O `supabase_schema.sql` inseriu endereços/telefones de exemplo.
-- Rode este script no SQL Editor do Supabase para substituí-los pelos dados
-- reais. A partir daí o pastor edita tudo pelo gestionale — o site lê estes
-- campos e só cai no conteúdo estático quando o registro está vazio.
--
-- É seguro rodar mais de uma vez:
--   · igrejas       → ON CONFLICT DO UPDATE (horários já cadastrados são preservados)
--   · diretoria     → limpa e recria a lista de Latina/Terracina
--   · depoimentos   → só insere se a tabela estiver vazia
-- ============================================================================

-- 1. Corrige/insere as três comunidades ---------------------------------------

INSERT INTO public.igrejas (slug, nome, cidade, endereco, telefone, email, link_maps, horarios_culto, foto_capa_url)
VALUES
  (
    'terracina',
    'Chiesa Cristiana Evangelica L''Oasi — Terracina',
    'Terracina',
    'Via Ponte di Ferro, 38 — 04019 Terracina (LT)',
    '379 132 5360',
    'info.terracina@chieseloasi.it',
    'https://www.google.com/maps/search/?api=1&query=Via%20Ponte%20di%20Ferro%2038%2C%2004019%20Terracina%20LT',
    'Domenica: ore 17:30 | Giovedì: ore 19:30',
    '/images/home-3-610x458.jpg'
  ),
  (
    'latina',
    'Chiesa Cristiana Evangelica L''Oasi — Latina',
    'Latina',
    'Via Villafranca, 9M — 04100 Latina (LT)',
    '327 188 6104',
    'info.latina@chieseloasi.it',
    'https://www.google.com/maps/search/?api=1&query=Via%20Villafranca%209M%2C%2004100%20Latina%20LT',
    'Domenica: ore 10:30 | Mercoledì: ore 19:30',
    '/images/home-4-610x458.jpg'
  ),
  (
    'gaeta',
    'Chiesa Cristiana Evangelica L''Oasi — Gaeta',
    'Gaeta',
    'Lungomare Gaboto, Via Peschiera (Vico Orticello), 4 — 04024 Gaeta (LT)',
    '380 458 6031',
    'info.gaeta@chieseloasi.it',
    'https://www.google.com/maps/search/?api=1&query=Via%20Peschiera%20Vico%20Orticello%204%2C%2004024%20Gaeta%20LT',
    'Domenica: ore 18:00',
    '/images/chiesa-gaeta.jpg'
  )
ON CONFLICT (slug) DO UPDATE SET
  nome           = EXCLUDED.nome,
  cidade         = EXCLUDED.cidade,
  endereco       = EXCLUDED.endereco,
  telefone       = EXCLUDED.telefone,
  email          = EXCLUDED.email,
  link_maps      = EXCLUDED.link_maps,
  foto_capa_url  = EXCLUDED.foto_capa_url,
  -- mantém o horário já cadastrado (editado pelo gestionale) e só preenche se estiver vazio
  horarios_culto = COALESCE(igrejas.horarios_culto, EXCLUDED.horarios_culto),
  updated_at     = NOW();


-- 2. Diretoria / colaboradores (mesmos nomes publicados no site) --------------
--    O site usa estes registros quando existem; caso contrário mostra a lista
--    estática de `src/data/site.js`.

DELETE FROM public.diretoria
WHERE igreja_id IN (SELECT id FROM public.igrejas WHERE slug IN ('latina', 'terracina'));

INSERT INTO public.diretoria (igreja_id, nome, cargo, foto_url, ordem)
SELECT i.id, d.nome, d.cargo, d.foto_url, d.ordem
FROM public.igrejas i
JOIN (VALUES
  ('latina', 'Stefano Alla',     'Pastore',                                                   '/images/team-1-250x233.jpg',  1),
  ('latina', 'Marco Lemma',      'Coordinatore della Corale e Tesoriere',                      '/images/team-6-250x233.jpg',  2),
  ('latina', 'Marc Mankoussou',  'Coordinatore Gruppo di Preghiera',                           '/images/team-xx-250x233.jpg', 3),
  ('latina', 'Daniela Fanton',   'Coordinatrice della Scuola Spirituale Bambini',              '/images/team-5-250x233.jpg',  4),
  ('latina', 'Michela Lemma',    'Coordinatrice Servizio d''Ordine',                           '/images/team-25-250x233.jpg', 5),
  ('latina', 'Patrizia Ronga',   'Segreteria, Coordinatrice Gruppo Adolescenti e Giovani',     '/images/team-5-250x233.jpg',  6),

  ('terracina', 'Stefano Alla',      'Pastore',                                                '/images/team-1-250x233.jpg',  1),
  ('terracina', 'Simona Di Mario',   'Coordinatrice delle Donne',                              '/images/team-11-250x233.jpg', 2),
  ('terracina', 'Stefano Poldi',     'Segreteria e Coordinatore Web',                          '/images/team-12-250x233.jpg', 3),
  ('terracina', 'Jonathan Adriani',  'Coordinatore Gruppo Adolescenti e Giovani',              '/images/team-3-250x233.jpg',  4),
  ('terracina', 'Luana Laugelli',    'Coordinatrice Gruppo Adolescenti e Giovani',             '/images/team-5-250x233.jpg',  5),
  ('terracina', 'Arsene Cristina',   'Coordinatrice Scuola Domenicale Bambini',                '/images/team-5-250x233.jpg',  6),
  ('terracina', 'Stefano Di Mario',  'Coordinatore del Servizio d''Ordine',                    '/images/team-6-250x233.jpg',  7),
  ('terracina', 'Palmacci Gianluca', 'Coordinatore della Corale',                              '/images/team-6-250x233.jpg',  8),
  ('terracina', 'Gaetano Leone',     'Anziano e Tesoriere',                                    '/images/team-6-250x233.jpg',  9)
) AS d(slug, nome, cargo, foto_url, ordem) ON d.slug = i.slug;


-- 3. Depoimentos reais publicados no site -------------------------------------

INSERT INTO public.depoimentos (nome, cargo_ou_igreja, mensagem, foto_url, ativo)
SELECT * FROM (VALUES
  ('Martin Zuniga',   'Chiesa L''Oasi',            'Grazie Signore, per avermi guarito, perdonato e rinnovato in questo luogo! Tu Gesù mi hai aspettato con tanto amore! E mi hai dato una famiglia... La Famiglia dell''Oasi.', '/images/Martin-user-6-62x62.png', TRUE),
  ('Eleonora Lemma',  'Chiesa L''Oasi',            'Sono cresciuta in questa chiesa fin da bambina e ringrazio Dio per avermi dato una famiglia spirituale così importante e preziosa, ma ancora di più per avermi fatto conoscere il Suo amore, la Sua parola e una guida spirituale che mi aiuta a crescere ogni giorno nella fede.', '/images/Eleonora-user-6-62x62.png', TRUE),
  ('Anna Castiello',  'Chiesa L''Oasi Terracina',  'Quando mi sono trasferita a Terracina non è stato facile sentirmi a mio agio in una chiesa evangelica. Ma una volta entrata nella chiesa L''Oasi di Terracina ho sentito subito l''amore e l''accoglienza che solo una famiglia ti sa dare. Il Signore mi aveva guidato lì da loro e posso solo ringraziarlo per avermi dato questo privilegio. Gloria a Dio.', '/images/Anna-user-6-62x62.jpg', TRUE),
  ('Grazia Caruso',   'Chiesa L''Oasi Terracina',  'Ho deciso di frequentare la chiesa Oasi di Terracina in primis perché credo fortemente nella realtà locale: adoperarsi e lavorare per la propria città credo sia una delle nostre missioni. In più, in questo contesto di chiesa, vivo pienamente la fratellanza, l''amore, l''unione e la condivisione... insomma, si vive in una grande famiglia!', '/images/Caruso-user-6-62x62.png', TRUE),
  ('Matteo Gaglione', 'Chiesa L''Oasi Terracina',  'Ho deciso di frequentare la chiesa Oasi di Terracina perché essere servo nella città in cui vivo è una forte chiamata ed esigenza che avverto. Il pastore è un uomo disposto all''ascolto, alla comprensione, e dà tutta la sua disponibilità investendo sulle persone che la compongono.', '/images/Matteo-user-6-62x62.png', TRUE)
) AS t(nome, cargo_ou_igreja, mensagem, foto_url, ativo)
WHERE NOT EXISTS (SELECT 1 FROM public.depoimentos);
