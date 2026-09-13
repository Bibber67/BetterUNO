import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { Auth } from '../auth';

@Component({
  imports: [FormsModule],
  selector: 'app-new-game-component',
  styleUrl: './new-game-component.css',
  templateUrl: './new-game-component.html',
})
export class NewGameComponent {

  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly auth = inject(Auth);

  mode: 'bot' | 'local' = 'bot';

  botCount = 1;

  start(): void {

    const user = this.auth.user;

    /*
     * Wenn ein neues Spiel gestartet wird,
     * wird ein eventuell vorhandener alter Spielstand gelöscht.
     */
    if (user !== null) {
      this.storage.clearSavedGame(user.id);
    }

    void this.router.navigate(['/game'], {
      queryParams: {
        mode: this.mode,

        /*
         * Bei PvP gibt es keine Bots.
         */
        bots: this.mode === 'bot'
          ? this.botCount
          : 0
      }
    });
  }

  back(): void {
    void this.router.navigateByUrl('/home');
  }
}
