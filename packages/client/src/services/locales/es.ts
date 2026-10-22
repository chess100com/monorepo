export const es = {
  nav: {
    home: 'Inicio',
    play: 'Jugar',
    rules: 'Reglas',
    login: 'Entrar',
    register: 'Registrarse',
    logout: 'Salir',
    language: 'Idioma',
  },
  home: {
    title: 'Ajedrez de 100 casillas',
    lead:
      'Ajedrez en un tablero de <1>10×10</1> en tres variantes, cada una con sus propias piezas nuevas y reglas especiales.',
    intro:
      'El tablero más amplio abre nuevas ideas tácticas: más espacio para maniobrar, diagonales más largas y ataques más profundos. Las reglas básicas siguen siendo familiares en todas las variantes: jaque mate, ahogado, triple repetición, la regla de las 50 jugadas y material insuficiente.',
    variantsTitle: 'Variantes',
    variantRulesLink: 'Reglas →',
    variants: {
      heirs:
        'La variante original con dos piezas nuevas: el Príncipe y la Princesa. La Princesa puede convertirse en Dama y, mientras viva el Príncipe, perder al Rey no termina la partida: el heredero ocupa el trono.',
      grandchess:
        'El clásico de Christian Freeling de 1984: el Mariscal (Torre + Caballo) y el Cardenal (Alfil + Caballo), Torres en las esquinas, peones en la tercera fila y coronación a partir de la octava.',
      generals:
        'El General y el Bufón, y la vertical Real «e»: las piezas situadas en ella se vuelven más fuertes. Además: enroque de peón y una recompensa por la marcha del Rey hasta el trono rival.',
    },
    features: {
      board: 'Tablero de 10×10 con 10 peones y 10 piezas por bando.',
      online: 'Partidas en línea con emparejamiento y puntuación Elo.',
      bot: 'Juega contra el ordenador, sin necesidad de registrarte.',
    },
    ctaPlay: 'Jugar',
    ctaRules: 'Reglas',
  },
  auth: {
    loginTitle: 'Iniciar sesión',
    registerTitle: 'Crear cuenta',
    email: 'Email',
    password: 'Contraseña',
    passwordHint: 'Contraseña (mínimo 6 caracteres)',
    name: 'Nombre de usuario',
    namePattern: 'Letras a-z, A-Z, dígitos 0-9, guion y guion bajo',
    loginSubmit: 'Entrar',
    loginSubmitting: 'Entrando…',
    registerSubmit: 'Crear cuenta',
    registerSubmitting: 'Creando…',
    noAccount: '¿No tienes cuenta?',
    registerLink: 'Registrarse',
    haveAccount: '¿Ya tienes cuenta?',
    loginLink: 'Iniciar sesión',
    loginFailed: 'Error al iniciar sesión',
    registrationFailed: 'Error en el registro',
    hydrationFailed: 'Error al cargar la sesión',
    forgotPasswordLink: '¿Olvidaste tu contraseña?',
    forgotPasswordTitle: 'Restablecer contraseña',
    forgotPasswordSubmit: 'Enviar enlace',
    forgotPasswordSubmitting: 'Enviando…',
    forgotPasswordSent: 'Si existe una cuenta con este correo, hemos enviado un enlace de restablecimiento. Revisa tu bandeja de entrada.',
  },
  lobby: {
    title: 'Sala',
    greeting: 'Hola, <1>{{username}}</1>',
    greetingWithRating: 'Hola, <1>{{username}}</1> — puntuación <3>{{rating}}</3>.',
    variantLabel: 'Variante:',
    inQueue: 'En la cola ahora: <1>{{count}}</1>',
    searching: 'Buscando rival…',
    cancel: 'Cancelar',
    play: 'Jugar',
    leaderboardTitle: 'Top 20 — {{label}}',
    leaderboardEmpty: 'Aún no hay nadie.',
    logout: 'Salir',
    ongoingTitle: 'Tus partidas en curso',
    ongoingVs: 'vs {{opponent}} ({{color}}, {{variant}})',
    ongoingUnknownOpponent: 'rival',
    tooManyGames: 'Ya tienes {{max}} partidas en curso. Termina algunas antes de empezar otra.',
    guestTitle: 'Jugar',
    guestLead: 'No has iniciado sesión. Elige cómo quieres jugar:',
    guestHumansTitle: 'Contra humanos',
    guestHumansDesc: 'Crea una cuenta para jugar partidas clasificatorias contra otros jugadores.',
    guestBotTitle: 'Contra la computadora',
    guestBotDesc: 'Prueba chess100 contra un oponente de IA — sin registro.',
    playBotCta: 'Jugar contra la computadora',
  },
  playBot: {
    title: 'Jugar contra la computadora',
    intro: 'Elige un nivel y pulsa «Comenzar» para empezar. El color se elige al azar.',
    skillLabel: 'Nivel:',
    skill: {
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil',
      expert: 'Experto',
    },
    playingAs: 'Estás jugando con <1>{{color}}</1>.',
    engineThinking: 'La computadora está pensando…',
    loadingEngine: 'Cargando el motor…',
    newGame: 'Nueva partida',
    start: 'Comenzar',
  },
  variants: {
    heirs: 'Herederos',
    grandchess: 'Ajedrez Grande',
    generals: 'Generales y Bufones',
  },
  rules: {
    title: 'Reglas',
    endgameTitle: 'Finales',
    endgame: {
      checkmate: 'Jaque mate',
      stalemate: 'Ahogado',
      threefold: 'Triple repetición',
      fiftyMove: 'Regla de las 50 jugadas',
      insufficient: 'Material insuficiente',
      resign: 'Abandono',
      agreement: 'Tablas por acuerdo',
    },
    heirs: {
      boardTitle: 'Tablero y disposición',
      board1:
        'La partida se juega en un tablero de 10×10. Las columnas se designan con las letras <1>a b c d e f g h i k</1> (se omite la "j") y las filas con números del 1 al 10. Cada bando tiene 10 peones y 10 piezas.',
      board2:
        'Primera fila inicial (de la primera a la décima columna): Torre, Caballo, Alfil, <1>Príncipe</1>, Dama, Rey, <3>Princesa</3>, Alfil, Caballo, Torre. Los peones se sitúan en la segunda fila (o en la novena para las negras).',
      piecesTitle: 'Piezas nuevas',
      princessTitle: 'Princesa (S)',
      princessDesc: 'Se mueve y captura 1 o 2 casillas en cualquiera de las ocho direcciones — como el Rey, pero con radio dos.',
      princeTitle: 'Príncipe (C) — heredero al trono',
      princeDesc:
        'Se mueve igual que la Princesa. Papel especial: mientras quede un Príncipe en el tablero, la partida no termina aunque el Rey sea atacado o "capturado". En el momento de la captura del Rey, el Príncipe se convierte en Rey y la partida continúa.',
      promotionTitle: 'La Princesa se convierte en Dama',
      promotionDesc:
        'Si el rival captura tu Dama y tienes una Princesa en el tablero, ella <1>se convierte en Dama</1>. Puedes rechazar la promoción — entonces la Princesa seguirá siendo Princesa hasta el final de la partida y perderá el derecho a promoverse.',
      pawnsTitle: 'Peones',
      pawnsDesc:
        'El peón corona en la última fila (10ª para las blancas, 1ª para las negras). En el cliente MVP, la coronación se realiza automáticamente a Dama. El contador de 50 jugadas se reinicia tanto con los movimientos de peón como con las capturas.',
      castlingTitle: 'Enroque',
      castlingDesc:
        'Se admiten ambos enroques: corto (hacia la Princesa) y largo (hacia el Príncipe). Restricciones estándar: las casillas entre el Rey y la Torre están vacías, las casillas que el Rey cruza no están atacadas y las piezas no se han movido antes.',
    },
    grandchess: {
      boardTitle: 'Tablero y disposición',
      board1:
        'Variante creada por Christian Freeling en 1984. Se juega en el mismo tablero de 10×10: columnas <1>a b c d e f g h i k</1>, filas del 1 al 10. Cada bando tiene 10 peones y 10 piezas.',
      board2:
        'Las Torres están en las esquinas (a1 y k1). El resto de piezas ocupa la segunda fila de b a i: Caballo, Alfil, Dama, <1>Mariscal</1>, Rey, <3>Cardenal</3>, Alfil, Caballo; a2 y k2 quedan vacías. Los peones ocupan toda la tercera fila. Las negras tienen una disposición simétrica en las filas 10, 9 y 8.',
      piecesTitle: 'Piezas nuevas',
      marshalTitle: 'Mariscal (M)',
      marshalDesc:
        'Combina la Torre y el Caballo: se mueve cualquier número de casillas por fila o columna, o salta como un Caballo.',
      cardinalTitle: 'Cardenal (C)',
      cardinalDesc:
        'Combina el Alfil y el Caballo: se mueve cualquier número de casillas en diagonal, o salta como un Caballo.',
      pawnsTitle: 'Peones',
      pawnsDesc:
        'Desde su fila inicial (3ª para las blancas, 8ª para las negras) un peón puede avanzar una o dos casillas; después, de una en una. Captura en diagonal hacia delante. No existe la captura al paso. El contador de 50 jugadas se reinicia con los movimientos de peón y con las capturas.',
      promotionTitle: 'Coronación',
      promotionDesc:
        'Al llegar a la 8ª o 9ª fila (3ª o 2ª para las negras) el peón <1>puede</1> coronar o seguir siendo peón. En la última fila la coronación es <3>obligatoria</3>. El peón puede convertirse en Dama, Mariscal, Cardenal, Torre, Alfil o Caballo. En el cliente actual la coronación solo ocurre en la última fila y automáticamente a Dama.',
      castlingTitle: 'Enroque',
      castlingDesc: 'En el Ajedrez Grande no hay enroque.',
    },
    generals: {
      boardTitle: 'Tablero y disposición',
      board1:
        'La partida se juega en un tablero de 10×10: columnas <1>a b c d e f g h i k</1>, filas del 1 al 10. Cada bando tiene 10 peones y 10 piezas.',
      board2:
        'Primera fila inicial: Torre, Caballo, Alfil, <1>Bufón</1>, Rey, Dama, <3>General</3>, Alfil, Caballo, Torre. El Rey está en la e y la Dama en la f, así que, frente al ajedrez clásico, los flancos se invierten: el flanco de Rey queda a la izquierda y el de Dama a la derecha. Los peones están en la 2ª fila (9ª para las negras).',
      royalTitle: 'La vertical Real',
      royalDesc:
        'La columna <1>e</1> es la vertical Real y aparece resaltada en el tablero. El Rey, el General, el Bufón y los peones situados en ella se vuelven <3>fuertes</3> y obtienen poderes adicionales. Una pieza que abandona la columna vuelve a ser normal y recupera su fuerza al regresar, tantas veces como quiera.',
      piecesTitle: 'Piezas nuevas',
      generalTitle: 'General (G)',
      generalDesc:
        'Se mueve y captura una o dos casillas por fila o columna; no puede saltar sobre una pieza situada en una casilla contigua. Además tiene movimientos «envolventes»: una casilla en diagonal, siempre que las dos casillas vecinas por fila y por columna estén vacías (por ejemplo, e5–f6 si e6 y f5 están libres). Desde el centro del tablero controla 12 casillas.',
      generalStrong:
        '<1>General fuerte</1> (en la columna e): sus movimientos rectos alcanzan toda la fila y la columna, como una Torre. Los movimientos envolventes no cambian.',
      jesterTitle: 'Bufón (C)',
      jesterDesc:
        'Se mueve y captura una o dos casillas en diagonal; no puede saltar piezas. Además tiene movimientos «envolventes»: dos casillas en línea recta por fila o columna, siempre que las dos casillas diagonales en esa dirección estén vacías (por ejemplo, e5–e7 si d6 y f6 están libres). El Bufón nunca cambia el color de sus casillas; desde el centro del tablero controla 12 casillas.',
      jesterStrong:
        '<1>Bufón fuerte</1> (en la columna e): sus movimientos diagonales recorren todo el tablero, como un Alfil. Los movimientos envolventes no cambian.',
      kingTitle: 'Rey',
      kingStrong:
        '<1>Rey fuerte</1> (en la columna e): se mueve y captura una o dos casillas en cualquier dirección. No puede saltar: para moverse dos casillas, la casilla intermedia debe estar vacía.',
      kingThrone:
        '<1>El trono.</1> Una vez por partida, cuando el Rey llega a la casilla inicial del Rey rival (e10 para las blancas, e1 para las negras), su bando recibe un peón adicional, que se coloca en cualquier casilla vacía de su propia fila de peones (2ª para las blancas, 9ª para las negras).',
      pawnsTitle: 'Peones',
      pawnsDesc:
        'Desde la fila inicial un peón puede avanzar una, dos o tres casillas; después, de una en una. Captura en diagonal hacia delante. La captura al paso es ampliada: justo después del avance largo de un peón, el rival puede capturarlo no solo con un peón, sino con cualquier pieza que se coloque en una casilla por la que pasó el peón. El contador de 50 jugadas se reinicia con los movimientos de peón y con las capturas.',
      royalPawn:
        '<1>Peón Real.</1> Un peón en la columna e puede además retroceder una casilla por esa columna y capturar una casilla en diagonal hacia atrás. Al salir de la columna vuelve a ser un peón normal.',
      promotionDesc:
        'El peón corona en la última fila a Dama, Torre, Alfil o Caballo. En el cliente actual la coronación se realiza automáticamente a Dama.',
      pawnCastlingTitle: 'Enroque de peón',
      pawnCastlingDesc:
        'Un peón puede intercambiar su lugar con su propio Alfil, Bufón, Dama o Rey situado a una casilla en diagonal hacia delante: el peón ocupa la casilla de la pieza y la pieza la del peón, todo en una sola jugada. El peón Real también puede hacerlo en diagonal hacia atrás. El General, la Torre y el Caballo no participan, porque no se mueven en diagonal. El enroque de peón puede repetirse sin límite.',
      castlingTitle: 'Enroque Real',
      castlingDesc:
        'Como el Rey empieza en la e, el enroque es distinto. Corto (hacia la columna a): el Rey va a b1 y la Torre de a1 a c1. Largo (hacia la columna k): el Rey va a h1 y la Torre de k1 a g1 (para las negras, b10/c10 y h10/g10). Se aplican las restricciones habituales: las casillas entre el Rey y la Torre están vacías, las casillas que cruza el Rey no están atacadas y ninguna de las dos piezas se ha movido antes.',
    },
  },
  game: {
    invalidId: 'ID de partida inválido.',
    loading: 'Cargando la partida…',
    connecting: 'Conectando a la partida…',
    errorTitle: 'Error',
    backToLobby: '← Volver a la sala',
    opponent: 'rival',
    you: 'tú',
    white: 'blancas',
    black: 'negras',
    colorLabel: '({{color}})',
    turn: 'Juegan: <1>{{color}}</1>',
    myTurn: ' — te toca',
    result: 'Resultado: {{result}}',
    movesTitle: 'Jugadas',
    offerDraw: 'Ofrecer tablas',
    resign: 'Abandonar',
    incomingDraw: 'Tu rival ofrece tablas.',
    accept: 'Aceptar',
    decline: 'Rechazar',
    outgoingDraw: 'Tu oferta de tablas ha sido enviada.',
    status: {
      ongoing: 'Partida en curso',
      checkmate: 'Jaque mate',
      stalemate: 'Ahogado',
      threefold: 'Tablas — triple repetición',
      fiftyMove: 'Tablas — regla de las 50 jugadas',
      insufficient: 'Tablas — material insuficiente',
      resignation: 'Abandono',
      agreement: 'Tablas por acuerdo',
      timeout: 'Victoria por tiempo',
    },
  },
  profile: {
    rating: 'Elo',
    myGames: 'Mis partidas',
    noGames: 'Aún no hay partidas.',
    loadMore: 'Cargar más',
    loadingMore: 'Cargando…',
    outcome: {
      win: 'Victoria',
      loss: 'Derrota',
      draw: 'Tablas',
      ongoing: 'En curso',
    },
  },
  common: {
    loadingAuth: 'Cargando…',
  },
} as const;
