import { Injectable } from '@angular/core';

import {
  Card,
  CardColor
} from '../models/card';

import { Player } from '../models/player';

import { GameService } from './game.service';

@Injectable({
  providedIn: 'root'
})
export class BotService {

  constructor(
    private gameService: GameService
  ) {}

  playBotTurn(): void {

    console.log(
      '[BOT SERVICE] ======================='
    );

    console.log(
      '[BOT SERVICE] playBotTurn() START'
    );

    const game =
      this.gameService.getCurrentGame();

    if (game === null) {

      console.error(
        '[BOT SERVICE] Kein Spiel vorhanden!'
      );

      return;
    }

    if (game.status !== 'playing') {

      console.log(
        '[BOT SERVICE] Spiel ist beendet.'
      );

      return;
    }

    const currentPlayer =
      game.players[
        game.currentPlayerIndex
      ];

    if (currentPlayer === undefined) {

      console.error(
        '[BOT SERVICE] Aktueller Spieler existiert nicht!'
      );

      return;
    }

    console.log(
      '[BOT SERVICE] Aktueller Spieler:',
      currentPlayer.username
    );

    console.log(
      '[BOT SERVICE] Ist Bot:',
      currentPlayer.isBot
    );

    console.log(
      '[BOT SERVICE] Karten:',
      currentPlayer.hand.length
    );

    if (!currentPlayer.isBot) {

      console.warn(
        '[BOT SERVICE] ABGEBROCHEN: Spieler ist kein Bot.'
      );

      return;
    }

    /*
     * Nach spielbarer Karte suchen.
     */
    console.log(
      '[BOT SERVICE] Suche spielbare Karte...'
    );

    const playableCard =
      this.findPlayableCard(currentPlayer);

    if (playableCard !== null) {

      console.log(
        '[BOT SERVICE] Gefunden:',
        playableCard.id,
        '|',
        playableCard.type,
        '|',
        playableCard.color
      );

      this.playCard(
        playableCard,
        currentPlayer
      );

      console.log(
        '[BOT SERVICE] Karte gespielt.'
      );

      console.log(
        '[BOT SERVICE] playBotTurn() ENDE'
      );

      return;
    }

    /*
     * Keine spielbare Karte.
     */
    console.log(
      '[BOT SERVICE] Keine spielbare Karte.'
    );

    console.log(
      '[BOT SERVICE] Bot zieht eine Karte.'
    );

    const drawnCard =
      this.gameService.drawCard();

    if (drawnCard === null) {

      console.warn(
        '[BOT SERVICE] Keine Karte konnte gezogen werden.'
      );

      console.log(
        '[BOT SERVICE] Beende Bot-Zug.'
      );

      this.gameService.endTurn();

      console.log(
        '[BOT SERVICE] playBotTurn() ENDE'
      );

      return;
    }

    console.log(
      '[BOT SERVICE] Gezogene Karte:',
      drawnCard.id,
      '|',
      drawnCard.type,
      '|',
      drawnCard.color
    );

    /*
     * Prüfen, ob die gezogene Karte
     * spielbar ist.
     */
    const canPlayDrawnCard =
      this.gameService.canPlayCard(drawnCard);

    console.log(
      '[BOT SERVICE] Gezogene Karte spielbar:',
      canPlayDrawnCard
    );

    if (canPlayDrawnCard) {

      console.log(
        '[BOT SERVICE] Bot spielt gezogene Karte.'
      );

      this.playCard(
        drawnCard,
        currentPlayer
      );

      console.log(
        '[BOT SERVICE] playBotTurn() ENDE'
      );

      return;
    }

    /*
     * Gezogene Karte kann nicht gespielt werden.
     */
    console.log(
      '[BOT SERVICE] Gezogene Karte nicht spielbar.'
    );

    console.log(
      '[BOT SERVICE] Bot beendet seinen Zug.'
    );

    this.gameService.endTurn();

    console.log(
      '[BOT SERVICE] Neuer Spieler:',
      this.gameService.getCurrentGame()
        ?.players[
          this.gameService.getCurrentGame()
            ?.currentPlayerIndex ?? 0
        ]?.username
    );

    console.log(
      '[BOT SERVICE] playBotTurn() ENDE'
    );
  }

  private playCard(
    card: Card,
    player: Player
  ): void {

    console.log(
      '[BOT SERVICE] playCard():',
      card.id
    );

    /*
     * Wild-Karte.
     */
    if (card.color === 'wild') {

      const chosenColor =
        this.chooseColor(player);

      console.log(
        '[BOT SERVICE] Wild-Karte.'
      );

      console.log(
        '[BOT SERVICE] Gewählte Farbe:',
        chosenColor
      );

      const success =
        this.gameService.playCard(
          card,
          chosenColor
        );

      console.log(
        '[BOT SERVICE] Wild playCard Ergebnis:',
        success
      );

      return;
    }

    /*
     * Normale Karte oder Aktionskarte.
     */
    const success =
      this.gameService.playCard(card);

    console.log(
      '[BOT SERVICE] playCard Ergebnis:',
      success
    );
  }

  private findPlayableCard(
    player: Player
  ): Card | null {

    console.log(
      '[BOT SERVICE] Prüfe',
      player.hand.length,
      'Karten.'
    );

    for (const card of player.hand) {

      const playable =
        this.gameService.canPlayCard(card);

      console.log(
        '[BOT SERVICE] Karte:',
        card.id,
        '| spielbar:',
        playable
      );

      if (playable) {
        return card;
      }
    }

    return null;
  }

  private chooseColor(
    player: Player
  ): CardColor {

    const colorCounts: Record<
      Exclude<CardColor, 'wild'>,
      number
    > = {
      red: 0,
      yellow: 0,
      green: 0,
      blue: 0
    };

    for (const card of player.hand) {

      if (card.color !== 'wild') {
        colorCounts[card.color]++;
      }
    }

    console.log(
      '[BOT SERVICE] Farbverteilung:',
      colorCounts
    );

    let bestColor:
      Exclude<CardColor, 'wild'> = 'red';

    let highestCount = -1;

    for (const color of [
      'red',
      'yellow',
      'green',
      'blue'
    ] as const) {

      if (
        colorCounts[color] > highestCount
      ) {

        highestCount =
          colorCounts[color];

        bestColor = color;
      }
    }

    console.log(
      '[BOT SERVICE] Beste Farbe:',
      bestColor
    );

    return bestColor;
  }
}
