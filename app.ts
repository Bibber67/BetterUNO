import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from './auth';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('UNO');

  private readonly router = inject(Router);
  readonly auth = inject(Auth);

  constructor() {
    void this.auth.checkSession();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
