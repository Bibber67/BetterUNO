import {
  Component,
  OnInit
} from '@angular/core';

import { Card, CardColor } from '../models/card';
import { Game } from '../models/game';
import { Player } from '../models/player';

import { GameService } from '../services/game.service';

import { CardComponent } from './card/card';
import { PlayerHandComponent } from './player-hand/player-hand';
import { OpponentComponent } from './opponent/opponent';

@Component({
  selector: 'app-game-component',

  imports: [
    CardComponent,
    PlayerHandComponent,
    OpponentComponent
  ],

  templateUrl: './game-component.html',
  styleUrl: './game-component.css'
})
export class GameComponent implements OnInit {

  game: Game | null = null;

  player: Player | null = null;

  playableCards: Card[] = [];

  selectedWildCard: Card | null = null;

  errorMessage = '';

  constructor(
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    this.startGame();
  }

  startGame(): void {

    const players: Player[] = [
      {
        id: '1',
        username: 'Elias',
        hand: [],
        isBot: false
      },

      {
        id: '2',
        username: 'Bot 1',
        hand: [],
        isBot: true
      },

      {
        id: '3',
        username: 'Bot 2',
        hand: [],
        isBot: true
      }
    ];

    this.game =
      this.gameService.startGame(players);

    this.player =
      this.game.players[0];

    this.updatePlayableCards();

    this.errorMessage = '';
  }

  updatePlayableCards(): void {

    if (
      this.game === null ||
      this.player === null
    ) {
      this.playableCards = [];
      return;
    }

    this.playableCards =
      this.player.hand.filter(
        card => this.gameService.canPlayCard(card)
      );
  }

  onCardSelected(card: Card): void {

    this.errorMessage = '';

    if (
      this.game === null ||
      this.player === null
    ) {
      return;
    }

    if (
      this.game.players[
        this.game.currentPlayerIndex
      ].id !== this.player.id
    ) {
      this.errorMessage =
        'Du bist momentan nicht am Zug.';

      return;
    }

    if (!this.gameService.canPlayCard(card)) {
      this.errorMessage =
        'Diese Karte kann momentan nicht gespielt werden.';

      return;
    }

    if (card.color === 'wild') {

      this.selectedWildCard = card;

      return;
    }

    const success =
      this.gameService.playCard(card);

    if (!success) {

      this.errorMessage =
        'Die Karte konnte nicht gespielt werden.';

      return;
    }

    this.refreshGame();
  }

  chooseWildColor(color: CardColor): void {

    if (
      this.selectedWildCard === null
    ) {
      return;
    }

    if (
      color === 'wild'
    ) {
      return;
    }

    const success =
      this.gameService.playCard(
        this.selectedWildCard,
        color
      );

    if (!success) {

      this.errorMessage =
        'Die Wild-Karte konnte nicht gespielt werden.';

      return;
    }

    this.selectedWildCard = null;

    this.refreshGame();
  }

  cancelWildSelection(): void {
    this.selectedWildCard = null;
  }

  drawCard(): void {

    this.errorMessage = '';

    if (
      this.game === null ||
      this.player === null
    ) {
      return;
    }

    const currentPlayer =
      this.game.players[
        this.game.currentPlayerIndex
      ];

    if (
      currentPlayer.id !== this.player.id
    ) {
      this.errorMessage =
        'Du bist momentan nicht am Zug.';

      return;
    }

    const card =
      this.gameService.drawCard();

    if (card === null) {

      this.errorMessage =
        'Es konnte keine Karte gezogen werden.';

      return;
    }

    this.refreshGame();
  }

  refreshGame(): void {

    this.game =
      this.gameService.getCurrentGame();

    if (this.game === null) {

      this.player = null;
      this.playableCards = [];

      return;
    }

    this.player =
      this.game.players[0];

    this.updatePlayableCards();
  }

  get currentPlayer(): Player | null {

    if (this.game === null) {
      return null;
    }

    return this.game.players[
      this.game.currentPlayerIndex
    ];
  }

  get topCard(): Card | null {

    if (
      this.game === null ||
      this.game.discardPile.length === 0
    ) {
      return null;
    }

    return this.game.discardPile[
      this.game.discardPile.length - 1
    ];
  }

  get opponents(): Player[] {

    if (
      this.game === null
    ) {
      return [];
    }

    return this.game.players.filter(
      player => player.id !== this.player?.id
    );
  }

  get isMyTurn(): boolean {

    if (
      this.game === null ||
      this.player === null
    ) {
      return false;
    }

    return this.game.players[
      this.game.currentPlayerIndex
    ].id === this.player.id;
  }
}
