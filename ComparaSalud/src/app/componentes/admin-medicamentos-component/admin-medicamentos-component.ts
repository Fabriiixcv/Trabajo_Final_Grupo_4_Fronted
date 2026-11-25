import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TotalAdmin } from '../../model/admin';
import { Medicamento } from '../../model/medicamento';
import { AdminService } from '../../services/admin-service';
import { MedicamentoService } from '../../services/medicamento-service';
import { mensajeError } from '../../utils/utilidades';
import { pedirConfirmacion } from '../confirm-dialog-component/confirm-dialog-component';

// Catálogo de medicamentos y eliminación (HU32)
@Component({
  imports: [MatButton, MatCard, MatCardContent, MatIcon],
  selector: 'app-admin-medicamentos-component',
  styleUrl: './admin-medicamentos-component.css',
  templateUrl: './admin-medicamentos-component.html',
})
export class AdminMedicamentosComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  medicamentoService: MedicamentoService = inject(MedicamentoService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  datos = signal<TotalAdmin<Medicamento> | null>(null);

  ngOnInit() {
    this.cargar();
  }

  // GET /api/administradores/medicamentos
  cargar() {
    this.adminService.total<Medicamento>('medicamentos').subscribe({
      next: (d) => this.datos.set(d),
      error: (e) => {
        this.datos.set({ total: 0, detalle: [] });
        this.avisar(mensajeError(e));
      },
    });
  }

  // Pide confirmación y luego DELETE /api/medicamentos/{id}
  eliminar(m: Medicamento) {
    pedirConfirmacion(this.dialog, {
      titulo: 'Eliminar medicamento',
      mensaje: `¿Eliminar "${m.nombre}" del catálogo? Se borrarán también sus ofertas y favoritos.`,
      confirmar: 'Eliminar',
      icono: 'delete',
      peligro: true,
    }).subscribe(() =>
      this.medicamentoService.eliminar(m.id).subscribe({
        next: () => {
          this.avisar('Medicamento eliminado');
          this.cargar();
        },
        error: (e) => this.avisar(mensajeError(e)),
      }),
    );
  }

  private avisar(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 3000 });
  }
}
