export const en = {
  nav: {
    home: 'Home',
    play: 'Play',
    rules: 'Rules',
    login: 'Sign in',
    register: 'Sign up',
    logout: 'Sign out',
    language: 'Language',
  },
  home: {
    title: '100-square Chess',
    lead: 'Chess on a <1>10×10</1> board in three variants — each with its own new pieces and special rules.',
    intro:
      'The roomier board opens up new tactical ideas: more room to maneuver, longer diagonals, deeper attacks. The core rules stay familiar in every variant — checkmate, stalemate, threefold repetition, the fifty-move rule and insufficient material.',
    variantsTitle: 'Variants',
    variantRulesLink: 'Rules →',
    variants: {
      heirs:
        'The original variant with two new pieces — the Prince and the Princess. The Princess can become a Queen, and while the Prince is alive, losing the King does not end the game: the heir takes the throne.',
      grandchess:
        "Christian Freeling's classic from 1984: the Marshal (Rook + Knight) and the Cardinal (Bishop + Knight), Rooks in the corners, pawns on the third rank and promotion starting from the eighth rank.",
      generals:
        'The General and the Jester, plus the Royal vertical "e": pieces standing on it grow stronger. Also: pawn castling and a reward for the King\'s march to the enemy throne.',
    },
    features: {
      board: '10×10 board with 10 pawns and 10 pieces per side.',
      online: 'Online matches via matchmaking and Elo rating.',
      bot: 'Play against the computer — no registration required.',
    },
    ctaPlay: 'Play',
    ctaRules: 'Rules',
  },
  auth: {
    loginTitle: 'Sign in',
    registerTitle: 'Sign up',
    email: 'Email',
    password: 'Password',
    passwordHint: 'Password (at least 6 characters)',
    name: 'Username',
    namePattern: 'Letters a-z, A-Z, digits 0-9, hyphen and underscore',
    loginSubmit: 'Sign in',
    loginSubmitting: 'Signing in…',
    registerSubmit: 'Create account',
    registerSubmitting: 'Creating…',
    noAccount: "Don't have an account?",
    registerLink: 'Sign up',
    haveAccount: 'Already have an account?',
    loginLink: 'Sign in',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',
    hydrationFailed: 'Hydration failed',
    forgotPasswordLink: 'Forgot your password?',
    forgotPasswordTitle: 'Reset password',
    forgotPasswordSubmit: 'Send reset link',
    forgotPasswordSubmitting: 'Sending…',
    forgotPasswordSent: 'If an account exists for this email, a reset link has been sent. Check your inbox.',
  },
  lobby: {
    title: 'Lobby',
    greeting: 'Hi, <1>{{username}}</1>',
    greetingWithRating: 'Hi, <1>{{username}}</1> — rating <3>{{rating}}</3>.',
    variantLabel: 'Variant:',
    inQueue: 'In queue now: <1>{{count}}</1>',
    searching: 'Looking for an opponent…',
    cancel: 'Cancel',
    play: 'Play',
    leaderboardTitle: 'Top 20 — {{label}}',
    leaderboardEmpty: 'Empty for now.',
    logout: 'Sign out',
    ongoingTitle: 'Your current games',
    ongoingVs: 'vs {{opponent}} ({{color}}, {{variant}})',
    ongoingUnknownOpponent: 'opponent',
    tooManyGames: 'You already have {{max}} ongoing games. Finish some of them before starting a new one.',
    guestTitle: 'Play',
    guestLead: "You're not signed in. Pick how you want to play:",
    guestHumansTitle: 'Play humans',
    guestHumansDesc: 'Create an account to play ranked matches against other players.',
    guestBotTitle: 'Play the computer',
    guestBotDesc: 'Try chess100 against an AI opponent — no registration required.',
    playBotCta: 'Play vs computer',
  },
  playBot: {
    title: 'Play vs computer',
    intro: 'Pick a level and press "Start" to begin. Color is chosen at random.',
    skillLabel: 'Skill level:',
    skill: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      expert: 'Expert',
    },
    playingAs: "You're playing <1>{{color}}</1>.",
    engineThinking: 'The computer is thinking…',
    loadingEngine: 'Loading engine…',
    newGame: 'New game',
    start: 'Start',
  },
  variants: {
    heirs: 'Heirs',
    grandchess: 'Grand Chess',
    generals: 'Generals & Jesters',
  },
  rules: {
    title: 'Rules',
    endgameTitle: 'Endings',
    endgame: {
      checkmate: 'Checkmate',
      stalemate: 'Stalemate',
      threefold: 'Threefold repetition',
      fiftyMove: 'Fifty-move rule',
      insufficient: 'Insufficient material',
      resign: 'Resignation',
      agreement: 'Draw by agreement',
    },
    heirs: {
      boardTitle: 'Board and setup',
      board1:
        'The game is played on a 10×10 board. Files are labelled <1>a b c d e f g h i k</1> (the letter "j" is skipped), ranks are numbered from 1 to 10. Each side has 10 pawns and 10 pieces.',
      board2:
        'Starting back rank (from the first to the tenth file): Rook, Knight, Bishop, <1>Prince</1>, Queen, King, <3>Princess</3>, Bishop, Knight, Rook. Pawns sit on the second rank (or the ninth for Black).',
      piecesTitle: 'New pieces',
      princessTitle: 'Princess (S)',
      princessDesc: 'Moves and captures 1 or 2 squares in any of the eight directions — like a King, but with radius two.',
      princeTitle: 'Prince (C) — heir to the throne',
      princeDesc:
        'Moves like the Princess. Special role: while a Prince remains on the board, the game does not end even if the King is attacked or "captured". When the King is captured, the Prince turns into a King and the game continues.',
      promotionTitle: 'Princess becomes a Queen',
      promotionDesc:
        'If the opponent captures your Queen while you have a Princess on the board, the Princess <1>is promoted to a Queen</1>. You may decline the promotion — then the Princess stays a Princess for the rest of the game and loses the right to be promoted.',
      pawnsTitle: 'Pawns',
      pawnsDesc:
        'A pawn promotes on the last rank (10 for White, 1 for Black). In the MVP client, promotion is performed automatically to a Queen. The fifty-move counter resets on both pawn moves and captures.',
      castlingTitle: 'Castling',
      castlingDesc:
        'Both sides of castling are supported: short (towards the Princess) and long (towards the Prince). Standard restrictions apply: squares between the King and Rook are empty, squares the King crosses are not under attack, and the pieces have not moved before.',
    },
    grandchess: {
      boardTitle: 'Board and setup',
      board1:
        'A variant invented by Christian Freeling in 1984. It is played on the same 10×10 board: files <1>a b c d e f g h i k</1>, ranks 1 to 10. Each side has 10 pawns and 10 pieces.',
      board2:
        'The Rooks stand in the corners (a1 and k1). The other pieces stand on the second rank from b to i: Knight, Bishop, Queen, <1>Marshal</1>, King, <3>Cardinal</3>, Bishop, Knight; a2 and k2 stay empty. Pawns fill the whole third rank. Black mirrors this on ranks 10, 9 and 8.',
      piecesTitle: 'New pieces',
      marshalTitle: 'Marshal (M)',
      marshalDesc:
        'Combines the Rook and the Knight: moves any number of squares along a rank or file, or jumps like a Knight.',
      cardinalTitle: 'Cardinal (C)',
      cardinalDesc:
        'Combines the Bishop and the Knight: moves any number of squares diagonally, or jumps like a Knight.',
      pawnsTitle: 'Pawns',
      pawnsDesc:
        'From its starting rank (3rd for White, 8th for Black) a pawn may advance one or two squares, afterwards one square at a time. It captures diagonally forward. There is no en passant. The fifty-move counter resets on both pawn moves and captures.',
      promotionTitle: 'Promotion',
      promotionDesc:
        'On reaching the 8th or 9th rank (3rd or 2nd for Black) a pawn <1>may</1> promote or stay a pawn. On the last rank promotion is <3>mandatory</3>. A pawn can become a Queen, Marshal, Cardinal, Rook, Bishop or Knight. In the current client, promotion happens only on the last rank and automatically to a Queen.',
      castlingTitle: 'Castling',
      castlingDesc: 'There is no castling in Grand Chess.',
    },
    generals: {
      boardTitle: 'Board and setup',
      board1:
        'The game is played on a 10×10 board: files <1>a b c d e f g h i k</1>, ranks 1 to 10. Each side has 10 pawns and 10 pieces.',
      board2:
        "Starting back rank: Rook, Knight, Bishop, <1>Jester</1>, King, Queen, <3>General</3>, Bishop, Knight, Rook. The King stands on e and the Queen on f, so compared with classical chess the flanks are swapped: the King's flank is on the left, the Queen's flank on the right. Pawns stand on the 2nd rank (9th for Black).",
      royalTitle: 'The Royal vertical',
      royalDesc:
        'The <1>e</1> file is the Royal vertical — it is highlighted on the board. The King, the General, the Jester and the pawns standing on it become <3>strong</3> and gain extra powers. A piece that leaves the file turns ordinary again and regains its strength when it comes back — any number of times.',
      piecesTitle: 'New pieces',
      generalTitle: 'General (G)',
      generalDesc:
        'Moves and captures one or two squares along a rank or file; it cannot jump over a piece on an adjacent square. It also has "circumventing" moves: one square diagonally, provided both neighbouring squares along the rank and the file are empty (e.g. e5–f6 if e6 and f5 are free). From the centre of the board it controls 12 squares.',
      generalStrong:
        '<1>Strong General</1> (on the e file): its straight moves reach across the whole rank and file, like a Rook. Circumventing moves stay the same.',
      jesterTitle: 'Jester (C)',
      jesterDesc:
        'Moves and captures one or two squares diagonally; it cannot jump over a piece. It also has "circumventing" moves: two squares straight along a rank or file, provided both diagonal squares in that direction are empty (e.g. e5–e7 if d6 and f6 are free). The Jester never changes the colour of its squares; from the centre of the board it controls 12 squares.',
      jesterStrong:
        '<1>Strong Jester</1> (on the e file): its diagonal moves reach across the whole board, like a Bishop. Circumventing moves stay the same.',
      kingTitle: 'King',
      kingStrong:
        '<1>Strong King</1> (on the e file) moves and captures one or two squares in any direction. It cannot jump: for a two-square move the square in between must be empty.',
      kingThrone:
        "<1>The throne.</1> Once per game, when the King reaches the opposing King's starting square (e10 for White, e1 for Black), its side gets an extra pawn, placed on any empty square of its own pawn rank (2nd for White, 9th for Black).",
      pawnsTitle: 'Pawns',
      pawnsDesc:
        "From the starting rank a pawn may advance one, two or three squares, then one square at a time; it captures diagonally forward. En passant is extended: right after a pawn's long move, the opponent may capture it not only with a pawn but with any piece that lands on a square the pawn passed over. The fifty-move counter resets on pawn moves and captures.",
      royalPawn:
        '<1>Royal pawn.</1> A pawn on the e file may also step one square backward along the file and capture one square diagonally backward. Once it leaves the file, it becomes an ordinary pawn again.',
      promotionDesc:
        'A pawn promotes on the last rank to a Queen, Rook, Bishop or Knight. In the current client, promotion happens automatically to a Queen.',
      pawnCastlingTitle: 'Pawn castling',
      pawnCastlingDesc:
        "A pawn may swap places with its own Bishop, Jester, Queen or King standing one square diagonally ahead: the pawn takes the piece's square and the piece takes the pawn's square, all in one move. A Royal pawn may also do this diagonally backward. The General, Rook and Knight cannot take part — they do not move diagonally. Pawn castling may be repeated any number of times.",
      castlingTitle: 'Royal castling',
      castlingDesc:
        'Since the King starts on e, castling looks different. Short (towards the a file): the King goes to b1 and the Rook from a1 to c1. Long (towards the k file): the King goes to h1 and the Rook from k1 to g1 (for Black — b10/c10 and h10/g10). Standard restrictions apply: the squares between King and Rook are empty, the squares the King crosses are not attacked, and neither piece has moved before.',
    },
  },
  game: {
    invalidId: 'Invalid game id.',
    loading: 'Loading the game…',
    connecting: 'Connecting to the game…',
    errorTitle: 'Error',
    backToLobby: '← Back to lobby',
    opponent: 'opponent',
    you: 'you',
    white: 'white',
    black: 'black',
    colorLabel: '({{color}})',
    turn: 'Turn: <1>{{color}}</1>',
    myTurn: ' — your move',
    result: 'Result: {{result}}',
    movesTitle: 'Moves',
    offerDraw: 'Offer draw',
    resign: 'Resign',
    incomingDraw: 'Your opponent offers a draw.',
    accept: 'Accept',
    decline: 'Decline',
    outgoingDraw: 'Your draw offer has been sent.',
    status: {
      ongoing: 'Game in progress',
      checkmate: 'Checkmate',
      stalemate: 'Stalemate',
      threefold: 'Draw — threefold repetition',
      fiftyMove: 'Draw — fifty-move rule',
      insufficient: 'Draw — insufficient material',
      resignation: 'Resignation',
      agreement: 'Draw by agreement',
      timeout: 'Win on time',
    },
  },
  profile: {
    rating: 'Rating',
    myGames: 'My games',
    noGames: 'No games yet.',
    loadMore: 'Load more',
    loadingMore: 'Loading…',
    outcome: {
      win: 'Win',
      loss: 'Loss',
      draw: 'Draw',
      ongoing: 'Ongoing',
    },
  },
  common: {
    loadingAuth: 'Loading…',
  },
} as const;
