import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { Card, CardColor } from '../models/card';
import { Game } from '../models/game';
import { Player } from '../models/player';

import { GameService } from '../services/game.service';
import { BotService } from '../services/bot.service';
import { StorageService } from '../services/storage.service';
import { Auth } from '../auth';

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

  /*
   * Speichert, ob der Spieler in seinem
   * aktuellen Zug bereits gezogen hat.
   */
  hasDrawnThisTurn = false;

  /*
   * Wird angezeigt, wenn die gezogene Karte
   * spielbar ist.
   */
  showDrawnCardOption = false;

  /*
   * Spielmodus:
   *
   * bot:
   * Der eingeloggte Spieler spielt gegen Bots.
   *
   * local:
   * Zwei echte Spieler spielen lokal
   * am selben Rechner.
   */
  private gameMode: 'bot' | 'local' = 'bot';

  /*
   * Anzahl der Bots im Bot-Modus.
   */
  private botCount = 1;

  private botTimer: ReturnType<typeof setTimeout> | null = null;

  private gameResultSaved = false;

  private botTurnScheduled = false;

  private readonly botDelay = 1000;


  constructor(
    private gameService: GameService,
    private botService: BotService,
    private changeDetector: ChangeDetectorRef,
    private auth: Auth,
    private storage: StorageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}


  async ngOnInit(): Promise<void> {

    console.log('[GAME] ngOnInit()');

    const user =
      this.auth.user ??
      await this.auth.checkSession();

    if (user === null) {

      await this.router.navigateByUrl('/login');

      return;
    }


    /*
     * Prüfen, ob ein gespeichertes Spiel
     * fortgesetzt werden soll.
     */
    const resume =
      this.route.snapshot.queryParamMap.get(
        'resume'
      ) === 'true';


    if (resume) {

      this.resumeGame();

      return;
    }


    /*
     * Neuen Spielmodus aus der URL lesen.
     *
     * Beispiel:
     *
     * /game?mode=bot&bots=2
     *
     * oder:
     *
     * /game?mode=local&bots=0
     */
    this.gameMode =
      this.route.snapshot.queryParamMap.get(
        'mode'
      ) === 'local'
        ? 'local'
        : 'bot';


    const bots =
      Number(
        this.route.snapshot.queryParamMap.get(
          'bots'
        ) ?? '1'
      );


    /*
     * Nur 1 bis 3 Bots erlauben.
     */
    this.botCount =
      Number.isInteger(bots) &&
      bots >= 1 &&
      bots <= 3
        ? bots
        : 1;


    this.startGame();
  }


  ngOnDestroy(): void {

    console.log('[GAME] ngOnDestroy()');


    /*
     * Wenn ein laufendes Spiel verlassen wird,
     * speichern wir es automatisch.
     */
    this.saveGameIfPossible();


    if (this.botTimer !== null) {

      console.log(
        '[BOT] Timer wird gelöscht.'
      );

      clearTimeout(
        this.botTimer
      );

      this.botTimer = null;
    }


    this.botTurnScheduled = false;
  }


  startGame(): void {

    console.log(
      '[GAME] Starte neues Spiel.'
    );


    const user =
      this.auth.user;


    if (user === null) {

      void this.router.navigateByUrl(
        '/login'
      );

      return;
    }


    this.gameResultSaved = false;


    /*
     * Zuerst kommt immer der eingeloggte
     * Benutzer als Spieler 1.
     */
    const players: Player[] = [

      {
        id: `user-${user.id}`,

        username: user.username,

        hand: [],

        isBot: false
      }

    ];


    /*
     * PvP:
     *
     * Genau zwei echte Spieler.
     *
     * Es werden KEINE Bots hinzugefügt.
     */
    if (
      this.gameMode === 'local'
    ) {

      players.push({

        id: 'local-player-2',

        username: 'Spieler 2',

        hand: [],

        isBot: false

      });

    }


    /*
     * Bot-Modus:
     *
     * Je nach Auswahl 1, 2 oder 3 Bots.
     */
    else {

      for (
        let i = 1;
        i <= this.botCount;
        i++
      ) {

        players.push({

          id: `bot-${i}`,

          username: `Bot ${i}`,

          hand: [],

          isBot: true

        });

      }
    }


    console.log(
      '[GAME] Spielmodus:',
      this.gameMode
    );

    console.log(
      '[GAME] Bot-Anzahl:',
      this.botCount
    );

    console.log(
      '[GAME] Spieler:',
      players
    );


    /*
     * Jetzt wird genau mit diesen Spielern
     * das UNO-Spiel erstellt.
     */
    this.game =
      this.gameService.startGame(
        players
      );


    /*
     * Der aktuell aktive Spieler wird
     * für die Anzeige bestimmt.
     */
    this.updateActivePlayer();


    console.log(
      '[GAME] Spieler:',
      this.game.players.map(
        player => ({

          name: player.username,

          isBot: player.isBot,

          cards:
            player.hand.length

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

    this.hasDrawnThisTurn = false;

    this.showDrawnCardOption = false;


    this.updatePlayableCards();

    this.checkForBotTurn();

    this.changeDetector.detectChanges();
  }


  /*
   * Aktualisiert den Spieler,
   * dessen Hand gerade angezeigt werden soll.
   *
   * PvP:
   * Der aktuell aktive menschliche Spieler
   * wird angezeigt.
   *
   * Bot-Spiel:
   * Immer der eingeloggte Benutzer.
   */
  private updateActivePlayer(): void {

    if (this.game === null) {

      this.player = null;

      return;
    }


    const currentPlayer =
      this.game.players[
        this.game.currentPlayerIndex
      ];


    /*
     * PvP:
     *
     * Die sichtbare Hand wechselt
     * zwischen Spieler 1 und Spieler 2.
     */
    if (
      this.gameMode === 'local'
    ) {

      this.player =
        currentPlayer ?? null;

      return;
    }


    /*
     * Bot-Modus:
     *
     * Der eingeloggte Benutzer bleibt
     * der menschliche Spieler.
     */
    const user =
      this.auth.user;


    this.player =
      this.game.players.find(
        player =>
          player.id ===
          `user-${user?.id}`
      ) ?? null;
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


    if (
      this.game.status !== 'playing'
    ) {

      this.playableCards = [];

      return;
    }


    this.playableCards =
      this.player.hand.filter(
        card =>
          this.gameService.canPlayCard(
            card
          )
      );


    console.log(
      '[GAME] Spielbare Karten:',
      this.playableCards.map(
        card => card.id
      )
    );
  }


  onCardSelected(
    card: Card
  ): void {

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


    if (
      this.game.status !== 'playing'
    ) {

      return;
    }


    if (
      !this.gameService.canPlayCard(
        card
      )
    ) {

      console.log(
        '[PLAYER] Karte ist nicht spielbar.'
      );

      this.errorMessage =
        'Diese Karte kann momentan nicht gespielt werden.';

      return;
    }


    /*
     * Wild-Karte:
     *
     * Erst Farbe auswählen.
     */
    if (
      card.color === 'wild'
    ) {

      console.log(
        '[PLAYER] Wild-Karte ausgewählt.'
      );

      this.selectedWildCard =
        card;

      return;
    }


    const success =
      this.gameService.playCard(
        card
      );


    console.log(
      '[PLAYER] playCard Ergebnis:',
      success
    );


    if (!success) {

      this.errorMessage =
        'Die Karte konnte nicht gespielt werden.';

      return;
    }


    this.hasDrawnThisTurn = false;

    this.showDrawnCardOption = false;


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


    console.log(
      '[PLAYER] Wild playCard Ergebnis:',
      success
    );


    if (!success) {

      this.errorMessage =
        'Die Wild-Karte konnte nicht gespielt werden.';

      return;
    }


    this.hasDrawnThisTurn = false;

    this.showDrawnCardOption = false;

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


    if (
      this.game.status !== 'playing'
    ) {

      return;
    }


    if (this.hasDrawnThisTurn) {

      console.log(
        '[PLAYER] Bereits in diesem Zug gezogen.'
      );

      this.errorMessage =
        'Du hast in diesem Zug bereits gezogen.';

      return;
    }


    /*
     * Nur ziehen, wenn keine spielbare
     * Karte vorhanden ist.
     */
    if (
      this.playableCards.length > 0
    ) {

      this.errorMessage =
        'Du hast noch eine spielbare Karte.';

      return;
    }


    this.hasDrawnThisTurn = true;


    const card =
      this.gameService.drawCard();


    console.log(
      '[PLAYER] Gezogene Karte:',
      card?.id ?? 'KEINE'
    );


    if (card === null) {

      this.hasDrawnThisTurn = false;

      this.errorMessage =
        'Es konnte keine Karte gezogen werden.';

      return;
    }


    this.refreshGame();


    /*
     * Ist die gezogene Karte spielbar,
     * darf der Spieler entscheiden.
     */
    if (
      this.gameService.canPlayCard(
        card
      )
    ) {

      console.log(
        '[PLAYER] Gezogene Karte ist spielbar.'
      );


      this.showDrawnCardOption = true;


      this.errorMessage =
        'Du kannst die gezogene Karte spielen oder deinen Zug beenden.';


      this.changeDetector.detectChanges();

      return;
    }


    /*
     * Nicht spielbar:
     * Zug automatisch beenden.
     */
    console.log(
      '[PLAYER] Gezogene Karte ist nicht spielbar.'
    );


    this.gameService.endTurn();


    this.hasDrawnThisTurn = false;

    this.showDrawnCardOption = false;


    this.refreshGame();

    this.checkForBotTurn();

    this.changeDetector.detectChanges();
  }


  endPlayerTurn(): void {

    console.log(
      '[PLAYER] Spieler beendet den Zug.'
    );


    if (
      this.game === null ||
      this.player === null
    ) {

      return;
    }


    if (!this.isMyTurn) {

      console.log(
        '[PLAYER] Kann Zug nicht beenden: nicht am Zug.'
      );

      return;
    }


    if (
      this.game.status !== 'playing'
    ) {

      return;
    }


    this.gameService.endTurn();


    this.hasDrawnThisTurn = false;

    this.showDrawnCardOption = false;

    this.selectedWildCard = null;

    this.errorMessage = '';


    this.refreshGame();


    console.log(
      '[PLAYER] Nach Zugende ist dran:',
      this.currentPlayer?.username
    );


    this.checkForBotTurn();

    this.changeDetector.detectChanges();
  }


  /*
   * Spiel pausieren und speichern.
   */
  pauseGame(): void {

    if (
      this.game === null ||
      this.game.status !== 'playing'
    ) {

      return;
    }


    console.log(
      '[GAME] Spiel wird pausiert.'
    );


    /*
     * Eventuellen Bot-Timer stoppen.
     */
    if (
      this.botTimer !== null
    ) {

      clearTimeout(
        this.botTimer
      );

      this.botTimer = null;
    }


    this.botTurnScheduled = false;


    /*
     * Spielstatus ändern.
     */
    this.gameService.pauseGame();


    /*
     * Spiel speichern.
     */
    this.saveGameIfPossible();


    /*
     * Zur Startseite.
     */
    void this.router.navigateByUrl(
      '/home'
    );
  }


  /*
   * Gespeichertes Spiel fortsetzen.
   */
  private resumeGame(): void {

    const user =
      this.auth.user;


    if (user === null) {

      void this.router.navigateByUrl(
        '/login'
      );

      return;
    }


    const savedGame =
      this.storage.getSavedGame(
        user.id
      );


    if (savedGame === null) {

      console.log(
        '[GAME] Kein gespeichertes Spiel gefunden.'
      );

      void this.router.navigateByUrl(
        '/home'
      );

      return;
    }


    console.log(
      '[GAME] Gespeichertes Spiel wird geladen.'
    );


    /*
     * Gespeichertes Game wieder in
     * den GameService laden.
     */
    this.game =
      this.gameService.loadGame(
        savedGame
      );


    /*
     * Den Modus aus dem gespeicherten
     * Spiel bestimmen.
     */
    const humanPlayers =
      this.game.players.filter(
        player => !player.isBot
      ).length;


    this.gameMode =
      humanPlayers === 2
        ? 'local'
        : 'bot';


    /*
     * Botanzahl aus dem gespeicherten
     * Spiel bestimmen.
     */
    this.botCount =
      this.game.players.filter(
        player => player.isBot
      ).length;


    /*
     * Falls das gespeicherte Spiel pausiert
     * war, wird es wieder gestartet.
     */
    if (
      this.game.status === 'paused'
    ) {

      this.gameService.resumeGame();
    }


    this.gameResultSaved = false;

    this.selectedWildCard = null;

    this.errorMessage = '';

    this.hasDrawnThisTurn = false;

    this.showDrawnCardOption = false;


    this.updateActivePlayer();

    this.updatePlayableCards();


    this.changeDetector.detectChanges();


    /*
     * Falls nach dem Fortsetzen ein Bot
     * dran ist, soll dieser wieder spielen.
     */
    this.checkForBotTurn();
  }


  /*
   * Aktuellen Spielstand speichern.
   */
  private saveGameIfPossible(): void {

    const user =
      this.auth.user;


    if (
      user === null ||
      this.game === null
    ) {

      return;
    }


    /*
     * Fertige Spiele werden nicht als
     * fortsetzbares Spiel gespeichert.
     */
    if (
      this.game.status === 'finished'
    ) {

      this.storage.clearSavedGame(
        user.id
      );

      return;
    }


    /*
     * Ein laufendes Spiel wird beim
     * Verlassen automatisch pausiert.
     */
    if (
      this.game.status === 'playing'
    ) {

      this.gameService.pauseGame();
    }


    this.storage.saveGame(
      user.id,
      this.game
    );


    console.log(
      '[GAME] Spiel gespeichert.'
    );
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
     * Kopien erzeugen, damit Angular
     * Änderungen zuverlässig erkennt.
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


    /*
     * Wichtig:
     * Nicht mehr einfach players[0].
     *
     * Bei PvP muss die aktuell aktive
     * menschliche Hand angezeigt werden.
     */
    this.updateActivePlayer();


    this.handleFinishedGame();


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

          name:
            player.username,

          cards:
            player.hand.length,

          isBot:
            player.isBot

        })
      )
    );


    this.updatePlayableCards();

    this.changeDetector.detectChanges();
  }


  private handleFinishedGame(): void {

    if (
      this.game === null ||
      this.game.status !== 'finished'
    ) {

      return;
    }


    if (
      this.gameResultSaved
    ) {

      return;
    }


    const winner =
      this.game.players.find(
        player =>
          player.hand.length === 0
      );


    if (
      winner === undefined
    ) {

      return;
    }


    this.gameResultSaved = true;


    const user =
      this.auth.user;


    /*
     * Nur wenn der eingeloggte Benutzer
     * gewonnen hat, wird ein Sieg gezählt.
     */
    if (
      user !== null &&
      winner.id ===
        `user-${user.id}`
    ) {

      this.storage.addWin(
        user.id
      );


      this.auth.user =
        this.storage.getCurrentUser();


      console.log(
        '[GAME] Sieg gespeichert für:',
        user.username
      );
    }


    /*
     * Fertiges Spiel aus den gespeicherten
     * Spielen entfernen.
     */
    if (user !== null) {

      this.storage.clearSavedGame(
        user.id
      );
    }


    console.log(
      '[GAME] Gewinner:',
      winner.username
    );
  }


  private checkForBotTurn(): void {

    const currentGame =
      this.gameService.getCurrentGame();


    if (
      currentGame === null
    ) {

      console.log(
        '[BOT] Kein Spiel vorhanden.'
      );

      return;
    }


    if (
      currentGame.status !== 'playing'
    ) {

      console.log(
        '[BOT] Spiel ist nicht mehr aktiv.'
      );

      return;
    }


    /*
     * Im PvP gibt es überhaupt keine Bots.
     */
    if (
      this.gameMode === 'local'
    ) {

      console.log(
        '[BOT] PvP-Modus. Keine Bot-Züge.'
      );

      return;
    }


    const currentPlayer =
      currentGame.players[
        currentGame.currentPlayerIndex
      ];


    if (
      currentPlayer === undefined
    ) {

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


    if (
      !currentPlayer.isBot
    ) {

      console.log(
        '[BOT] Mensch ist dran. Kein Bot-Zug.'
      );

      return;
    }


    if (
      this.botTurnScheduled
    ) {

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


        if (
          !currentPlayerBeforeBot.isBot
        ) {

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


        if (
          gameAfterBot === null
        ) {

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

              name:
                player.username,

              cards:
                player.hand.length

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
         * Spielzustand aus dem Service
         * wieder in die UI übernehmen.
         */
        this.refreshGame();


        this.changeDetector.detectChanges();


        console.log(
          '[BOT] Prüfe nächsten Spieler...'
        );


        this.checkForBotTurn();


      }, this.botDelay);
  }


  /*
   * Nach beendetem Spiel zurück zur Startseite.
   */
  goHome(): void {

    void this.router.navigateByUrl(
      '/home'
    );
  }


  get currentPlayer(): Player | null {

    if (
      this.game === null
    ) {

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


  get winner(): Player | null {

    if (
      this.game === null ||
      this.game.status !== 'finished'
    ) {

      return null;
    }


    return this.game.players.find(
      player =>
        player.hand.length === 0
    ) ?? null;
  }


  get opponents(): Player[] {

    if (
      this.game === null
    ) {

      return [];
    }


    return this.game.players.filter(
      player =>
        player.id !==
        this.player?.id
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


    if (
      currentPlayer === undefined
    ) {

      return false;
    }


    return (
      currentPlayer.id ===
      this.player.id
    );
  }
}
