import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

// Pie de página oscuro del HTML de referencia
@Component({
  imports: [MatIcon],
  selector: 'app-footer-component',
  styleUrl: './footer-component.css',
  templateUrl: './footer-component.html',
})
export class FooterComponent {
  anio = new Date().getFullYear();
}
