import { AuthStore } from './auth.js';
import { LobbyStore } from './lobby.js';
import { GameStore } from './game.js';
import { I18nStore } from './i18n.js';

export class RootStore {
  auth = new AuthStore();
  lobby = new LobbyStore();
  i18n = new I18nStore();
  game: GameStore;

  constructor() {
    this.game = new GameStore(() => this.auth.user?.username);
  }
}

export const rootStore = new RootStore();
