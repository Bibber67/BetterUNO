import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { Card } from '../../models/card';
import { CardComponent } from '../card/card';

@Component({
  selector: 'app-player-hand',
  imports: [CardComponent],
  templateUrl: './player-hand.html',
  styleUrl: './player-hand.css'
})
export class PlayerHandComponent {

  @Input() cards: Card[] = [];

  @Input() playableCards: Card[] = [];

  @Output() cardSelected =
    new EventEmitter<Card>();

  isPlayable(card: Card): boolean {
    return this.playableCards.some(
      playableCard => playableCard.id === card.id
    );
  }

  selectCard(card: Card): void {
    this.cardSelected.emit(card);
  }
}
