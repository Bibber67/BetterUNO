import { Card } from "./card";

export interface Player {
  id: string;
  username: string;
  hand: Card[];
  isBot: boolean;
}
