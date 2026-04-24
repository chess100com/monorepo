export { clientCoreConfig, configureClientCore } from './config';
export type { ClientCoreConfig } from './config';

export { apiFetch, HttpError } from './api';
export { getSocket, disconnectSocket } from './socket';

export { AuthStore } from './stores/auth';
export type { AuthStatus, CurrentUser } from './stores/auth';

export { GameStore } from './stores/game';
export type {
  ClockSnapshot,
  GameMetadata,
  GameStateSnapshot,
  MoveRecord,
  PlayerColor,
} from './stores/game';

export { LobbyStore, MAX_ONGOING_GAMES } from './stores/lobby';
export type { MatchedGame, QueueSizes, LeaderboardEntry, LeaderboardByType, OngoingGameSummary } from './stores/lobby';

export { I18nStore, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_LABELS } from './stores/i18n';
export type { Language, LanguageApplier } from './stores/i18n';

export { RootStore, rootStore } from './stores/root';
