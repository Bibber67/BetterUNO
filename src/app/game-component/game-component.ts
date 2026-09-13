import { Component } from '@angular/core';
import { GameService } from "../services/game.service"

@Component({
  imports: [],
  selector: 'app-game-component',
  styleUrl: './game-component.css',
  templateUrl: './game-component.html',
})
export class GameComponent {
  constructor(private gameService: GameService) {}
}
