import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../auth';

@Component({
  imports: [RouterLink],
  selector: 'app-home-component',
  styleUrl: './home-component.css',
  templateUrl: './home-component.html',
})
export class HomeComponent {
  readonly auth = inject(Auth);

  get userName(): string {
    return this.auth.user?.username ?? 'Spieler';
  }

  get wins(): number {
    return this.auth.user?.wins ?? 0;
  }
}
