import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Comparacion } from '../../model/medicamento';
import { MedicamentoService } from '../../services/medicamento-service';
import { claseStock, mensajeError, textoStock } from '../../utils/utilidades';

// Compara precios de los medicamentos elegidos (GET /medicamentos/comparacion?ids=)
@Component({
  imports: [CurrencyPipe, MatButton, MatIconButton, MatIcon, MatProgressBar, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  selector: 'app-comparacion-dialog-component',
  styleUrl: './comparacion-dialog-component.css',
  templateUrl: './comparacion-dialog-component.html',
})
export class ComparacionDialogComponent {
  data = inject<{ ids: number[] }>(MAT_DIALOG_DATA);
  medicamentoService: MedicamentoService = inject(MedicamentoService);

  claseStock = claseStock;
  textoStock = textoStock;

  resultado = signal<Comparacion[] | null>(null);
  error = signal('');

  constructor() {
    this.medicamentoService.comparar(this.data.ids).subscribe({
      next: (r) => this.resultado.set(r),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}
