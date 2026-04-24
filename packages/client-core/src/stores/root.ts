import { AuthStore } from './auth';
import { LobbyStore } from './lobby';
import { GameStore } from './game';
import { I18nStore } from './i18n';

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
