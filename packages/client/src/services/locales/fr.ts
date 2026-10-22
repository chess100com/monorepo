export const fr = {
  nav: {
    home: 'Accueil',
    play: 'Jouer',
    rules: 'Règles',
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    language: 'Langue',
  },
  home: {
    title: 'Échecs sur 100 cases',
    lead:
      'Les échecs sur un échiquier <1>10×10</1> en trois variantes, chacune avec ses propres pièces nouvelles et ses règles spéciales.',
    intro:
      "L'échiquier plus vaste ouvre de nouvelles idées tactiques : plus d'espace pour manœuvrer, des diagonales plus longues, des attaques plus profondes. Les règles de base restent familières dans toutes les variantes : échec et mat, pat, triple répétition, règle des 50 coups et matériel insuffisant.",
    variantsTitle: 'Variantes',
    variantRulesLink: 'Règles →',
    variants: {
      heirs:
        "La variante d'origine avec deux nouvelles pièces : le Prince et la Princesse. La Princesse peut devenir Dame et, tant que le Prince est en vie, perdre le Roi ne termine pas la partie : l'héritier monte sur le trône.",
      grandchess:
        'Le classique de Christian Freeling (1984) : le Maréchal (Tour + Cavalier) et le Cardinal (Fou + Cavalier), les Tours dans les coins, les pions sur la troisième rangée et la promotion dès la huitième.',
      generals:
        "Le Général et le Bouffon, ainsi que la verticale Royale « e » : les pièces qui s'y trouvent deviennent plus fortes. Et aussi : le roque de pion et une récompense pour la marche du Roi jusqu'au trône adverse.",
    },
    features: {
      board: 'Échiquier 10×10 avec 10 pions et 10 pièces par camp.',
      online: 'Parties en ligne avec matchmaking et classement Elo.',
      bot: "Jouez contre l'ordinateur, sans inscription.",
    },
    ctaPlay: 'Jouer',
    ctaRules: 'Règles',
  },
  auth: {
    loginTitle: 'Connexion',
    registerTitle: 'Inscription',
    email: 'E-mail',
    password: 'Mot de passe',
    passwordHint: 'Mot de passe (au moins 6 caractères)',
    name: "Nom d'utilisateur",
    namePattern: 'Lettres a-z, A-Z, chiffres 0-9, tiret et tiret bas',
    loginSubmit: 'Se connecter',
    loginSubmitting: 'Connexion…',
    registerSubmit: 'Créer un compte',
    registerSubmitting: 'Création…',
    noAccount: "Pas encore de compte ?",
    registerLink: 'Inscription',
    haveAccount: 'Déjà un compte ?',
    loginLink: 'Se connecter',
    loginFailed: 'Échec de la connexion',
    registrationFailed: "Échec de l'inscription",
    hydrationFailed: 'Échec du chargement de la session',
    forgotPasswordLink: 'Mot de passe oublié ?',
    forgotPasswordTitle: 'Réinitialiser le mot de passe',
    forgotPasswordSubmit: 'Envoyer le lien',
    forgotPasswordSubmitting: 'Envoi…',
    forgotPasswordSent: 'Si un compte existe pour cette adresse, nous avons envoyé un lien de réinitialisation. Vérifiez votre boîte de réception.',
  },
  lobby: {
    title: 'Salon',
    greeting: 'Bonjour, <1>{{username}}</1>',
    greetingWithRating: 'Bonjour, <1>{{username}}</1> — classement <3>{{rating}}</3>.',
    variantLabel: 'Variante :',
    inQueue: "Actuellement dans la file : <1>{{count}}</1>",
    searching: "Recherche d'un adversaire…",
    cancel: 'Annuler',
    play: 'Jouer',
    leaderboardTitle: 'Top 20 — {{label}}',
    leaderboardEmpty: 'Vide pour le moment.',
    logout: 'Déconnexion',
    ongoingTitle: 'Vos parties en cours',
    ongoingVs: 'contre {{opponent}} ({{color}}, {{variant}})',
    ongoingUnknownOpponent: 'adversaire',
    tooManyGames: 'Vous avez déjà {{max}} parties en cours. Terminez-en quelques-unes avant d’en commencer une nouvelle.',
    guestTitle: 'Jouer',
    guestLead: "Vous n'êtes pas connecté. Choisissez comment vous voulez jouer :",
    guestHumansTitle: 'Contre des humains',
    guestHumansDesc: 'Créez un compte pour jouer des parties classées contre d’autres joueurs.',
    guestBotTitle: 'Contre l’ordinateur',
    guestBotDesc: 'Essayez chess100 contre une IA — aucune inscription requise.',
    playBotCta: 'Jouer contre l’ordinateur',
  },
  playBot: {
    title: 'Jouer contre l’ordinateur',
    intro: 'Choisissez un niveau et appuyez sur « Démarrer » pour commencer. La couleur est tirée au sort.',
    skillLabel: 'Niveau :',
    skill: {
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      expert: 'Expert',
    },
    playingAs: 'Vous jouez avec les <1>{{color}}</1>.',
    engineThinking: "L'ordinateur réfléchit…",
    loadingEngine: 'Chargement du moteur…',
    newGame: 'Nouvelle partie',
    start: 'Démarrer',
  },
  variants: {
    heirs: 'Héritiers',
    grandchess: 'Grand Échecs',
    generals: 'Généraux et Bouffons',
  },
  rules: {
    title: 'Règles',
    endgameTitle: 'Fins de partie',
    endgame: {
      checkmate: 'Échec et mat',
      stalemate: 'Pat',
      threefold: 'Triple répétition',
      fiftyMove: 'Règle des 50 coups',
      insufficient: 'Matériel insuffisant',
      resign: 'Abandon',
      agreement: 'Nulle par accord',
    },
    heirs: {
      boardTitle: 'Échiquier et disposition',
      board1:
        "La partie se joue sur un échiquier 10×10. Les colonnes sont désignées par les lettres <1>a b c d e f g h i k</1> (la lettre « j » est omise), et les rangées sont numérotées de 1 à 10. Chaque camp dispose de 10 pions et 10 pièces.",
      board2:
        'Rangée initiale (de la première à la dixième colonne) : Tour, Cavalier, Fou, <1>Prince</1>, Dame, Roi, <3>Princesse</3>, Fou, Cavalier, Tour. Les pions se placent sur la deuxième rangée (ou la neuvième pour les Noirs).',
      piecesTitle: 'Nouvelles pièces',
      princessTitle: 'Princesse (S)',
      princessDesc: "Se déplace et capture sur 1 ou 2 cases dans n'importe quelle des huit directions — comme le Roi, mais avec un rayon de deux.",
      princeTitle: 'Prince (C) — héritier du trône',
      princeDesc:
        "Se déplace comme la Princesse. Rôle particulier : tant qu'un Prince reste sur l'échiquier, la partie ne se termine pas même si le Roi est attaqué ou « capturé ». Au moment de la prise du Roi, le Prince se transforme en Roi et la partie se poursuit.",
      promotionTitle: 'La Princesse devient Dame',
      promotionDesc:
        "Si l'adversaire capture votre Dame et que vous avez une Princesse sur l'échiquier, celle-ci <1>se transforme en Dame</1>. Vous pouvez refuser la promotion — la Princesse reste alors Princesse jusqu'à la fin de la partie et perd le droit à la promotion.",
      pawnsTitle: 'Pions',
      pawnsDesc:
        "Le pion est promu sur la dernière rangée (la 10e pour les Blancs, la 1re pour les Noirs). Dans le client MVP, la promotion est effectuée automatiquement en Dame. Le compteur des 50 coups est réinitialisé aussi bien sur les coups de pion que sur les prises.",
      castlingTitle: 'Roque',
      castlingDesc:
        "Les deux roques sont pris en charge : le petit (vers la Princesse) et le grand (vers le Prince). Restrictions standard : les cases entre le Roi et la Tour sont vides, les cases que le Roi traverse ne sont pas attaquées et les pièces n'ont pas bougé auparavant.",
    },
    grandchess: {
      boardTitle: 'Échiquier et disposition',
      board1:
        'Variante inventée par Christian Freeling en 1984. Elle se joue sur le même échiquier 10×10 : colonnes <1>a b c d e f g h i k</1>, rangées de 1 à 10. Chaque camp dispose de 10 pions et 10 pièces.',
      board2:
        'Les Tours sont dans les coins (a1 et k1). Les autres pièces occupent la deuxième rangée de b à i : Cavalier, Fou, Dame, <1>Maréchal</1>, Roi, <3>Cardinal</3>, Fou, Cavalier ; a2 et k2 restent vides. Les pions remplissent toute la troisième rangée. Les Noirs ont la disposition symétrique sur les rangées 10, 9 et 8.',
      piecesTitle: 'Nouvelles pièces',
      marshalTitle: 'Maréchal (M)',
      marshalDesc:
        "Combine la Tour et le Cavalier : se déplace d'un nombre quelconque de cases sur une rangée ou une colonne, ou saute comme un Cavalier.",
      cardinalTitle: 'Cardinal (C)',
      cardinalDesc:
        "Combine le Fou et le Cavalier : se déplace d'un nombre quelconque de cases en diagonale, ou saute comme un Cavalier.",
      pawnsTitle: 'Pions',
      pawnsDesc:
        "Depuis sa rangée de départ (3e pour les Blancs, 8e pour les Noirs) un pion peut avancer d'une ou deux cases, puis d'une case à la fois. Il prend en diagonale vers l'avant. Il n'y a pas de prise en passant. Le compteur des 50 coups est réinitialisé sur les coups de pion et sur les prises.",
      promotionTitle: 'Promotion',
      promotionDesc:
        "En atteignant la 8e ou la 9e rangée (3e ou 2e pour les Noirs), un pion <1>peut</1> être promu ou rester pion. Sur la dernière rangée, la promotion est <3>obligatoire</3>. Un pion peut devenir Dame, Maréchal, Cardinal, Tour, Fou ou Cavalier. Dans le client actuel, la promotion n'a lieu que sur la dernière rangée et automatiquement en Dame.",
      castlingTitle: 'Roque',
      castlingDesc: "Il n'y a pas de roque dans les Grand Échecs.",
    },
    generals: {
      boardTitle: 'Échiquier et disposition',
      board1:
        'La partie se joue sur un échiquier 10×10 : colonnes <1>a b c d e f g h i k</1>, rangées de 1 à 10. Chaque camp dispose de 10 pions et 10 pièces.',
      board2:
        "Rangée initiale : Tour, Cavalier, Fou, <1>Bouffon</1>, Roi, Dame, <3>Général</3>, Fou, Cavalier, Tour. Le Roi est en e et la Dame en f ; par rapport aux échecs classiques, les ailes sont donc inversées : l'aile Roi est à gauche, l'aile Dame à droite. Les pions sont sur la 2e rangée (9e pour les Noirs).",
      royalTitle: 'La verticale Royale',
      royalDesc:
        "La colonne <1>e</1> est la verticale Royale ; elle est mise en évidence sur l'échiquier. Le Roi, le Général, le Bouffon et les pions qui s'y trouvent deviennent <3>forts</3> et gagnent des pouvoirs supplémentaires. Une pièce qui quitte la colonne redevient ordinaire et retrouve sa force en y revenant, autant de fois que l'on veut.",
      piecesTitle: 'Nouvelles pièces',
      generalTitle: 'Général (G)',
      generalDesc:
        "Se déplace et prend d'une ou deux cases sur une rangée ou une colonne ; il ne peut pas sauter par-dessus une pièce placée sur une case voisine. Il dispose aussi de coups « contournants » : une case en diagonale, à condition que les deux cases voisines sur la rangée et la colonne soient vides (par exemple e5–f6 si e6 et f5 sont libres). Depuis le centre de l'échiquier, il contrôle 12 cases.",
      generalStrong:
        '<1>Général fort</1> (sur la colonne e) : ses coups droits portent sur toute la rangée et toute la colonne, comme une Tour. Les coups contournants restent inchangés.',
      jesterTitle: 'Bouffon (C)',
      jesterDesc:
        "Se déplace et prend d'une ou deux cases en diagonale ; il ne peut pas sauter par-dessus les pièces. Il dispose aussi de coups « contournants » : deux cases en ligne droite sur une rangée ou une colonne, à condition que les deux cases diagonales dans cette direction soient vides (par exemple e5–e7 si d6 et f6 sont libres). Le Bouffon ne change jamais de couleur de cases ; depuis le centre de l'échiquier, il contrôle 12 cases.",
      jesterStrong:
        "<1>Bouffon fort</1> (sur la colonne e) : ses coups en diagonale traversent tout l'échiquier, comme un Fou. Les coups contournants restent inchangés.",
      kingTitle: 'Roi',
      kingStrong:
        "<1>Roi fort</1> (sur la colonne e) : se déplace et prend d'une ou deux cases dans n'importe quelle direction. Il ne peut pas sauter : pour un déplacement de deux cases, la case intermédiaire doit être vide.",
      kingThrone:
        "<1>Le trône.</1> Une fois par partie, lorsque le Roi atteint la case de départ du Roi adverse (e10 pour les Blancs, e1 pour les Noirs), son camp reçoit un pion supplémentaire, placé sur n'importe quelle case vide de sa propre rangée de pions (2e pour les Blancs, 9e pour les Noirs).",
      pawnsTitle: 'Pions',
      pawnsDesc:
        "Depuis la rangée de départ, un pion peut avancer d'une, deux ou trois cases, puis d'une case à la fois ; il prend en diagonale vers l'avant. La prise en passant est étendue : juste après l'avance longue d'un pion, l'adversaire peut le prendre non seulement avec un pion, mais avec n'importe quelle pièce qui se pose sur une case que le pion a franchie. Le compteur des 50 coups est réinitialisé sur les coups de pion et sur les prises.",
      royalPawn:
        "<1>Pion Royal.</1> Un pion sur la colonne e peut en plus reculer d'une case sur cette colonne et prendre d'une case en diagonale vers l'arrière. Dès qu'il quitte la colonne, il redevient un pion ordinaire.",
      promotionDesc:
        'Le pion est promu sur la dernière rangée en Dame, Tour, Fou ou Cavalier. Dans le client actuel, la promotion se fait automatiquement en Dame.',
      pawnCastlingTitle: 'Roque de pion',
      pawnCastlingDesc:
        "Un pion peut échanger sa place avec son propre Fou, Bouffon, Dame ou Roi situé une case en diagonale devant lui : le pion prend la case de la pièce et la pièce celle du pion, le tout en un seul coup. Le pion Royal peut aussi le faire en diagonale vers l'arrière. Le Général, la Tour et le Cavalier n'y participent pas, car ils ne se déplacent pas en diagonale. Le roque de pion peut être répété sans limite.",
      castlingTitle: 'Roque Royal',
      castlingDesc:
        "Comme le Roi part de e, le roque est différent. Petit roque (vers la colonne a) : le Roi va en b1 et la Tour de a1 en c1. Grand roque (vers la colonne k) : le Roi va en h1 et la Tour de k1 en g1 (pour les Noirs : b10/c10 et h10/g10). Restrictions habituelles : les cases entre le Roi et la Tour sont vides, les cases traversées par le Roi ne sont pas attaquées et aucune des deux pièces n'a bougé auparavant.",
    },
  },
  game: {
    invalidId: 'ID de partie invalide.',
    loading: 'Chargement de la partie…',
    connecting: 'Connexion à la partie…',
    errorTitle: 'Erreur',
    backToLobby: '← Retour au salon',
    opponent: 'adversaire',
    you: 'vous',
    white: 'blancs',
    black: 'noirs',
    colorLabel: '({{color}})',
    turn: 'Au trait : <1>{{color}}</1>',
    myTurn: ' — à vous de jouer',
    result: 'Résultat : {{result}}',
    movesTitle: 'Coups',
    offerDraw: 'Proposer nulle',
    resign: 'Abandonner',
    incomingDraw: "L'adversaire propose nulle.",
    accept: 'Accepter',
    decline: 'Refuser',
    outgoingDraw: 'Votre proposition de nulle a été envoyée.',
    status: {
      ongoing: 'Partie en cours',
      checkmate: 'Échec et mat',
      stalemate: 'Pat',
      threefold: 'Nulle — triple répétition',
      fiftyMove: 'Nulle — règle des 50 coups',
      insufficient: 'Nulle — matériel insuffisant',
      resignation: 'Abandon',
      agreement: 'Nulle par accord',
      timeout: 'Victoire au temps',
    },
  },
  profile: {
    rating: 'Classement',
    myGames: 'Mes parties',
    noGames: 'Aucune partie pour le moment.',
    loadMore: 'Charger plus',
    loadingMore: 'Chargement…',
    outcome: {
      win: 'Victoire',
      loss: 'Défaite',
      draw: 'Nulle',
      ongoing: 'En cours',
    },
  },
  common: {
    loadingAuth: 'Chargement…',
  },
} as const;
