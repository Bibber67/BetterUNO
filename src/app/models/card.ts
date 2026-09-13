export type CardColor =
  | 'red'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'wild';

export type CardType =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw-two'
  | 'wild'
  | 'draw-four';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
}
