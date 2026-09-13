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
    lead = inject(Leaderboard);

    rows: LeaderboardEntry[] = [];
    loading = true;
    error = '';

    constructor() {
        this.loadLeaderboard();
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