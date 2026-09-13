import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { Card, CardColor } from '../models/card';
import { Game } from '../models/game';
import { Player } from '../models/player';

import { GameService } from '../services/game.service';
import { BotService } from '../services/bot.service';

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
export class GameComponent implements OnInit, OnDestroy {

  game: Game | null = null;

  player: Player | null = null;

  playableCards: Card[] = [];

  selectedWildCard: Card | null = null;

  errorMessage = '';

  private botTimer: ReturnType<typeof setTimeout> | null = null;

  private botTurnScheduled = false;

  private readonly botDelay = 1000;

  constructor(
    private gameService: GameService,
    private botService: BotService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[GAME] ngOnInit()');

    this.startGame();
  }

  ngOnDestroy(): void {
    console.log('[GAME] ngOnDestroy()');

    if (this.botTimer !== null) {
      console.log('[BOT] Timer wird gelöscht.');

      clearTimeout(this.botTimer);

      this.botTimer = null;
    }

    this.botTurnScheduled = false;
  }

  startGame(): void {
    console.log('[GAME] Starte neues Spiel.');

    const players: Player[] = [
      {
        id: '1',
        username: 'You',
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

    console.log(
      '[GAME] Spieler:',
      this.game.players.map(
        player => ({
          name: player.username,
          isBot: player.isBot,
          cards: player.hand.length
        })
      )
    );

    console.log(
      '[GAME] Startspieler:',
      this.game.players[
        this.game.currentPlayerIndex
      ].username
    );

    this.selectedWildCard = null;

    this.errorMessage = '';

    this.updatePlayableCards();

    this.checkForBotTurn();

    this.changeDetector.detectChanges();
  }

  updatePlayableCards(): void {

    if (
      this.game === null ||
      this.player === null
    ) {
      this.playableCards = [];

      return;
    }

    if (!this.isMyTurn) {
      this.playableCards = [];

      return;
    }

    if (this.game.status !== 'playing') {
      this.playableCards = [];

      return;
    }

    this.playableCards =
      this.player.hand.filter(
        card =>
          this.gameService.canPlayCard(card)
      );

    console.log(
      '[GAME] Spielbare Karten:',
      this.playableCards.map(
        card => card.id
      )
    );
  }

  onCardSelected(card: Card): void {

    console.log(
      '[PLAYER] Karte ausgewählt:',
      card.id,
      card.type,
      card.color
    );

    this.errorMessage = '';

    if (
      this.game === null ||
      this.player === null
    ) {
      return;
    }

    if (!this.isMyTurn) {

      console.log(
        '[PLAYER] Nicht am Zug.'
      );

      this.errorMessage =
        'Du bist momentan nicht am Zug.';

      return;
    }

    if (this.game.status !== 'playing') {
      return;
    }

    if (
      !this.gameService.canPlayCard(card)
    ) {

      console.log(
        '[PLAYER] Karte ist nicht spielbar.'
      );

      this.errorMessage =
        'Diese Karte kann momentan nicht gespielt werden.';

      return;
    }

    if (card.color === 'wild') {

      console.log(
        '[PLAYER] Wild-Karte ausgewählt.'
      );

      this.selectedWildCard = card;

      return;
    }

    const success =
      this.gameService.playCard(card);

    console.log(
      '[PLAYER] playCard Ergebnis:',
      success
    );

    if (!success) {

      this.errorMessage =
        'Die Karte konnte nicht gespielt werden.';

      return;
    }

    this.refreshGame();

    console.log(
      '[PLAYER] Nach meinem Zug ist dran:',
      this.currentPlayer?.username
    );

    this.checkForBotTurn();

    this.changeDetector.detectChanges();
  }

  chooseWildColor(
    color: CardColor
  ): void {

    console.log(
      '[PLAYER] Wild-Farbe gewählt:',
      color
    );

    if (this.selectedWildCard === null) {
      return;
    }

    if (color === 'wild') {
      return;
    }

    const success =
      this.gameService.playCard(
        this.selectedWildCard,
        color
      );

    console.log(
      '[PLAYER] Wild playCard Ergebnis:',
      success
    );

    if (!success) {

      this.errorMessage =
        'Die Wild-Karte konnte nicht gespielt werden.';

      return;
    }

    this.selectedWildCard = null;

    this.refreshGame();

    console.log(
      '[PLAYER] Nach Wild-Karte ist dran:',
      this.currentPlayer?.username
    );

    this.checkForBotTurn();

    this.changeDetector.detectChanges();
  }

  cancelWildSelection(): void {

    console.log(
      '[PLAYER] Wild-Auswahl abgebrochen.'
    );

    this.selectedWildCard = null;
  }

  drawCard(): void {

    console.log(
      '[PLAYER] Ziehe eine Karte.'
    );

    this.errorMessage = '';

    if (
      this.game === null ||
      this.player === null
    ) {
      return;
    }

    if (!this.isMyTurn) {

      console.log(
        '[PLAYER] Kann nicht ziehen: nicht am Zug.'
      );

      this.errorMessage =
        'Du bist momentan nicht am Zug.';

      return;
    }

    if (this.game.status !== 'playing') {
      return;
    }

    const card =
      this.gameService.drawCard();

    console.log(
      '[PLAYER] Gezogene Karte:',
      card?.id ?? 'KEINE'
    );

    if (card === null) {

      this.errorMessage =
        'Es konnte keine Karte gezogen werden.';

      return;
    }

    this.refreshGame();

    this.changeDetector.detectChanges();
  }

  refreshGame(): void {

    const currentGame =
      this.gameService.getCurrentGame();

    if (currentGame === null) {

      console.log(
        '[GAME] Kein aktives Spiel.'
      );

      this.game = null;

      this.player = null;

      this.playableCards = [];

      this.changeDetector.detectChanges();

      return;
    }

    /*
     * Wir erstellen bewusst neue Objekte für
     * Game, Player, Hand, DrawPile und DiscardPile.
     *
     * Dadurch bekommt Angular neue Referenzen
     * und kann die Änderungen zuverlässig erkennen.
     */
    this.game = {

      ...currentGame,

      players:
        currentGame.players.map(
          player => ({

            ...player,

            hand: [
              ...player.hand
            ]

          })
        ),

      drawPile: [
        ...currentGame.drawPile
      ],

      discardPile: [
        ...currentGame.discardPile
      ]

    };

    this.player =
      this.game.players[0];

    console.log(
      '[GAME] refreshGame()'
    );

    console.log(
      '[GAME] Aktueller Spieler:',
      this.currentPlayer?.username
    );

    console.log(
      '[GAME] Oberste Ablagekarte:',
      this.topCard?.id
    );

    console.log(
      '[GAME] Spielerstände:',
      this.game.players.map(
        player => ({

          name: player.username,

          cards: player.hand.length,

          isBot: player.isBot

        })
      )
    );

    this.updatePlayableCards();

    /*
     * Wichtig:
     * Nach einem automatischen Bot-Zug
     * erzwingen wir hier eine Aktualisierung
     * der Angular-Ansicht.
     */
    this.changeDetector.detectChanges();
  }

  private checkForBotTurn(): void {

    const currentGame =
      this.gameService.getCurrentGame();

    if (currentGame === null) {

      console.log(
        '[BOT] Kein Spiel vorhanden.'
      );

      return;
    }

    if (currentGame.status !== 'playing') {

      console.log(
        '[BOT] Spiel ist nicht mehr aktiv.'
      );

      return;
    }

    const currentPlayer =
      currentGame.players[
        currentGame.currentPlayerIndex
      ];

    if (currentPlayer === undefined) {

      console.error(
        '[BOT] Kein aktueller Spieler gefunden!'
      );

      return;
    }

    console.log(
      '[BOT] checkForBotTurn():',
      currentPlayer.username,
      '| isBot:',
      currentPlayer.isBot
    );

    if (!currentPlayer.isBot) {

      console.log(
        '[BOT] Mensch ist dran. Kein Bot-Zug.'
      );

      return;
    }

    if (this.botTurnScheduled) {

      console.log(
        '[BOT] Bot-Zug ist bereits geplant.'
      );

      return;
    }

    console.log(
      '[BOT] Bot-Zug wird geplant für:',
      currentPlayer.username
    );

    console.log(
      '[BOT] Wartezeit:',
      this.botDelay,
      'ms'
    );

    this.botTurnScheduled = true;

    const timerStart =
      performance.now();

    this.botTimer =
      setTimeout(() => {

        const timerEnd =
          performance.now();

        console.log(
          '[BOT] Timer ausgelöst nach:',
          Math.round(
            timerEnd - timerStart
          ),
          'ms'
        );

        this.botTimer = null;

        this.botTurnScheduled = false;

        const gameBeforeBot =
          this.gameService.getCurrentGame();

        if (
          gameBeforeBot === null ||
          gameBeforeBot.status !== 'playing'
        ) {

          console.log(
            '[BOT] Spiel vor Bot-Zug nicht mehr aktiv.'
          );

          return;
        }

        const currentPlayerBeforeBot =
          gameBeforeBot.players[
            gameBeforeBot.currentPlayerIndex
          ];

        if (
          currentPlayerBeforeBot === undefined
        ) {

          console.error(
            '[BOT] Aktueller Spieler nicht gefunden!'
          );

          return;
        }

        console.log(
          '[BOT] Vor Bot-Zug:',
          currentPlayerBeforeBot.username
        );

        console.log(
          '[BOT] Karten des Bots:',
          currentPlayerBeforeBot.hand.length
        );

        if (!currentPlayerBeforeBot.isBot) {

          console.warn(
            '[BOT] Spieler ist plötzlich kein Bot mehr!'
          );

          this.refreshGame();

          return;
        }

        const botStart =
          performance.now();

        console.log(
          '[BOT] >>> playBotTurn() START'
        );

        this.botService.playBotTurn();

        const botEnd =
          performance.now();

        console.log(
          '[BOT] <<< playBotTurn() ENDE'
        );

        console.log(
          '[BOT] Dauer playBotTurn():',
          Math.round(
            botEnd - botStart
          ),
          'ms'
        );

        const gameAfterBot =
          this.gameService.getCurrentGame();

        if (gameAfterBot === null) {

          console.error(
            '[BOT] Nach Bot-Zug kein Spiel vorhanden!'
          );

          return;
        }

        const playerAfterBot =
          gameAfterBot.players[
            gameAfterBot.currentPlayerIndex
          ];

        console.log(
          '[BOT] Nach Bot-Zug ist dran:',
          playerAfterBot?.username
        );

        console.log(
          '[BOT] Oberste Ablagekarte nach Bot:',
          gameAfterBot.discardPile[
            gameAfterBot.discardPile.length - 1
          ]?.id
        );

        console.log(
          '[BOT] Spielerstände nach Bot:',
          gameAfterBot.players.map(
            player => ({

              name: player.username,

              cards: player.hand.length

            })
          )
        );

        console.log(
          '[BOT] Richtung:',
          gameAfterBot.direction
        );

        console.log(
          '[BOT] Status:',
          gameAfterBot.status
        );

        /*
         * Spielzustand aus dem Service neu in
         * die UI übernehmen.
         */
        this.refreshGame();

        /*
         * Zusätzliche explizite Angular-
         * Änderungserkennung.
         */
        this.changeDetector.detectChanges();

        console.log(
          '[BOT] Prüfe nächsten Spieler...'
        );

        this.checkForBotTurn();

      }, this.botDelay);
  }

  get currentPlayer(): Player | null {

    if (this.game === null) {
      return null;
    }

    return this.game.players[
      this.game.currentPlayerIndex
    ] ?? null;
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
    ] ?? null;
  }

  get opponents(): Player[] {

    if (this.game === null) {
      return [];
    }

    return this.game.players.filter(
      player =>
        player.id !== this.player?.id
    );
  }

  get isMyTurn(): boolean {

    if (
      this.game === null ||
      this.player === null
    ) {
      return false;
    }

    const currentPlayer =
      this.game.players[
        this.game.currentPlayerIndex
      ];

    if (currentPlayer === undefined) {
      return false;
    }

    return (
      currentPlayer.id === this.player.id
    );
  }
}
