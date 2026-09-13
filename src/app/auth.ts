import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from './user';

@Injectable({ providedIn: 'root' })
export class Auth {
    http = inject(HttpClient);

    user: User | null = null;
    sessionReady = false;

    async checkSession(): Promise<User | null> {
        try {
            const user = await firstValueFrom(
                this.http.get<User>('/api/user')
            );

            this.user = user;
            return user;
        } catch {
            this.user = null;
            return null;
        } finally {
            this.sessionReady = true;
        }
    }

    async register(username: string, password: string): Promise<User> {
        const user = await firstValueFrom(
            this.http.post<User>('/api/auth/register', {
                username,
                password
            })
        );

        this.user = user;
        this.sessionReady = true;

        return user;
    }

    async login(username: string, password: string): Promise<User> {
        const user = await firstValueFrom(
            this.http.post<User>('/api/auth/login', {
                username,
                password
            })
        );

        this.user = user;
        this.sessionReady = true;

        return user;
    }

    async logout(): Promise<void> {
        await firstValueFrom(
            this.http.post<void>('/api/auth/logout', {})
        );

        this.user = null;
    }

    isLoggedIn(): boolean {
        return this.user !== null;
    }

    getError(error: unknown): string {
        const response = error as HttpErrorResponse;

        if (response?.error?.message) {
            return response.error.message;
        }

        return 'Die API ist momentan nicht erreichbar.';
    }
}