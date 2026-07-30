/**
 * Contenuti reali del sito Chiesa Cristiana Evangelica L'Oasi.
 *
 * Questo file è la "fonte statica" del sito: viene usato così com'è quando
 * il database Supabase è vuoto e come fallback quando una sezione dinamica
 * (banner, eventi, testimonianze…) non ha ancora record pubblicati.
 * Il pastore potrà sovrascrivere qualsiasi voce dal gestionale.
 */

export const site = {
  name: "Chiesa Cristiana Evangelica L'Oasi",
  shortName: "L'Oasi",
  claim: 'Un luogo dove ricominciare',
  logo: '/images/logo-default-268x75.png',
  logoLight: '/images/logo-inverse-268x75.png',
  whatsapp: 'https://wa.link/1qw939',
  privacyUrl: '/privacy',
}

export const social = {
  facebook: 'https://www.facebook.com/chiesacristiana.pentecostaleoasilatina',
  instagram: 'https://www.instagram.com/chiesa.c.oasi.terracina/',
  youtube: 'https://www.youtube.com/@chiesecristianeloasilatina97',
  flickr: 'https://www.flickr.com/photos/chiesaloasi/albums/with/72177720324743732',
  podcast: 'https://www.youtube.com/playlist?list=PLramxZLCZG-qn5QMvfYLcJYvUQEQBVU8U',
}

/** Playlist "caricamenti" del canale: si aggiorna da sola, nessuna API key. */
export const youtubeUploadsPlaylist = 'UUXHU924zJjldbH7kiO-ooag'

export const navigation = [
  { label: 'Home', to: '/' },
  { label: 'Chi Siamo', to: '/chi-siamo' },
  { label: 'Fede', to: '/fede' },
  {
    label: 'Le Chiese',
    children: [
      { label: "L'Oasi Latina", to: '/chiese/latina' },
      { label: "L'Oasi Terracina", to: '/chiese/terracina' },
      { label: "L'Oasi Gaeta", to: '/chiese/gaeta' },
    ],
  },
  {
    label: 'Missione',
    children: [
      { label: 'Missione Argentina', to: '/missioni/argentina' },
      { label: 'Missione Cambogia', to: '/missioni/cambogia' },
    ],
  },
  { label: 'Media', href: social.flickr, external: true },
  { label: 'Eventi', to: '/#eventi' },
]

/* ------------------------------------------------------------------ */
/* Comunità                                                            */
/* ------------------------------------------------------------------ */

const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

export const churches = [
  {
    slug: 'terracina',
    city: 'Terracina',
    province: 'LT',
    name: "Chiesa Cristiana Evangelica L'Oasi",
    referente: 'Stefano Poldi',
    phone: '379 132 5360',
    phoneHref: 'tel:+393791325360',
    email: 'info.terracina@chieseloasi.it',
    address: 'Via Ponte di Ferro, 38 — 04019 Terracina (LT)',
    mapsUrl: maps('Via Ponte di Ferro 38, 04019 Terracina LT'),
    since: 1975,
    cover: '/images/home-3-610x458.jpg',
    hero: '/images/bg-about-terracina.jpg',
    gallery: [
      { thumb: '/images/terracina/piccolo/p-about-1.jpg', full: '/images/terracina/grande/g-about-1.jpg' },
      { thumb: '/images/terracina/piccolo/p-about-2.jpg', full: '/images/terracina/grande/g-about-2.jpg' },
      { thumb: '/images/terracina/piccolo/p-about-3.jpg', full: '/images/terracina/grande/g-about-3.jpg' },
    ],
  },
  {
    slug: 'latina',
    city: 'Latina',
    province: 'LT',
    name: "Chiesa Cristiana Evangelica L'Oasi",
    referente: 'Patrizia Ronga',
    phone: '327 188 6104',
    phoneHref: 'tel:+393271886104',
    email: 'info.latina@chieseloasi.it',
    address: 'Via Villafranca, 9M — 04100 Latina (LT)',
    mapsUrl: maps('Via Villafranca 9M, 04100 Latina LT'),
    since: 1950,
    cover: '/images/home-4-610x458.jpg',
    hero: '/images/bg-about-latina.jpg',
    gallery: [
      { thumb: '/images/latina/piccolo/p-about-1.jpg', full: '/images/latina/grande/g-about-1.jpg' },
      { thumb: '/images/latina/piccolo/p-about-2.jpg', full: '/images/latina/grande/g-about-2.jpg' },
      { thumb: '/images/latina/piccolo/p-about-3.jpg', full: '/images/latina/grande/g-about-3.jpg' },
    ],
  },
  {
    slug: 'gaeta',
    city: 'Gaeta',
    province: 'LT',
    name: "Chiesa Cristiana Evangelica L'Oasi",
    referente: 'Giovanna Smarrazzo',
    phone: '380 458 6031',
    phoneHref: 'tel:+393804586031',
    email: 'info.gaeta@chieseloasi.it',
    address: 'Lungomare Gaboto, Via Peschiera (Vico Orticello), 4 — 04024 Gaeta (LT)',
    mapsUrl: maps('Via Peschiera Vico Orticello 4, 04024 Gaeta LT'),
    cover: '/images/chiesa-gaeta.jpg',
    hero: '/images/chiesa-gaeta.jpg',
    gallery: [],
    inProgress: true,
  },
]

export const getChurch = (slug) => churches.find((c) => c.slug === slug)

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

export const heroSlides = [
  {
    image: '/images/slide-1.jpg',
    kicker: 'Latina · Terracina · Gaeta',
    title: 'Benvenuti alla Chiesa Cristiana L’Oasi',
    text: 'Il nostro scopo è predicare il Vangelo di Gesù Cristo. Perché nel nome di Gesù c’è la potenza che libera, guarisce e salva ancora oggi.',
    ctaLabel: 'Per saperne di più',
    ctaTo: '/chi-siamo',
  },
  {
    image: '/images/slide-2.jpg',
    kicker: 'La nostra visione',
    title: 'Condividere l’amore di Dio con tutti',
    text: 'Il nostro desiderio è condividere con gli altri l’amore di Dio, quell’amore che abbiamo conosciuto e che ha cambiato la nostra vita. Scoprire che Lui ha un piano per la nostra vita e desidera che ogni essere umano viva una vita benedetta e felice, arricchita dalla Sua presenza.',
    ctaLabel: 'Per saperne di più',
    ctaTo: '/chi-siamo',
  },
]

export const pillars = [
  {
    badge: 'Chiesa Cristiana Evangelica',
    title: 'La Missione',
    image: '/images/product-big-1-413x519.jpg',
    lead: 'La nostra missione è proclamare il Vangelo di Gesù Cristo insegnando e vivendo i principi biblici.',
    body: [
      "Desideriamo dare ai membri della nostra comunità gli strumenti per crescere nella fede, nella conoscenza e nel servizio, per essere discepoli di Cristo e per avere un impatto sul mondo con l'amore di Dio.",
      'Attraverso lo studio della Parola, la preghiera e il discepolato, cerchiamo di costruire una comunità di fede vivace e pertinente.',
    ],
    to: '/chi-siamo',
  },
  {
    badge: 'Chiesa Cristiana Evangelica',
    title: 'Chi Sono Gli Evangelici?',
    image: '/images/product-big-2-413x519.jpg',
    lead: 'In Italia la domanda è più che legittima: non tutti conoscono le radici e lo sviluppo di questo movimento cristiano.',
    body: [
      'Nel corso dei secoli, in modo diretto o indiretto, si è fatto di tutto per ostacolare il cammino degli evangelici o per metterli in cattiva luce, spacciandoli sempre e comunque come una setta pericolosa.',
    ],
    to: '/chi-siamo',
  },
  {
    badge: 'Chiesa Cristiana Evangelica',
    title: 'Principi Fondamentali Di Fede',
    image: '/images/product-big-3-413x519.jpg',
    lead: 'Noi crediamo ed accettiamo l’intera Bibbia come infallibile Parola di Dio, ispirata dallo Spirito Santo.',
    body: [
      'Sola e perfetta regola di fede della nostra condotta, alla quale nulla si può aggiungere o togliere. Crediamo che nessun testo di letteratura cristiana o teologica, nessuna tradizione orale e nessuna affermazione storica o leggendaria possa modificare la verità dichiarata dalla Bibbia.',
    ],
    to: '/fede',
  },
]

export const joinBlock = {
  image: '/images/bg-image-1.jpg',
  title: 'Unisciti alla nostra vivace comunità di fede',
  paragraphs: [
    "La chiesa de L'Oasi è composta da una comunità estremamente vivace, formata da persone di tutte le età e di tutti i ceti sociali. Siamo sempre lieti di accogliere nuovi membri.",
    "Siamo una comunità dedicata alla grazia salvifica di Cristo, al pentimento costante e alla professione pubblica dell'opera di Cristo, nonché alla presenza e al rafforzamento dello Spirito Santo.",
  ],
  signature: '/images/signature-2-230x78.png',
}

export const foundedBlock = {
  year: '1999',
  label: 'Attuale',
  pastor: 'Pr. Stefano Alla',
  moreUrl: 'https://www.flickr.com/photos/chiesaloasi/albums/72177720324751593/',
  gallery: [7, 9, 8, 10, 12, 14].map((n) => ({
    thumb: `/images/passato/grid-${n}.jpg`,
    full: `/images/passato/grande/grande-${n}.jpg`,
  })),
}

export const podcastBlock = {
  eyebrow: '«Rivelazione: dove la verità si rivela. Ascolta ora!»',
  title: 'PodCast — RivelAzione',
  slides: [
    { image: '/images/slide-podcast.jpg', href: social.podcast, label: 'Ascolta il podcast' },
    {
      image: '/images/slide-youtube.jpg',
      href: 'https://www.youtube.com/watch?v=R8UUtEZ_ofk&list=PLramxZLCZG-qn5QMvfYLcJYvUQEQBVU8U&index=2',
      label: 'Guarda l’ultimo episodio',
    },
  ],
}

export const youtubeBlock = {
  image: '/images/image-1-1010x608.jpg',
  title: 'Accedi al nostro canale YouTube',
  time: 'Ogni settimana un nuovo messaggio',
  text: 'Pillole di Fede · Predicazioni · Studi Biblici',
  href: social.youtube,
}

export const videoBlock = {
  video: '/video/video-1.mp4',
  poster: '/video/video-1.jpg',
  title: 'Partecipa al prossimo evento della chiesa',
  text: 'Ci vediamo ai prossimi servizi, sarà un onore accogliervi.',
}

/* ------------------------------------------------------------------ */
/* Testimonianze (fallback statico)                                    */
/* ------------------------------------------------------------------ */

export const testimonials = [
  {
    name: 'Martin Zuniga',
    photo: '/images/Martin-user-6-62x62.png',
    text: "Grazie Signore, per avermi guarito, perdonato e rinnovato in questo luogo! Tu Gesù mi hai aspettato con tanto amore! E mi hai dato una famiglia... La Famiglia dell'Oasi.",
  },
  {
    name: 'Eleonora Lemma',
    photo: '/images/Eleonora-user-6-62x62.png',
    text: 'Sono cresciuta in questa chiesa fin da bambina e ringrazio Dio per avermi dato una famiglia spirituale così importante e preziosa, ma ancora di più per avermi fatto conoscere il Suo amore, la Sua parola e una guida spirituale che mi aiuta a crescere ogni giorno nella fede.',
  },
  {
    name: 'Anna Castiello',
    photo: '/images/Anna-user-6-62x62.jpg',
    text: "Quando mi sono trasferita a Terracina non è stato facile sentirmi a mio agio in una chiesa evangelica. Ma una volta entrata nella chiesa L'Oasi di Terracina ho sentito subito l'amore e l'accoglienza che solo una famiglia ti sa dare. Una gioia negli occhi dei fratelli e delle sorelle mi ha contagiata e mi sono sentita subito a casa. Il Signore mi aveva guidato lì da loro e posso solo ringraziarlo per avermi dato questo privilegio. Gloria a Dio.",
  },
  {
    name: 'Grazia Caruso',
    photo: '/images/Caruso-user-6-62x62.png',
    text: 'Ho deciso di frequentare la chiesa Oasi di Terracina in primis perché credo fortemente nella realtà locale: adoperarsi e lavorare per la propria città credo sia una delle nostre missioni. In più, in questo contesto di chiesa, vivo pienamente la fratellanza, l’amore, l’unione e la condivisione... insomma, si vive in una grande famiglia!',
  },
  {
    name: 'Matteo Gaglione',
    photo: '/images/Matteo-user-6-62x62.png',
    text: 'Ho deciso di frequentare la chiesa Oasi di Terracina perché essere servo nella città in cui vivo è una forte chiamata ed esigenza che avverto. Il pastore è un uomo disposto all’ascolto, alla comprensione, e dà tutta la sua disponibilità investendo sulle persone che la compongono. Chiesa che si può sintetizzare nel termine "famiglia". Perché così ti senti: a casa.',
  },
]

/* ------------------------------------------------------------------ */
/* Eventi (fallback statico)                                           */
/* ------------------------------------------------------------------ */

export const fallbackEvents = [
  {
    id: 'ev-1',
    titulo: 'Gruppo Giovani del Venerdì',
    imagem_url: '/images/event-1-385x392.jpg',
    data_evento: '2025-04-11T16:00:00',
    hora: '16:00 — 18:00',
    local: 'Chiesa di Latina',
    descricao:
      'Il gruppo dei giovani della nostra chiesa è dedicato a mostrare Cristo ai ragazzi della nostra regione e oltre, condividendo il Vangelo in modo semplice e diretto.',
  },
  {
    id: 'ev-2',
    titulo: 'Evento con le Coppie',
    imagem_url: '/images/event-2-385x392.jpg',
    data_evento: '2025-05-25T15:00:00',
    hora: '15:00 — 17:00',
    local: 'Chiesa di Terracina',
    descricao:
      'Un incontro dedicato alle coppie: parleremo della vita di famiglia alla luce della Parola, con spazio per il confronto e la preghiera insieme.',
  },
  {
    id: 'ev-3',
    titulo: 'Perché i sermoni sono importanti?',
    imagem_url: '/images/event-3-385x392.jpg',
    data_evento: '2025-06-18T13:00:00',
    hora: '13:00 — 15:00',
    local: 'Chiesa di Terracina',
    descricao:
      'In questo incontro comunitario parleremo del motivo per cui predichiamo, evidenziando come la predicazione influenza la nostra vita quotidiana.',
  },
  {
    id: 'ev-4',
    titulo: 'Le relazioni nella vita cristiana',
    imagem_url: '/images/event-4-385x392.jpg',
    data_evento: '2025-07-16T12:00:00',
    hora: '12:00 — 14:00',
    local: 'Chiesa di Latina',
    descricao:
      'Un tempo di studio e dialogo sulle relazioni vissute secondo i principi biblici. Unitevi a noi per scoprire insieme questo importante passo.',
  },
]

/* ------------------------------------------------------------------ */
/* Chi siamo                                                           */
/* ------------------------------------------------------------------ */

export const about = {
  hero: '/images/About-bg-about.jpg',
  title: 'Chi Siamo',
  lead: 'Una chiesa che accoglie coloro che sono stati maltrattati dalla vita, che sono delusi da questa società, che sono feriti interiormente, o semplicemente coloro che capiscono che Dio esiste e ha uno scopo per la loro vita.',
  intro: [
    'La missione delle chiese L’Oasi nasce dalla visione di Stefano Alla che, insieme alla moglie Simona, nasce e cresce spiritualmente nella Chiesa Cristiana Evangelica L’Oasi di Terracina, condotta dal Pastore Romano Rossi.',
    'Dopo anni di servizio Stefano fu nominato anziano della chiesa e, per meglio svolgere il suo servizio, decise di iscriversi alla Facoltà Pentecostale laureandosi in Teologia.',
  ],
  missionTabs: [
    {
      title: 'La Missione',
      body: [
        'La nostra missione è proclamare il Vangelo di Gesù Cristo insegnando e vivendo i principi biblici.',
        "Desideriamo dare ai membri della nostra comunità gli strumenti per crescere nella fede, nella conoscenza e nel servizio, per essere discepoli di Cristo e per avere un impatto sul mondo con l'amore di Dio.",
        'Attraverso lo studio della Parola, la preghiera e il discepolato, cerchiamo di costruire una comunità di fede vivace e pertinente.',
      ],
    },
    {
      title: 'I nostri obiettivi',
      body: [
        "Il nostro obiettivo è essere uno strumento di trasformazione nella vita delle persone, consentendo loro di sperimentare l'amore e la grazia di Dio.",
        'Desideriamo vedere vite restaurate, famiglie rafforzate e comunità toccate dalla potenza del Vangelo.',
        'Attraverso l’insegnamento biblico, il servizio e il discepolato, cerchiamo di costruire una comunità di fede che rifletta il carattere di Cristo.',
      ],
    },
  ],
  timeline: [
    {
      year: '1999',
      title: "Le radici dell'Oasi",
      text: 'La storia della Chiesa L’Oasi inizia con Stefano Alla, cresciuto spiritualmente nella Chiesa Cristiana Evangelica L’Oasi di Terracina, guidata dal Pastore Romano Rossi. Fin da piccolo Stefano ha dimostrato una forte vocazione al servizio, dedicandosi alla comunità e crescendo nella fede.',
    },
    {
      year: '2018',
      title: 'Un nuovo capitolo a Latina',
      text: 'Nel giugno 2018 Stefano Alla inizia una collaborazione con la Chiesa Cristiana Evangelica di Latina, che sta attraversando un momento difficile a causa della scomparsa del pastore Antonio Svelto. Quello che era iniziato come un impegno temporaneo si trasformò presto in una missione permanente.',
    },
    {
      year: '2019',
      title: 'Ordinazione e inizio del cammino pastorale',
      text: "Nel gennaio 2019, con la benedizione del pastore Romano Rossi e della comunità di Terracina, Stefano Alla è stato ordinato pastore della Chiesa Cristiana Evangelica di Latina. Questo momento segna l'inizio del suo itinerario pastorale, guidando con dedizione e amore la comunità di Latina.",
    },
    {
      year: '2020',
      title: "L'espansione della visione e l'unità delle Chiese",
      text: "Nel giugno 2020 il pastore Romano Rossi ha invitato Stefano Alla ad assumere la guida della Chiesa L’Oasi di Terracina, la sua chiesa di origine. Nel settembre 2020 la chiesa di Terracina ha accolto la proposta, dando vita all'unione delle due comunità sotto la guida di Stefano. È nato così il progetto Chiese Cristiane Evangeliche L'Oasi.",
    },
    {
      year: '2025',
      title: '25° Anniversario — Una Chiesa per tutti',
      text: 'Si consolida la visione dell’Oasi, con la chiesa che diventa un "ospedale spirituale" che accoglie quanti sono stati maltrattati dalla vita, delusi dalla società o in cerca di uno scopo in Dio. La chiesa offre servizi di culto, studi biblici, gruppi di supporto ed eventi per tutte le età.',
    },
  ],
  story: [
    {
      title: 'Nel mese di giugno 2018',
      image: '/images/Insieme.jpg',
      body: [
        'Nel mese di giugno 2018, Stefano Alla cominciò a collaborare con la chiesa cristiana evangelica di Latina, la quale, a causa dell’improvvisa dipartita del Pastore Antonio Svelto, stava attraversando un momento particolare.',
        'Quello che doveva essere un impegno temporaneo divenne invece un impegno a tempo indeterminato. Infatti, nel gennaio 2019, con la benedizione del Pastore Romano Rossi e della comunità di Terracina, Stefano fu ordinato Pastore della chiesa cristiana evangelica di Latina.',
      ],
    },
    {
      title: 'Un nuovo pastore',
      image: '/images/Stefao-Alla.jpg',
      body: [
        'Ma i cambiamenti per Stefano non erano ancora finiti: nel mese di giugno 2020 il Pastore Romano Rossi gli chiese se aveva nel cuore il desiderio di prendersi cura anche della chiesa L’Oasi di Terracina. La richiesta era senz’altro impegnativa, ma come avrebbe potuto dire di no alla chiesa dove era nato e cresciuto?',
        'Fu così che nel settembre 2020 la chiesa L’Oasi di Terracina accettò la proposta del Pastore Romano Rossi di lasciare la responsabilità della chiesa al Pastore Stefano Alla.',
      ],
    },
    {
      title: 'Due chiese che camminano insieme',
      image: '/images/Insieme2.jpg',
      body: [
        'Fin da quel momento la visione è stata quella di avere due chiese che camminassero insieme, condividendo i talenti e lavorando coese per creare un progetto di chiesa improntato alla crescita spirituale dei credenti e proiettato verso l’esterno. Da qui nasce il progetto di Chiese Cristiane Evangeliche L’Oasi.',
        'In questa visione la chiesa è vista come un ospedale in grado di ricevere coloro che dalla vita sono stati maltrattati, che sono delusi da questa società, feriti interiormente, o semplicemente coloro che hanno capito che Dio esiste e ha un progetto, un proposito per ogni essere umano.',
      ],
    },
    {
      title: 'Esperienza reale con il Signore',
      image: '/images/Cantico.jpg',
      body: [
        'In quest’ottica si porta avanti una cura pastorale che ha come obiettivo quello di aiutare le persone a ricostruire la propria esistenza e a porre le basi per conoscere meglio il Dio di cui parla la Bibbia. Per coloro che fanno una reale esperienza con il Signore e decidono di seguire l’insegnamento di Gesù sul battesimo si apre la strada per una formazione di base che permette ad ogni credente di saper condividere la propria esperienza di fede attraverso lo studio della Parola di Dio.',
        'Ogni credente volenteroso ha la possibilità di aiutare il prossimo attraverso le associazioni di volontariato presenti nelle comunità, che hanno lo scopo di aiutare coloro che sono in difficoltà. Ogni attività svolta è portata avanti a titolo completamente gratuito, esclusivamente perché chi ha conosciuto l’amore di Dio non può rimanere indifferente vedendo la sofferenza del prossimo.',
      ],
    },
  ],
  familyProject: {
    title: 'Il progetto di una chiesa per la famiglia',
    lead: 'La visione dell’Oasi è quella di avere un impatto di amore sulle persone di ogni età, realizzando il progetto di una chiesa per la famiglia. Per questo abbiamo:',
    items: [
      { icon: 'church', text: 'Servizi di adorazione domenicali' },
      { icon: 'volunteer_activism', text: 'Servizi di preghiera' },
      { icon: 'diversity_3', text: 'Incontri specifici per bambini, adolescenti e donne' },
      {
        icon: 'menu_book',
        text: 'Corsi di discepolato per neofiti e per chi sente una chiamata a servire il Signore, per preparare ministri all’apertura di case di preghiera e di nuove comunità',
      },
    ],
  },
}

export const pastorFamily = [
  { name: 'Stefano Alla', role: 'Pastore Senior', photo: '/images/team-1-250x233.jpg' },
  { name: 'Simona Di Mario', role: 'Moglie', photo: '/images/team-11-250x233.jpg' },
  { name: 'Gioele Alla', role: 'Figlio', photo: '/images/team-10-250x233.jpg' },
  { name: 'Martina Alla', role: 'Figlia', photo: '/images/team-9-250x233.jpg' },
]

/* ------------------------------------------------------------------ */
/* Fede                                                                */
/* ------------------------------------------------------------------ */

export const faith = {
  hero: '/images/fe-bg-about.jpg',
  title: 'Principi Fondamentali di Fede',
  lead: "Fede: luce nell'oscurità, forza nella debolezza, speranza nell'impossibile.",
  source: "Fonte: Chiesa Cristiana Evangelica L'Oasi",
  principles: [
    {
      icon: 'menu_book',
      title: 'La Sacra Scrittura',
      text: 'Noi crediamo ed accettiamo l’intera Bibbia come infallibile Parola di Dio, ispirata dallo Spirito Santo, sola e perfetta regola di fede della nostra condotta, alla quale nulla si può aggiungere o togliere. Crediamo che nessun testo di letteratura cristiana o teologica, nessuna tradizione orale e nessuna affermazione storica e leggendaria possa modificare la verità dichiarata dalla Bibbia.',
    },
    {
      icon: 'auto_awesome',
      title: 'La Divinità Eterna',
      text: 'Noi crediamo nell’esistenza di un solo Dio, Eterno e di infinita potenza, uno nell’essenza e trino nelle persone; crediamo quindi che nella Sua unità vi siano tre distinte persone: il Padre, il Figlio e lo Spirito Santo. Crediamo che Gesù Cristo è il Figlio di Dio e che è l’Unico e perfetto Salvatore degli uomini.',
    },
    {
      icon: 'favorite',
      title: 'Il Piano di Redenzione',
      text: 'Crediamo che l’uomo sia stato creato ad immagine di Dio ma che, per volontaria disubbidienza, è caduto dalla purezza nella profondità del peccato. Crediamo che la salvezza si ottiene soltanto per grazia, mediante la fede in Gesù Cristo e indipendentemente dalle opere, e che deve essere preceduta da un genuino ravvedimento e dall’accettazione dell’opera compiuta dal Salvatore.',
    },
    {
      icon: 'water_drop',
      title: 'Il Battesimo in Acqua',
      text: 'Crediamo che il battesimo in acqua venga ministrato per immersione dopo l’esperienza della nuova nascita, solo a quelle persone che hanno avuto una vera conversione mediante il ravvedimento.',
    },
    {
      icon: 'local_fire_department',
      title: 'Il Battesimo nello Spirito Santo',
      text: 'Crediamo nell’esperienza personale del battesimo con lo Spirito Santo, con l’evidenza carismatica della glossolalia. Crediamo che tutti i ministeri ed i doni dello Spirito Santo elencati nelle Sacre Scritture siano per la chiesa di oggi e debbano essere ricercati.',
    },
    {
      icon: 'groups',
      title: 'Il Governo della Chiesa',
      text: 'Crediamo che la Chiesa debba essere guidata e governata da un consiglio di anziani, tra i quali un Pastore, e che la loro scelta debba venire da Dio ed essere confermata da ministri riconosciuti, con l’approvazione dell’Assemblea dei Fedeli.',
    },
    {
      icon: 'restaurant',
      title: 'La Santa Cena',
      text: 'Crediamo alla commemorazione e all’osservanza della Cena del Signore, con l’uso del pane e del vino; crediamo che questo comando sia un glorioso ponte che collega nel tempo il Calvario al ritorno del Signore, e che ricorda perennemente ai fedeli il sacrificio di Gesù sulla croce.',
    },
    {
      icon: 'wb_sunny',
      title: 'La Vita Cristiana Quotidiana',
      text: 'Crediamo che dopo una reale conversione del cuore e della vita, il credente sia spinto ad avere nuove aspirazioni e una nuova visione della vita presente e di quella futura, desiderando così di seguire e servire Gesù Cristo in novità di vita.',
    },
    {
      icon: 'campaign',
      title: 'L’Evangelizzazione',
      text: 'Crediamo nella necessità di evangelizzare i perduti di tutto il mondo; e poiché il ritorno personale e corporale del Signore Gesù è imminente, i redenti dal Signore devono diffondere il Vangelo per tutta la terra, secondo il comando del Maestro Cristo Gesù.',
    },
    {
      icon: 'healing',
      title: 'La Guarigione Divina',
      text: 'Crediamo nella guarigione divina del corpo, in risposta alla preghiera di fede, poiché essa è stata provveduta nel piano dell’espiazione da Cristo.',
    },
    {
      icon: 'volunteer_activism',
      title: 'Le Finanze',
      text: 'Crediamo che il metodo ordinato da Dio per il sostentamento dei suoi ministri e per la diffusione dell’Evangelo, secondo il comando di Gesù Cristo, sia il sistema delle offerte volontarie, e con le altre modalità stabilite dall’Assemblea dei Fedeli.',
    },
    {
      icon: 'balance',
      title: 'Il Giudizio Finale',
      text: 'Crediamo che i morti, piccoli e grandi, risusciteranno e compariranno insieme ai viventi davanti al tribunale di Dio per essere da Lui giudicati.',
    },
    {
      icon: 'brightness_high',
      title: 'Il Ritorno di Cristo',
      text: 'Crediamo al visibile ritorno del Signore Gesù e al regno eterno di Dio.',
    },
    {
      icon: 'account_balance',
      title: 'Il Governo Civile',
      text: 'Crediamo che il Governo civile sia di istituzione divina per l’interesse e il buon ordine della società, e crediamo che il dovere del cristiano sia quello di rispettare le autorità civili, quando queste non siano in palese contrasto con la Bibbia.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Storia delle singole comunità                                       */
/* ------------------------------------------------------------------ */

export const churchContent = {
  latina: {
    lead: [
      'La Chiesa Evangelica Pentecostale è nata a Latina agli inizi degli anni ’50 grazie all’opera di evangelizzazione portata avanti da due cari fratelli provenienti da Roma: Adriano Stella e Pasquale Borgese, ospitati in casa dalla famiglia di Lemma Vincenzo e Cullari Marina.',
      'Proprio in questa abitazione si organizzarono i primi servizi, dove si pregava insieme e insieme si leggeva la Parola di Dio. Tra i primi ad accettare il Vangelo di Gesù troviamo proprio Marina Cullari, ma col passare delle settimane molte anime si arresero all’amore di Cristo.',
    ],
    chapters: [
      {
        title: 'L’inaugurazione',
        body: [
          'In breve tempo nacque la prima Chiesa Evangelica Pentecostale a Latina, ubicata in Via Armellini, oggi Via Carturan: era il mese di settembre del 1950 quando venne fatta l’inaugurazione.',
          'Il primo responsabile della neonata Chiesa fu proprio Adriano Stella, coadiuvato da altri servi di Dio, tutti provenienti dalla chiesa del Pastore Roberto Bracco, uno dei grandi esponenti dell’evangelismo italiano.',
          'Nel 1955, come guida spirituale della comunità, fu nominato il Pastore Davide Praticò, che celebrò il primo matrimonio nel nuovo locale di culto tra Lemma Rocco e Giulia Chiariello: era il 1° gennaio 1957.',
        ],
      },
      {
        title: 'Un nuovo posto',
        body: [
          'La comunità continuò a crescere spiritualmente e numericamente e per questo motivo si rese necessario trovare un locale adatto alle esigenze della Chiesa. Nel maggio 1962 la Chiesa Evangelica Pentecostale si trasferì nel nuovo locale in via Marchiafava 5, messo a disposizione dai fratelli Lemma Rocco, Michele, Francesco e Giuseppe.',
          'Anche questo locale fu benedetto con un matrimonio, quello tra Lemma Michele e Dalia Angelina, celebrato dal Pastore Roberto Bracco il 9 luglio 1962.',
        ],
      },
      {
        title: 'La Fiorente Chiesa dell’Amore',
        body: [
          'Dopo il Pastore Davide Praticò, per un periodo di tempo la chiesa fu guidata dal Pastore Enrico Fragnito, fino al 1971, quando la chiamata al ministero cadde su Michele Lemma, che venne ordinato Pastore.',
          'Il Signore continuò a benedire la chiesa al punto che nel 1972 furono aperte anche due comunità nuove, una a Sabaudia e una a Priverno. I servizi si svolgevano il mercoledì, il venerdì e la domenica mattina nella comunità di Latina; il giovedì e la domenica pomeriggio a Sabaudia; il martedì e la domenica pomeriggio a Priverno.',
          'Nel 1974 nella città di Latina arrivò il gruppo missionario di "Cristo è la Risposta", guidato da Clark Stone: in quel periodo la Chiesa crebbe in maniera esponenziale e molti la chiamavano "la Fiorente Chiesa dell’Amore".',
        ],
      },
      {
        title: 'Sono passati 6 mesi, ma tutto è cambiato...',
        body: [
          'Negli anni ’80 la Chiesa fece una bella esperienza con dei credenti arrivati dalla Russia: ne arrivarono circa 600, ospitati in vari alberghi della città, e ogni giorno si svolgevano servizi di condivisione della Parola di Dio che tanto beneficio portarono alla Chiesa di Latina.',
          'Nel 2009 il Pastore Michele Lemma, considerata l’età avanzata, decise di lasciare la guida della chiesa e al suo posto fu ordinato Pastore della comunità Antonio Svelto, rimasto in carica fino al giugno 2018, quando inaspettatamente si addormentò nel Signore.',
          'La Chiesa passò un periodo particolarmente difficile, ma l’amore di Dio si è dimostrato ancora una volta reale e concreto e, grazie all’aiuto di Chiese limitrofe, la Chiesa di Latina ha continuato a svolgere i propri servizi. In quel periodo Stefano Alla, uno dei responsabili della Chiesa L’Oasi di Terracina, si rese disponibile ad aiutare la Chiesa per sei mesi. Passato il periodo fissato, la Chiesa di Latina chiese al Pastore Romano Rossi la possibilità di avere Stefano Alla come Pastore. Dopo un periodo di preghiera, il 18 gennaio 2019 la Chiesa Pentecostale di Latina ha celebrato l’ordinazione al ministero del Pastore Stefano Alla.',
        ],
      },
      {
        title: 'Chiesa Cristiana Evangelica L’Oasi di Latina',
        body: [
          'La Chiesa, che oggi ha assunto il nome di Chiesa Cristiana Evangelica L’Oasi di Latina, è grata a Dio per quest’opera meravigliosa nata nel 1950 e che ancora oggi ha la possibilità di proclamare che Gesù Cristo è il Signore.',
          'In tutti questi anni la Chiesa ha beneficiato del supporto dato da missionari e ministri di Dio come Roberto Bracco, Evaristo de Oliveira, i missionari Roger ed Elisabetta Koffi, il Pastore Luciano Crociani, il gruppo missionario di "Cristo è la Risposta", il Pastore Mario Romeo della Chiesa Hosanna di Catania, il Pastore Paolo Bellomia della Chiesa di Avola, il Pastore Cannavò, Rosario Di Palermo, il Pastore Paolo Giovannini, i responsabili della Chiesa di Via del Grano a Roma e quelli della chiesa Alfa e Omega di Roma, e molti altri ancora.',
        ],
      },
    ],
    team: [
      { name: 'Stefano Alla', role: 'Pastore', photo: '/images/team-1-250x233.jpg' },
      { name: 'Marco Lemma', role: 'Coordinatore della Corale e Tesoriere', photo: '/images/team-6-250x233.jpg' },
      { name: 'Marc Mankoussou', role: 'Coordinatore Gruppo di Preghiera', photo: '/images/team-xx-250x233.jpg' },
      { name: 'Daniela Fanton', role: 'Coordinatrice della Scuola Spirituale Bambini', photo: '/images/team-5-250x233.jpg' },
      { name: 'Michela Lemma', role: 'Coordinatrice Servizio d’Ordine', photo: '/images/team-25-250x233.jpg' },
      { name: 'Patrizia Ronga', role: 'Segreteria, Coordinatrice Gruppo Adolescenti e Giovani', photo: '/images/team-5-250x233.jpg' },
    ],
  },

  terracina: {
    lead: [
      'Correva l’anno 1975 quando un piccolo gruppo di credenti in Dio, guidati dallo Spirito Santo, si unirono per glorificare il Signore in spirito e verità, e in piena libertà.',
      'All’inizio tennero le riunioni nelle abitazioni ma, cominciando a crescere, fu necessario affittare un locale dove potersi riunire per celebrare l’Eterno con canti, preghiere, meditazioni e predicazione della Parola.',
    ],
    chapters: [
      {
        title: 'Storia della comunità',
        body: [
          'Correva l’anno 1975 quando un piccolo gruppo di credenti in Dio, guidati dallo Spirito Santo, si unirono per glorificare il Signore in spirito e verità, e in piena libertà. All’inizio tennero le riunioni nelle abitazioni ma, cominciando a crescere, fu necessario affittare un locale dove potersi riunire. Nello stesso anno Dio scelse e unse come suo servo il Pastore Romano Rossi.',
        ],
      },
      {
        title: 'Culti all’aperto',
        body: [
          'Il desiderio principale che si aveva nel cuore era di poter testimoniare ad altri l’opera di Dio, la Sua bontà, la Sua grazia. S’incominciò così a fare delle evangelizzazioni: culti all’aperto, riunioni con la tenda, manifestazioni nel Palazzetto dello Sport, incontri che videro la benedizione di Dio.',
        ],
      },
      {
        title: 'L’Oasi',
        body: [
          'Intanto fratelli missionari percorrevano l’Italia in lungo e in largo predicando e insegnando la Parola di Dio, e Terracina diventò per loro una meta fissa dove, come loro stessi affermavano, vi era un’oasi in cui potersi rifocillare.',
        ],
      },
      {
        title: 'Nasce una chiesa',
        body: [
          'Nell’anno 1996 la comunità, che continuava a crescere per la grazia di Dio, ritenne opportuno costituirsi in Associazione per acquistare un locale più grande dove tenere le riunioni: fu così che nacque la Chiesa Cristiana Evangelica "L’Oasi" di Terracina.',
        ],
      },
      {
        title: 'La chiesa è cresciuta',
        body: [
          'Circa due anni dopo la gloria di Dio, la Sua benedizione si manifestò ancora una volta rispondendo alle fervide preghiere innalzate dai credenti: diede la possibilità alla comunità, che fino a quel momento si riuniva in un locale di 35 mq, di acquistarne uno di 350 mq. Dopo un anno e mezzo di lavori, svolti per intero dai membri della comunità stessa, il 14 ottobre 2000 fu dedicato a Dio il nuovo locale di culto.',
        ],
      },
      {
        title: 'Un nuovo inizio',
        body: [
          'Dal settembre 2020 la chiesa, su indicazione del Pastore Romano Rossi, ha nominato come responsabile della comunità il Pastore Stefano Alla.',
          'Stefano Alla, insieme alla moglie Simona, si è convertito nel gennaio del 1994 proprio nella comunità del Pastore Rossi ed è lì cresciuto fino a essere nominato, nel gennaio del 2019, Pastore della Chiesa Cristiana Evangelica "L’Oasi" di Latina. Laureatosi nel 2013 alla Facoltà Pentecostale, agente di commercio, oggi il Pastore Stefano Alla cura entrambe le comunità che gli sono state affidate.',
        ],
      },
    ],
    team: [
      { name: 'Stefano Alla', role: 'Pastore', photo: '/images/team-1-250x233.jpg' },
      { name: 'Simona Di Mario', role: 'Coordinatrice delle Donne', photo: '/images/team-11-250x233.jpg' },
      { name: 'Stefano Poldi', role: 'Segreteria e Coordinatore Web', photo: '/images/team-12-250x233.jpg' },
      { name: 'Jonathan Adriani', role: 'Coordinatore Gruppo Adolescenti e Giovani, e del Gruppo di Evangelizzazione', photo: '/images/team-3-250x233.jpg' },
      { name: 'Luana Laugelli', role: 'Coordinatrice Gruppo Adolescenti e Giovani, e del Gruppo di Evangelizzazione', photo: '/images/team-5-250x233.jpg' },
      { name: 'Arsene Cristina', role: 'Coordinatrice Scuola Domenicale Bambini', photo: '/images/team-5-250x233.jpg' },
      { name: 'Stefano Di Mario', role: 'Coordinatore del Servizio d’Ordine', photo: '/images/team-6-250x233.jpg' },
      { name: 'Palmacci Gianluca', role: 'Coordinatore della Corale', photo: '/images/team-6-250x233.jpg' },
      { name: 'Gaetano Leone', role: 'Anziano e Tesoriere', photo: '/images/team-6-250x233.jpg' },
    ],
  },

  gaeta: {
    lead: [
      'La comunità di Gaeta è la più giovane delle Chiese L’Oasi. La pagina dedicata è in fase di preparazione: nel frattempo puoi contattarci per conoscere gli orari dei culti e le attività della settimana.',
    ],
    chapters: [],
    team: [],
  },
}

/* ------------------------------------------------------------------ */
/* Missioni                                                            */
/* ------------------------------------------------------------------ */

export const missionStats = [
  { value: '45', suffix: '%', label: 'Di tutti i bambini soffrono di crescita stentata a causa della malnutrizione' },
  { value: '1', suffix: 'MLN', label: "Di orfani a causa dell'AIDS" },
  { value: '10', suffix: '%', label: 'Di bambini di età inferiore ai 5 anni muore di fame' },
  { value: '500', suffix: 'MILA', label: 'Ogni anno migliaia di donne vengono abbandonate allo sfruttamento sessuale' },
]

export const missions = {
  argentina: {
    slug: 'argentina',
    title: 'Missione Argentina',
    year: '2002',
    hero: '/images/capa-argentina.jpg',
    cover: '/images/capa-argentina02.jpg',
    lead: 'Il giorno 22 gennaio 2002, con una piccola festa in Chiesa, si è conclusa l’iniziativa denominata "Missione Argentina".',
    body: [
      'Che cos’è questa iniziativa e come è nata? Tutto è cominciato all’inizio del mese di novembre, quando nella nostra comunità ricevemmo la visita del missionario Marcello Rodriguez, che da molti anni vive in Italia ma è di origine argentina.',
      'Marcello era di ritorno proprio dalla sua nazione, dove aveva trovato una situazione disastrosa causata dal crollo dell’economia nazionale. Come in tutte le storie di questo genere, chi soffre di più sono le zone periferiche della nazione, dove già normalmente c’è fame e disoccupazione: proprio nel nord, nella zona di Tucumán, si registrarono i primi decessi causati dalla denutrizione. Marcello ci fece vedere delle foto di bambini affamati e ci parlò di come, insieme ad altri missionari, stavano cercando di sostenere le zone più povere del paese.',
      'Fu così che i giovani della Chiesa si guardarono in faccia e decisero di cominciare a fare qualcosa per dare il proprio contributo a quest’opera. La prima cosa che pensammo di fare fu installare dei salvadanai dentro i negozi della provincia di Latina che acconsentirono all’iniziativa.',
      'Poi i ragazzi cominciarono a far emergere i loro talenti: iniziarono a creare lavori artigianali con legno, ceramica, dipinti e altro ancora. Tutto quello che veniva prodotto era portato nelle chiese vicine ma anche in piazza a Terracina, dandoci così la possibilità di offrire questi oggetti artigianali in cambio di una donazione.',
      'Tutto questo è durato circa due mesi, in cui i ragazzi si sono prodigati in maniera encomiabile, incontrandosi la sera per fare questi lavoretti, arrivando anche a fare nottate e poi andando a scuola o al lavoro il giorno dopo: vedendoli all’opera c’è veramente da essere orgogliosi di ragazzi così.',
      'Il 22 gennaio abbiamo concluso l’iniziativa, che ha portato l’Associazione a raccogliere la somma di € 9.500 (Gloria a Dio), più medicinali e abbigliamento. Il tutto è stato consegnato a due ragazzi che hanno avuto l’onore di portare personalmente in Argentina quanto raccolto.',
      'L’Associazione coglie l’occasione per ringraziare tutte le attività che hanno contribuito all’iniziativa, l’Associazione Calcio Città di Terracina e la Pallavolo Futura 92, che ci hanno ospitato nelle loro manifestazioni per promuovere l’iniziativa. Un grazie va anche alle chiese che ci hanno ospitato o che hanno comunque contribuito all’opera.',
    ],
    gallery: [1, 2, 3, 4, 5].map((n) => ({
      thumb: `/images/argentina/piccolo/p-argentina${n}.jpg`,
      full: `/images/argentina/grande/g-argentina${n}.jpg`,
    })),
    ctaTitle: 'Aiuta i bambini — Missione Argentina',
  },

  cambogia: {
    slug: 'cambogia',
    title: 'Missione Cambogia',
    year: '2004',
    hero: '/images/capa-cambogia.jpg',
    cover: '/images/capa-cambogia02.jpg',
    lead: 'La missione Cambogia è stata portata avanti dall’associazione di volontariato nel dicembre 2004, quando tutta la regione fu scossa da uno dei più potenti terremoti, seguito poi da uno tsunami.',
    body: [
      'Si stima che circa 250 mila persone siano morte a causa di questi due eventi, di cui il 25% bambini.',
      'Emanuela, un membro della nostra associazione, era in quelle zone per un progetto portato avanti in collaborazione con l’associazione Missione Possibile di Milano. L’associazione milanese, guidata da Gerry Testori, era da tempo impegnata presso Phnom Penh, capitale della Cambogia, dove vi era una discarica di immondizia in cui vivevano circa 560 famiglie.',
      'Quei giorni non furono facili per Emanuela, nel vedere bambini denutriti felici di aver trovato nell’immondizia un frutto marcio, e altri che mangiavano un cane morto: queste erano le condizioni dei bambini che tutto il giorno rovistavano nell’immondizia alla ricerca di qualcosa che potesse attenuare i morsi della fame.',
      'Il progetto di Missione Possibile era quello di costruire un piccolo villaggio nei pressi della discarica dove poter ospitare i bambini, in modo da toglierli di mezzo dalla spazzatura, offrendo loro cibo, cure mediche e istruzione. Per questo motivo, al ritorno di Emanuela e ricevuto da lei il resoconto del viaggio, demmo vita a un progetto per la raccolta fondi da destinare alla costruzione di questo villaggio salva-bimbi.',
      'Ci impegnammo per un anno a sostenere il progetto e contribuimmo con circa € 10.000 per la realizzazione del villaggio dei bambini. Ringraziamo Dio per averci dato la possibilità di contribuire a questo progetto e per aver protetto Emanuela, che avrebbe dovuto trovarsi in una delle zone colpite dallo tsunami ma che, per grazia di Dio, il giorno prima cambiò programma rimanendo nell’entroterra della regione.',
    ],
    gallery: [1, 2, 3, 4, 5].map((n) => ({
      thumb: `/images/cambogia/piccolo/p-cambogia${n}.jpg`,
      full: `/images/cambogia/grande/g-cambogia${n}.jpg`,
    })),
    ctaTitle: 'Aiuta i bambini — Missione Cambogia',
  },
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export const footerAbout = [
  'Correva l’anno 1975 quando un piccolo gruppo di credenti in Dio, guidati dallo Spirito Santo, si unirono per glorificare il Signore in spirito e verità, ed in piena libertà.',
  'All’inizio tennero le riunioni nelle abitazioni, ma cominciando a crescere, fu necessario affittare un locale dove potersi riunire per celebrare l’Eterno con canti, preghiere, meditazioni e predicazione della Parola.',
]
