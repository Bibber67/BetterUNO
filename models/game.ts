import { Card } from './card';
import { Player } from './player';

export type GameDirection = 'clockwise' | 'counter-clockwise';

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface Game {
  id: string;

  players: Player[];

  drawPile: Card[];
  discardPile: Card[];

  currentPlayerIndex: number;

  direction: GameDirection;

  status: GameStatus;

  currentColor: Card['color'];
}
