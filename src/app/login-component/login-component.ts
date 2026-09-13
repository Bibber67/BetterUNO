import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../auth';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-login-component',
  styleUrl: './login-component.css',
  templateUrl: './login-component.html',
})

export class LoginComponent {
  auth = inject(Auth);
  router = inject(Router);

  username = '';
  password = '';
  error = '';

  async submit(): Promise<void> {
    this.error = '';

    try {
      await this.auth.login(this.username.trim(), this.password);
      this.router.navigateByUrl('/home');
    } catch (error) {
      this.error = this.auth.getError(error);
    }
  }
}