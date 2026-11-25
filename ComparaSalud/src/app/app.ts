import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './componentes/nav-component/nav-component';
import { FooterComponent } from './componentes/footer-component/footer-component';

@Component({
  imports: [RouterOutlet, NavComponent, FooterComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('ComparaSalud');
}
