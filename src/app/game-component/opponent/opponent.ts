import {
  Component,
  Input
} from '@angular/core';

import { Player } from '../../models/player';

@Component({
  selector: 'app-opponent',
  imports: [],
  templateUrl: './opponent.html',
  styleUrl: './opponent.css'
})
export class OpponentComponent {

  @Input() player!: Player;

}
