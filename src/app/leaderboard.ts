import { Injectable, inject } from '@angular/core';
import { LeaderboardEntry } from './user';
import { StorageService } from './services/storage.service';

@Injectable({ providedIn: 'root' })
export class Leaderboard {
  private readonly storage = inject(StorageService);

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const users = this.storage.getUsers();

    return users
      .sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }

        return a.username.localeCompare(b.username);
      })
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        wins: user.wins,
        hasSavedGame: user.hasSavedGame,
        rank: index + 1
      }));
  }
}
