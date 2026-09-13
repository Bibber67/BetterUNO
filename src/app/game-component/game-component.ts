import { Component } from '@angular/core';
import { GameService } from "../services/game.service"
import { DeckService } from "../services/deck.service"

@Component({
  imports: [],
  selector: 'app-game-component',
  styleUrl: './game-component.css',
  templateUrl: './game-component.html',
})

export class GameComponent {
  constructor(private deckService: DeckService) {}

  testDeck(): void {
  const deck = this.deckService.createDeck();
  const shuffledDeck = this.deckService.shuffleDeck(deck);
    console.log(shuffledDeck);
  console.log(deck);
  console.log('Anzahl Karten:', deck.length);
}
}
