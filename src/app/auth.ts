import { Injectable, inject } from '@angular/core';
import { User } from './user';
import { StorageService, StoredUser } from './services/storage.service';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly storage = inject(StorageService);

  user: User | null = null;
  sessionReady = false;

  async checkSession(): Promise<User | null> {
    this.user = this.storage.getCurrentUser();
    this.sessionReady = true;
    return this.user;
  }

  async register(username: string, password: string): Promise<User> {
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      throw new Error('Bitte gib einen Benutzernamen ein.');
    }

    if (!password) {
      throw new Error('Bitte gib ein Passwort ein.');
    }

    if (this.storage.getUserByUsername(cleanUsername) !== null) {
      throw new Error('Dieser Benutzername ist bereits vergeben.');
    }

    const user: User = {
      id: Date.now(),
      username: cleanUsername,
      wins: 0,
      hasSavedGame: false
    };

    const storedUser: StoredUser = {
      ...user,
      password
    };

    this.storage.addUser(storedUser);
    this.storage.saveCurrentUser(user);

    this.user = user;
    this.sessionReady = true;

    return user;
  }

  async login(username: string, password: string): Promise<User> {
    const cleanUsername = username.trim();
    const storedUser =
      this.storage.getUserByUsername(cleanUsername);

    if (storedUser === null) {
      throw new Error('Benutzername oder Passwort ist falsch.');
    }

    if (storedUser.password !== password) {
      throw new Error('Benutzername oder Passwort ist falsch.');
    }

    const user: User = {
      id: storedUser.id,
      username: storedUser.username,
      wins: storedUser.wins,
      hasSavedGame: storedUser.hasSavedGame
    };

    this.storage.saveCurrentUser(user);

    this.user = user;
    this.sessionReady = true;

    return user;
  }

  async logout(): Promise<void> {
    this.storage.clearCurrentUser();
    this.user = null;
    this.sessionReady = true;
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }

  getError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Anmeldung fehlgeschlagen.';
  }
}
