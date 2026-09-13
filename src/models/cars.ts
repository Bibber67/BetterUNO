export interface Card {
  id: string; // nur 7 gleiche karten in UNO
  color: CardColor;
  type: CardType;
  isBot: boolean;
}
