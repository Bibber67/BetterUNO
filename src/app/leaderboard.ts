import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LeaderboardEntry } from './user';

@Injectable({ providedIn: 'root' })
export class Leaderboard {
    http = inject(HttpClient);

    async getLeaderboard(): Promise<LeaderboardEntry[]> {
        return await firstValueFrom(
            this.http.get<LeaderboardEntry[]>('/api/leaderboard')
        );
    }
}