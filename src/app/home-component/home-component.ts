import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  imports: [RouterLink],
  selector: 'app-home-component',
  styleUrl: './home-component.css',
  templateUrl: './home-component.html',
})
export class HomeComponent {
  userName:string = "GeorgeDroid"
  // auth = inject(Auth);
}
