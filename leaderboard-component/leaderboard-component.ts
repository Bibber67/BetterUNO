import { Component, inject } from '@angular/core';
import { LeaderboardEntry } from '../user';
import { Leaderboard } from '../leaderboard';

@Component({
  imports: [],
  selector: 'app-leaderboard-component',
  styleUrl: './leaderboard-component.css',
  templateUrl: './leaderboard-component.html',
})
export class LeaderboardComponent {
  private readonly lead = inject(Leaderboard);

  rows: LeaderboardEntry[] = [];
  loading = true;
  error = '';

  constructor() {
    void this.loadLeaderboard();
  }

  async loadLeaderboard(): Promise<void> {
    try {
      this.rows = await this.lead.getLeaderboard();
    } catch {
      this.error = 'Die Rangliste konnte nicht geladen werden.';
    } finally {
      this.loading = false;
    }
  }
}
