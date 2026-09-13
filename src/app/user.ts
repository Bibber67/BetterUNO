export interface User {
    id: number;
    username: string;
    wins: number;
    hasSavedGame?: boolean;
}

export interface LeaderboardEntry extends User {
    rank: number;
}
