import { Injectable } from '@angular/core';
import { User } from '../user';

export interface StoredUser extends User {
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly usersKey = 'uno_users';
  private readonly currentUserKey = 'uno_current_user';

  getUsers(): StoredUser[] {
    const storedUsers = localStorage.getItem(this.usersKey);

    if (!storedUsers) {
      return [];
    }

    try {
      const users = JSON.parse(storedUsers);

      if (!Array.isArray(users)) {
        return [];
      }

      return users as StoredUser[];
    } catch {
      return [];
    }
  }

  saveUsers(users: StoredUser[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  addUser(user: StoredUser): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  getUserByUsername(username: string): StoredUser | null {
    const users = this.getUsers();
    const normalizedUsername = username.trim().toLowerCase();

    return users.find(
      user => user.username.toLowerCase() === normalizedUsername
    ) ?? null;
  }

  getUserById(id: number): StoredUser | null {
    return this.getUsers().find(user => user.id === id) ?? null;
  }

  saveCurrentUser(user: User): void {
    localStorage.setItem(
      this.currentUserKey,
      JSON.stringify(user)
    );
  }

  getCurrentUser(): User | null {
    const storedUser = localStorage.getItem(this.currentUserKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.currentUserKey);
  }

  updateUser(user: StoredUser): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(
      storedUser => storedUser.id === user.id
    );

    if (userIndex === -1) {
      return;
    }

    users[userIndex] = user;
    this.saveUsers(users);

    const currentUser = this.getCurrentUser();

    if (currentUser?.id === user.id) {
      this.saveCurrentUser({
        id: user.id,
        username: user.username,
        wins: user.wins,
        hasSavedGame: user.hasSavedGame
      });
    }
  }

  addWin(userId: number): void {
    const user = this.getUserById(userId);

    if (user === null) {
      return;
    }

    this.updateUser({
      ...user,
      wins: user.wins + 1
    });
  }
}
