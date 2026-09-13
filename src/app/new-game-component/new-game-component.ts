import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  imports: [FormsModule],
  selector: 'app-new-game-component',
  styleUrl: './new-game-component.css',
  templateUrl: './new-game-component.html',
})
export class NewGameComponent {
    router = inject(Router);

    mode: 'bot' | 'local' = 'bot';
    botCount = 1;

    start(): void {
        this.router.navigate(['/game'], {
            queryParams: {
                mode: this.mode,
                bots: this.botCount
            }
        });
    }

    back(): void {
        this.router.navigateByUrl('/home');
    }
}

