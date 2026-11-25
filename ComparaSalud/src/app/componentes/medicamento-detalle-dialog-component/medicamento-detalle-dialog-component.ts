import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Medicamento, Recomendacion, ReportePrecios } from '../../model/medicamento';
import { MedicamentoService } from '../../services/medicamento-service';
import { claseStock, mensajeError, textoStock } from '../../utils/utilidades';

// Detalle (GET /medicamentos/{id}) + reporte de precios + alternativas recomendadas
@Component({
  imports: [CurrencyPipe, MatButton, MatIconButton, MatIcon, MatDivider, MatProgressBar, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  selector: 'app-medicamento-detalle-dialog-component',
  styleUrl: './medicamento-detalle-dialog-component.css',
  templateUrl: './medicamento-detalle-dialog-component.html',
})
export class MedicamentoDetalleDialogComponent {
  data = inject<{ id: number }>(MAT_DIALOG_DATA);
  medicamentoService: MedicamentoService = inject(MedicamentoService);

  claseStock = claseStock;
  textoStock = textoStock;

  medicamento = signal<Medicamento | null>(null);
  recomendaciones = signal<Recomendacion[]>([]);
  reporte = signal<ReportePrecios | null>(null);
  error = signal('');

  constructor() {
    forkJoin({
      medicamento: this.medicamentoService.getById(this.data.id),
      recomendaciones: this.medicamentoService.recomendaciones(this.data.id),
      reporte: this.medicamentoService.reporte(this.data.id),
    }).subscribe({
      next: (r) => {
        this.medicamento.set(r.medicamento);
        this.recomendaciones.set(r.recomendaciones);
        this.reporte.set(r.reporte);
      },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  // "Nombre · concentración · presentación", omitiendo los que vienen vacíos
  resumen(m: Medicamento): string {
    return [m.nombre, m.concentracion, m.presentacion].filter((x) => !!x).join(' · ');
  }

  // Datos que se muestran solo si tienen valor
  datos(m: Medicamento): { icono: string; etiqueta: string; valor?: string }[] {
    return [
      { icono: 'science', etiqueta: 'Principio activo', valor: m.principioActivo },
      { icono: 'factory', etiqueta: 'Laboratorio', valor: m.laboratorio },
      { icono: 'notes', etiqueta: 'Descripción', valor: m.descripcion },
      { icono: 'warning', etiqueta: 'Advertencias', valor: m.advertencias },
    ].filter((d) => d.valor);
  }
}
