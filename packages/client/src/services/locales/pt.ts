export const pt = {
  nav: {
    home: 'Início',
    play: 'Jogar',
    rules: 'Regras',
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',
    language: 'Idioma',
  },
  home: {
    title: 'Xadrez de 100 casas',
    lead:
      'Xadrez num tabuleiro <1>10×10</1> em três variantes — cada uma com suas próprias peças novas e regras especiais.',
    intro:
      'O tabuleiro mais amplo abre novas ideias táticas: mais espaço para manobrar, diagonais mais longas, ataques mais profundos. As regras básicas continuam familiares em todas as variantes — xeque-mate, afogamento, tripla repetição, a regra dos 50 lances e material insuficiente.',
    variantsTitle: 'Variantes',
    variantRulesLink: 'Regras →',
    variants: {
      heirs:
        'A variante original, com duas peças novas — o Príncipe e a Princesa. A Princesa pode tornar-se Dama e, enquanto o Príncipe estiver vivo, perder o Rei não encerra a partida: o herdeiro assume o trono.',
      grandchess:
        'O clássico de Christian Freeling de 1984: o Marechal (Torre + Cavalo) e o Cardeal (Bispo + Cavalo), Torres nos cantos, peões na terceira fileira e promoção a partir da oitava.',
      generals:
        'O General e o Bobo, além da vertical Real "e": as peças sobre ela ficam mais fortes. E ainda: roque de peão e uma recompensa pela marcha do Rei até o trono adversário.',
    },
    features: {
      board: 'Tabuleiro 10×10 com 10 peões e 10 peças de cada lado.',
      online: 'Partidas online com matchmaking e rating Elo.',
      bot: 'Jogue contra o computador — sem cadastro.',
    },
    ctaPlay: 'Jogar',
    ctaRules: 'Regras',
  },
  auth: {
    loginTitle: 'Entrar',
    registerTitle: 'Cadastrar',
    email: 'Email',
    password: 'Senha',
    passwordHint: 'Senha (mínimo 6 caracteres)',
    name: 'Nome de usuário',
    namePattern: 'Letras a-z, A-Z, hífen e sublinhado',
    loginSubmit: 'Entrar',
    loginSubmitting: 'Entrando…',
    registerSubmit: 'Criar conta',
    registerSubmitting: 'Criando…',
    noAccount: 'Não tem uma conta?',
    registerLink: 'Cadastrar',
    haveAccount: 'Já tem uma conta?',
    loginLink: 'Entrar',
    loginFailed: 'Falha no login',
    registrationFailed: 'Falha no cadastro',
    hydrationFailed: 'Falha ao carregar a sessão',
    forgotPasswordLink: 'Esqueceu a senha?',
    forgotPasswordTitle: 'Redefinir senha',
    forgotPasswordSubmit: 'Enviar link',
    forgotPasswordSubmitting: 'Enviando…',
    forgotPasswordSent: 'Se existir uma conta para este e-mail, enviamos um link de redefinição. Verifique sua caixa de entrada.',
  },
  lobby: {
    title: 'Sala',
    greeting: 'Olá, <1>{{username}}</1>',
    greetingWithRating: 'Olá, <1>{{username}}</1> — rating <3>{{rating}}</3>.',
    variantLabel: 'Variante:',
    inQueue: 'Na fila agora: <1>{{count}}</1>',
    searching: 'Procurando adversário…',
    cancel: 'Cancelar',
    play: 'Jogar',
    leaderboardTitle: 'Top 20 — {{label}}',
    leaderboardEmpty: 'Vazio por enquanto.',
    logout: 'Sair',
    ongoingTitle: 'Seus jogos em andamento',
    ongoingVs: 'vs {{opponent}} ({{color}}, {{variant}})',
    ongoingUnknownOpponent: 'adversário',
    tooManyGames: 'Você já tem {{max}} jogos em andamento. Termine alguns antes de começar outro.',
    guestTitle: 'Jogar',
    guestLead: 'Você não está conectado. Escolha como quer jogar:',
    guestHumansTitle: 'Contra humanos',
    guestHumansDesc: 'Crie uma conta para jogar partidas ranqueadas contra outros jogadores.',
    guestBotTitle: 'Contra o computador',
    guestBotDesc: 'Experimente chess100 contra uma IA — sem cadastro.',
    playBotCta: 'Jogar contra o computador',
  },
  playBot: {
    title: 'Jogar contra o computador',
    intro: 'Escolha um nível e clique em «Começar» para iniciar. A cor é sorteada aleatoriamente.',
    skillLabel: 'Nível:',
    skill: {
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil',
      expert: 'Especialista',
    },
    playingAs: 'Você está jogando de <1>{{color}}</1>.',
    engineThinking: 'O computador está pensando…',
    loadingEngine: 'Carregando o motor…',
    newGame: 'Nova partida',
    start: 'Começar',
  },
  variants: {
    heirs: 'Herdeiros',
    grandchess: 'Xadrez Grande',
    generals: 'Generais e Bobos',
  },
  rules: {
    title: 'Regras',
    endgameTitle: 'Finais',
    endgame: {
      checkmate: 'Xeque-mate',
      stalemate: 'Afogamento',
      threefold: 'Tripla repetição',
      fiftyMove: 'Regra dos 50 lances',
      insufficient: 'Material insuficiente',
      resign: 'Desistência',
      agreement: 'Empate por acordo',
    },
    heirs: {
      boardTitle: 'Tabuleiro e disposição',
      board1:
        'A partida é disputada num tabuleiro 10×10. As colunas são marcadas pelas letras <1>a b c d e f g h i k</1> (a letra "j" é omitida), e as fileiras são numeradas de 1 a 10. Cada lado tem 10 peões e 10 peças.',
      board2:
        'Linha inicial (da primeira à décima coluna): Torre, Cavalo, Bispo, <1>Príncipe</1>, Dama, Rei, <3>Princesa</3>, Bispo, Cavalo, Torre. Os peões ficam na segunda fileira (ou na nona, para as pretas).',
      piecesTitle: 'Novas peças',
      princessTitle: 'Princesa (S)',
      princessDesc: 'Move-se e captura 1 ou 2 casas em qualquer uma das oito direções — como o Rei, mas com raio dois.',
      princeTitle: 'Príncipe (C) — herdeiro do trono',
      princeDesc:
        'Move-se igual à Princesa. Papel especial: enquanto houver um Príncipe no tabuleiro, a partida não termina, mesmo que o Rei seja atacado ou "capturado". No momento da captura do Rei, o Príncipe se transforma em Rei e a partida continua.',
      promotionTitle: 'A Princesa torna-se Dama',
      promotionDesc:
        'Se o adversário capturar sua Dama e você tiver uma Princesa no tabuleiro, ela <1>se transforma em Dama</1>. Você pode recusar a promoção — nesse caso a Princesa permanece Princesa até o fim da partida e perde o direito à promoção.',
      pawnsTitle: 'Peões',
      pawnsDesc:
        'O peão promove na última fileira (a 10ª para as brancas, a 1ª para as pretas). No cliente MVP, a promoção é feita automaticamente para Dama. O contador de 50 lances é reiniciado tanto em lances de peão quanto em capturas.',
      castlingTitle: 'Roque',
      castlingDesc:
        'Ambos os lados do roque são suportados: curto (em direção à Princesa) e longo (em direção ao Príncipe). Restrições padrão: as casas entre o Rei e a Torre estão vazias, as casas pelas quais o Rei passa não estão atacadas e as peças não foram movidas antes.',
    },
    grandchess: {
      boardTitle: 'Tabuleiro e disposição',
      board1:
        'Variante criada por Christian Freeling em 1984. É jogada no mesmo tabuleiro 10×10: colunas <1>a b c d e f g h i k</1>, fileiras de 1 a 10. Cada lado tem 10 peões e 10 peças.',
      board2:
        'As Torres ficam nos cantos (a1 e k1). As demais peças ficam na segunda fileira, de b a i: Cavalo, Bispo, Dama, <1>Marechal</1>, Rei, <3>Cardeal</3>, Bispo, Cavalo; a2 e k2 ficam vazias. Os peões ocupam toda a terceira fileira. As pretas têm disposição espelhada nas fileiras 10, 9 e 8.',
      piecesTitle: 'Novas peças',
      marshalTitle: 'Marechal (M)',
      marshalDesc:
        'Combina a Torre e o Cavalo: move-se qualquer número de casas por fileira ou coluna, ou salta como um Cavalo.',
      cardinalTitle: 'Cardeal (C)',
      cardinalDesc:
        'Combina o Bispo e o Cavalo: move-se qualquer número de casas na diagonal, ou salta como um Cavalo.',
      pawnsTitle: 'Peões',
      pawnsDesc:
        'Da sua fileira inicial (3ª para as brancas, 8ª para as pretas) o peão pode avançar uma ou duas casas; depois, uma casa por vez. Captura na diagonal para a frente. Não há captura en passant. O contador de 50 lances é reiniciado em lances de peão e em capturas.',
      promotionTitle: 'Promoção',
      promotionDesc:
        'Ao chegar à 8ª ou 9ª fileira (3ª ou 2ª para as pretas), o peão <1>pode</1> ser promovido ou continuar peão. Na última fileira a promoção é <3>obrigatória</3>. O peão pode tornar-se Dama, Marechal, Cardeal, Torre, Bispo ou Cavalo. No cliente atual, a promoção ocorre apenas na última fileira e automaticamente para Dama.',
      castlingTitle: 'Roque',
      castlingDesc: 'Não há roque no Xadrez Grande.',
    },
    generals: {
      boardTitle: 'Tabuleiro e disposição',
      board1:
        'A partida é disputada num tabuleiro 10×10: colunas <1>a b c d e f g h i k</1>, fileiras de 1 a 10. Cada lado tem 10 peões e 10 peças.',
      board2:
        'Linha inicial: Torre, Cavalo, Bispo, <1>Bobo</1>, Rei, Dama, <3>General</3>, Bispo, Cavalo, Torre. O Rei fica na coluna e e a Dama na f, por isso, em comparação com o xadrez clássico, as alas ficam invertidas: a ala do Rei à esquerda, a ala da Dama à direita. Os peões ficam na 2ª fileira (9ª para as pretas).',
      royalTitle: 'A vertical Real',
      royalDesc:
        'A coluna <1>e</1> é a vertical Real — ela aparece destacada no tabuleiro. O Rei, o General, o Bobo e os peões que estão nela tornam-se <3>fortes</3> e ganham poderes extras. Uma peça que sai da coluna volta a ser comum e recupera a força ao retornar — quantas vezes quiser.',
      piecesTitle: 'Novas peças',
      generalTitle: 'General (G)',
      generalDesc:
        'Move-se e captura uma ou duas casas por fileira ou coluna; não pode saltar sobre uma peça numa casa vizinha. Também tem lances "contornantes": uma casa na diagonal, desde que as duas casas vizinhas na fileira e na coluna estejam vazias (por exemplo, e5–f6 se e6 e f5 estiverem livres). Do centro do tabuleiro controla 12 casas.',
      generalStrong:
        '<1>General forte</1> (na coluna e): seus lances retos alcançam toda a fileira e a coluna, como uma Torre. Os lances contornantes não mudam.',
      jesterTitle: 'Bobo (C)',
      jesterDesc:
        'Move-se e captura uma ou duas casas na diagonal; não pode saltar sobre peças. Também tem lances "contornantes": duas casas em linha reta por fileira ou coluna, desde que as duas casas diagonais nessa direção estejam vazias (por exemplo, e5–e7 se d6 e f6 estiverem livres). O Bobo nunca muda a cor das suas casas; do centro do tabuleiro controla 12 casas.',
      jesterStrong:
        '<1>Bobo forte</1> (na coluna e): seus lances diagonais atravessam todo o tabuleiro, como um Bispo. Os lances contornantes não mudam.',
      kingTitle: 'Rei',
      kingStrong:
        '<1>Rei forte</1> (na coluna e): move-se e captura uma ou duas casas em qualquer direção. Não pode saltar: num lance de duas casas, a casa intermediária deve estar vazia.',
      kingThrone:
        '<1>O trono.</1> Uma vez por partida, quando o Rei chega à casa inicial do Rei adversário (e10 para as brancas, e1 para as pretas), seu lado recebe um peão extra, colocado em qualquer casa vazia da sua própria fileira de peões (2ª para as brancas, 9ª para as pretas).',
      pawnsTitle: 'Peões',
      pawnsDesc:
        'Da fileira inicial o peão pode avançar uma, duas ou três casas; depois, uma casa por vez. Captura na diagonal para a frente. O en passant é ampliado: logo após o avanço longo de um peão, o adversário pode capturá-lo não só com um peão, mas com qualquer peça que pare numa casa pela qual o peão passou. O contador de 50 lances é reiniciado em lances de peão e em capturas.',
      royalPawn:
        '<1>Peão Real.</1> Um peão na coluna e pode também recuar uma casa por essa coluna e capturar uma casa na diagonal para trás. Ao sair da coluna, volta a ser um peão comum.',
      promotionDesc:
        'O peão promove na última fileira para Dama, Torre, Bispo ou Cavalo. No cliente atual, a promoção é feita automaticamente para Dama.',
      pawnCastlingTitle: 'Roque de peão',
      pawnCastlingDesc:
        'Um peão pode trocar de lugar com seu próprio Bispo, Bobo, Dama ou Rei que esteja uma casa na diagonal à frente: o peão ocupa a casa da peça e a peça a casa do peão, tudo num único lance. O peão Real também pode fazer isso na diagonal para trás. O General, a Torre e o Cavalo não participam, pois não se movem na diagonal. O roque de peão pode ser repetido sem limite.',
      castlingTitle: 'Roque Real',
      castlingDesc:
        'Como o Rei começa na coluna e, o roque é diferente. Curto (em direção à coluna a): o Rei vai para b1 e a Torre de a1 para c1. Longo (em direção à coluna k): o Rei vai para h1 e a Torre de k1 para g1 (para as pretas — b10/c10 e h10/g10). Valem as restrições habituais: as casas entre o Rei e a Torre estão vazias, as casas que o Rei atravessa não estão atacadas e nenhuma das duas peças se moveu antes.',
    },
  },
  game: {
    invalidId: 'ID de partida inválido.',
    loading: 'Carregando a partida…',
    connecting: 'Conectando à partida…',
    errorTitle: 'Erro',
    backToLobby: '← Voltar à sala',
    opponent: 'adversário',
    you: 'você',
    white: 'brancas',
    black: 'pretas',
    colorLabel: '({{color}})',
    turn: 'Vez: <1>{{color}}</1>',
    myTurn: ' — sua vez',
    result: 'Resultado: {{result}}',
    movesTitle: 'Lances',
    offerDraw: 'Oferecer empate',
    resign: 'Desistir',
    incomingDraw: 'O adversário oferece empate.',
    accept: 'Aceitar',
    decline: 'Recusar',
    outgoingDraw: 'Sua oferta de empate foi enviada.',
    status: {
      ongoing: 'Partida em andamento',
      checkmate: 'Xeque-mate',
      stalemate: 'Afogamento',
      threefold: 'Empate — tripla repetição',
      fiftyMove: 'Empate — regra dos 50 lances',
      insufficient: 'Empate — material insuficiente',
      resignation: 'Desistência',
      agreement: 'Empate por acordo',
      timeout: 'Vitória no tempo',
    },
  },
  profile: {
    rating: 'Rating',
    myGames: 'Minhas partidas',
    noGames: 'Ainda não há partidas.',
    loadMore: 'Carregar mais',
    loadingMore: 'Carregando…',
    outcome: {
      win: 'Vitória',
      loss: 'Derrota',
      draw: 'Empate',
      ongoing: 'Em andamento',
    },
  },
  common: {
    loadingAuth: 'Carregando…',
  },
} as const;
