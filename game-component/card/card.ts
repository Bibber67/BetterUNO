import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { Card } from '../../models/card';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class CardComponent {

  @Input() cardData!: Card;

  @Input() playable = false;

  @Output() cardClicked =
    new EventEmitter<Card>();

  get imagePath(): string {

    if (this.cardData.type === 'number') {
      return `/cards/${this.capitalizeColor(this.cardData.color)}_${this.cardData.value}.png`;
    }

    if (this.cardData.type === 'skip') {
      return `/cards/${this.capitalizeColor(this.cardData.color)}_Skip.png`;
    }

    if (this.cardData.type === 'reverse') {
      return `/cards/${this.capitalizeColor(this.cardData.color)}_Reverse.png`;
    }

    if (this.cardData.type === 'draw-two') {
      return `/cards/${this.capitalizeColor(this.cardData.color)}_Draw_2.png`;
    }

    if (this.cardData.type === 'wild') {
      return '/cards/Wild_Card_Change_Colour.png';
    }

    if (this.cardData.type === 'draw-four') {
      return '/cards/Wild_Card_Draw_4.png';
    }

    return '/cards/Wild_Card_Empty.png';
  }

  onCardClick(): void {

    if (!this.playable) {
      return;
    }

    this.cardClicked.emit(this.cardData);
  }

  private capitalizeColor(color: string): string {
    return color.charAt(0).toUpperCase() + color.slice(1);
  }
}
