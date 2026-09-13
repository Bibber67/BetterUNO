import { Injectable } from '@angular/core';
import { Card, CardColor } from '../models/card';
import { Game } from '../models/game';
import { Player } from '../models/player';
import { DeckService } from './deck.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private currentGame: Game | null = null;

  constructor(private deckService: DeckService) {}

  startGame(players: Player[]): Game {
    const game = this.createGame(players);
    this.currentGame = game;
    return game;
  }

  getCurrentGame(): Game | null {
    return this.currentGame;
  }

  getActiveGame(): Game {
    if (this.currentGame === null) {
      throw new Error('Es läuft momentan kein Spiel.');
    }

    return this.currentGame;
  }

  endGame(): void {
    this.currentGame = null;
  }

  createGame(players: Player[]): Game {
    const deck = this.deckService.createDeck();
    const shuffledDeck = this.deckService.shuffleDeck(deck);

    for (const player of players) {
      player.hand = [];

      for (let i = 0; i < 7; i++) {
        const card = shuffledDeck.pop();

        if (card) {
          player.hand.push(card);
        }
      }
    }

    const firstCard = shuffledDeck.pop();

    if (!firstCard) {
      throw new Error('Das Deck ist leer.');
    }

    const game: Game = {
      id: crypto.randomUUID(),
      players: players,
      drawPile: shuffledDeck,
      discardPile: [firstCard],
      currentPlayerIndex: 0,
      direction: 'clockwise',
      status: 'playing',
      currentColor: firstCard.color
    };

    return game;
  }

  getCurrentPlayer(): Player {
    const game = this.getActiveGame();

    return this.getCurrentPlayerInGame(game);
  }

  private getCurrentPlayerInGame(game: Game): Player {
    return game.players[game.currentPlayerIndex];
  }

  private nextPlayer(game: Game): void {
    if (game.direction === 'clockwise') {
      game.currentPlayerIndex =
        (game.currentPlayerIndex + 1) % game.players.length;
    } else {
      game.currentPlayerIndex =
        (game.currentPlayerIndex - 1 + game.players.length)
        % game.players.length;
    }
  }

  private hasCardOfColor(
    player: Player,
    color: CardColor
  ): boolean {
    return player.hand.some(
      card => card.color === color
    );
  }

  private checkGameFinished(game: Game): Player | null {
    const winner = game.players.find(
      player => player.hand.length === 0
    );

    if (winner) {
      game.status = 'finished';

      return winner;
    }

    return null;
  }

  canPlayCard(card: Card): boolean {
    const game = this.getActiveGame();

    return this.canPlayCardInGame(game, card);
  }

  private canPlayCardInGame(
    game: Game,
    card: Card
  ): boolean {
    const currentPlayer =
      this.getCurrentPlayerInGame(game);

    const topCard =
      game.discardPile[game.discardPile.length - 1];

    if (card.type === 'draw-four') {
      if (
        this.hasCardOfColor(
          currentPlayer,
          game.currentColor
        )
      ) {
        return false;
      }

      return true;
    }

    if (card.color === 'wild') {
      return true;
    }

    if (card.color === game.currentColor) {
      return true;
    }

    if (card.color === topCard.color) {
      return true;
    }

    if (card.type === topCard.type) {
      if (card.type === 'number') {
        return card.value === topCard.value;
      }

      return true;
    }

    return false;
  }

  playCard(
    card: Card,
    chosenColor?: CardColor
  ): boolean {
    const game = this.getActiveGame();

    return this.playCardInGame(
      game,
      card,
      chosenColor
    );
  }

  private playCardInGame(
    game: Game,
    card: Card,
    chosenColor?: CardColor
  ): boolean {
    const currentPlayer =
      this.getCurrentPlayerInGame(game);

    const cardIndex = currentPlayer.hand.findIndex(
      playerCard => playerCard.id === card.id
    );

    if (cardIndex === -1) {
      return false;
    }

    if (card.color === 'wild') {
      if (
        chosenColor === undefined ||
        chosenColor === 'wild'
      ) {
        return false;
      }
    }

    if (!this.canPlayCardInGame(game, card)) {
      return false;
    }

    currentPlayer.hand.splice(cardIndex, 1);

    game.discardPile.push(card);

    if (card.color === 'wild' && chosenColor) {
      game.currentColor = chosenColor;
    } else {
      game.currentColor = card.color;
    }

    const winner = this.checkGameFinished(game);

    if (winner) {
      return true;
    }

    if (card.type === 'reverse') {
      if (game.direction === 'clockwise') {
        game.direction = 'counter-clockwise';
      } else {
        game.direction = 'clockwise';
      }
    }

    this.nextPlayer(game);

    if (card.type === 'skip') {
      this.nextPlayer(game);
    }

    if (card.type === 'draw-two') {
      const nextPlayer =
        this.getCurrentPlayerInGame(game);

      this.drawCards(
        game,
        nextPlayer,
        2
      );

      this.nextPlayer(game);
    }

    if (card.type === 'draw-four') {
      const nextPlayer =
        this.getCurrentPlayerInGame(game);

      this.drawCards(
        game,
        nextPlayer,
        4
      );

      this.nextPlayer(game);
    }

    return true;
  }

  drawCard(): Card | null {
    const game = this.getActiveGame();

    return this.drawCardInGame(game);
  }
  endTurn(): void {

  const game = this.getCurrentGame();

  if (
    game === null ||
    game.status !== 'playing'
  ) {
    return;
  }

  this.nextPlayer(game);
}
  private drawCardInGame(game: Game): Card | null {
    const currentPlayer =
      this.getCurrentPlayerInGame(game);

    return this.drawCards(
      game,
      currentPlayer,
      1
    )[0] ?? null;
  }

  private drawCards(
    game: Game,
    player: Player,
    amount: number
  ): Card[] {
    const drawnCards: Card[] = [];

    for (let i = 0; i < amount; i++) {

      if (game.drawPile.length === 0) {
        this.refillDrawPile(game);
      }

      const card = game.drawPile.pop();

      if (!card) {
        break;
      }

      player.hand.push(card);
      drawnCards.push(card);
    }

    return drawnCards;
  }

  private refillDrawPile(game: Game): void {
    if (game.discardPile.length <= 1) {
      return;
    }

    const topCard =
      game.discardPile[
        game.discardPile.length - 1
      ];

    const cardsToRefill =
      game.discardPile.slice(0, -1);

    game.discardPile = [topCard];

    game.drawPile =
      this.deckService.shuffleDeck(cardsToRefill);
  }
}
