import { Routes } from '@angular/router';
import { GameComponent } from './game-component/game-component';
import { HomeComponent } from './home-component/home-component';
import { LeaderboardComponent } from './leaderboard-component/leaderboard-component';
import { LoginComponent } from './login-component/login-component';
import { NewGameComponent } from './new-game-component/new-game-component';
import { RegisterComponent } from './register-component/register-component';

export const routes: Routes = [
    { path: "", redirectTo: "login", pathMatch: "full" },
    { path: "login", component:LoginComponent },
    { path: "game", component:GameComponent },
    { path: "home", component:HomeComponent },
    { path: "leaderboard", component:LeaderboardComponent },
    { path: "new", component:NewGameComponent },
    { path: "register", component:RegisterComponent }
];
