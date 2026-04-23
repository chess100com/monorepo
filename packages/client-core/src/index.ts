export { clientCoreConfig, configureClientCore } from './config.js';
export type { ClientCoreConfig } from './config.js';

export { apiFetch, HttpError } from './api.js';
export { getSocket, disconnectSocket } from './socket.js';

export { AuthStore } from './stores/auth.js';
export type { AuthStatus, CurrentUser } from './stores/auth.js';

export { GameStore } from './stores/game.js';
export type {
  ClockSnapshot,
  GameMetadata,
  GameStateSnapshot,
  MoveRecord,
  PlayerColor,
} from './stores/game.js';

export { LobbyStore, MAX_ONGOING_GAMES } from './stores/lobby.js';
export type { MatchedGame, QueueSizes, LeaderboardEntry, LeaderboardByType, OngoingGameSummary } from './stores/lobby.js';

export { I18nStore, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_LABELS } from './stores/i18n.js';
export type { Language, LanguageApplier } from './stores/i18n.js';

export { RootStore, rootStore } from './stores/root.js';
