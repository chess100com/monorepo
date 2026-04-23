import { makeAutoObservable, runInAction } from 'mobx';
import { apiFetch, HttpError } from '../api';
import { disconnectSocket } from '../socket';

export interface CurrentUser {
  username: string;
  email: string;
  rating: number;
}

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

export class AuthStore {
  status: AuthStatus = 'unknown';
  user: CurrentUser | null = null;
  error: string | null = null;
  pending = false;

  constructor() {
    makeAutoObservable(this);
  }

  async hydrate(): Promise<void> {
    this.pending = true;
    try {
      const me = await apiFetch<CurrentUser>('/my-info', { method: 'POST' });
      runInAction(() => {
        this.user = me;
        this.status = 'authenticated';
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        runInAction(() => {
          this.user = null;
          this.status = 'anonymous';
        });
        return;
      }
      runInAction(() => {
        this.status = 'anonymous';
        this.error = err instanceof Error ? err.message : 'Hydration failed';
      });
    } finally {
      runInAction(() => { this.pending = false; });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.pending = true;
    this.error = null;
    try {
      await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await this.hydrate();
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Login failed';
      });
      return false;
    } finally {
      runInAction(() => { this.pending = false; });
    }
  }

  async register(username: string, email: string, password: string): Promise<boolean> {
    this.pending = true;
    this.error = null;
    try {
      await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      return await this.login(email, password);
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Registration failed';
      });
      return false;
    } finally {
      runInAction(() => { this.pending = false; });
    }
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    this.pending = true;
    this.error = null;
    try {
      await apiFetch('/password/request-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Password reset failed';
      });
      return false;
    } finally {
      runInAction(() => { this.pending = false; });
    }
  }

  async logout(): Promise<void> {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      disconnectSocket();
      runInAction(() => {
        this.user = null;
        this.status = 'anonymous';
      });
    }
  }
}
