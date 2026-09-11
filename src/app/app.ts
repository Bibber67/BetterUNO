import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('UNO');
  
  router = inject(Router);
  // auth = inject(Auth);

  // logout(): void {
  //   this.auth.logout().subscribe(() => {
  //     this.router.navigateByUrl("/login");
  //   })
  // }
}
