import { Injectable } from '@angular/core';
import { Card } from '../models/card';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  createDeck(): Card[] {
    const deck: Card[] = [];

    const colors: Card['color'][] = [
      'red',
      'yellow',
      'green',
      'blue'
    ];

    for (const color of colors) {

      deck.push({
        id: `${color}-0`,
        color: color,
        type: 'number',
        value: 0
      });
       // normale karten
      for (let value = 1; value <= 9; value++) {
        for (let copy = 1; copy <= 2; copy++) {
          deck.push({
            id: `${color}-${value}-${copy}`,
            color: color,
            type: 'number',
            value: value
          });
        }
      }

      // Aktionskarten mit farbe
      for (let copy = 1; copy <= 2; copy++) {

        deck.push({
          id: `${color}-skip-${copy}`,
          color: color,
          type: 'skip'
        });

        deck.push({
          id: `${color}-reverse-${copy}`,
          color: color,
          type: 'reverse'
        });

        deck.push({
          id: `${color}-draw-two-${copy}`,
          color: color,
          type: 'draw-two'
        });
      }
    }

    // Wünsche karten
    for (let copy = 1; copy <= 4; copy++) {
      deck.push({
        id: `wild-${copy}`,
        color: 'wild',
        type: 'wild'
      });
    }

    // +4 Wünsche karten
    for (let copy = 1; copy <= 4; copy++) {
      deck.push({
        id: `draw-four-${copy}`,
        color: 'wild',
        type: 'draw-four'
      });
    }

    return deck;
  }

  //
  shuffleDeck(deck: Card[]): Card[] {
  const shuffledDeck = [...deck];

  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const temporary = shuffledDeck[i];
    shuffledDeck[i] = shuffledDeck[randomIndex];
    shuffledDeck[randomIndex] = temporary;
  }

  return shuffledDeck;
}
  //
}
