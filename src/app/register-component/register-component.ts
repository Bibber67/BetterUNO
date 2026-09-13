import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../auth';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-register-component',
  styleUrl: './register-component.css',
  templateUrl: './register-component.html',
})
export class RegisterComponent {
  auth = inject(Auth);
  router = inject(Router);

  username = '';
  password = '';
  confirm = '';
  error = '';

  async submit(): Promise<void> {
    this.error = '';

    if (this.password !== this.confirm) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    try {
      await this.auth.register(this.username.trim(), this.password);
      this.router.navigateByUrl('/home');
    } catch (error) {
      this.error = this.auth.getError(error);
    }
  }
}