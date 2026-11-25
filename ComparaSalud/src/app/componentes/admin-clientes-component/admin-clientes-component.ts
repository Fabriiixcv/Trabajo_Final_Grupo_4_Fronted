import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TotalAdmin } from '../../model/admin';
import { ClientePublico } from '../../model/cliente';
import { AdminService } from '../../services/admin-service';
import { mensajeError } from '../../utils/utilidades';
import { pedirConfirmacion } from '../confirm-dialog-component/confirm-dialog-component';

// Clientes registrados y eliminación de cuentas (HU56)
@Component({
  imports: [MatButton, MatCard, MatCardContent, MatIcon],
  selector: 'app-admin-clientes-component',
  styleUrl: './admin-clientes-component.css',
  templateUrl: './admin-clientes-component.html',
})
export class AdminClientesComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  datos = signal<TotalAdmin<ClientePublico> | null>(null);

  ngOnInit() {
    this.cargar();
  }

  // GET /api/administradores/clientes
  cargar() {
    this.adminService.total<ClientePublico>('clientes').subscribe({
      next: (d) => this.datos.set(d),
      error: (e) => {
        this.datos.set({ total: 0, detalle: [] });
        this.avisar(mensajeError(e));
      },
    });
  }

  // Pide confirmación y luego DELETE /api/administradores/clientes/{id}
  eliminar(c: ClientePublico) {
    pedirConfirmacion(this.dialog, {
      titulo: 'Eliminar cliente',
      mensaje: `¿Eliminar la cuenta de ${c.nombre} ${c.apellidos}? Se borrarán sus favoritos y calificaciones.`,
      confirmar: 'Eliminar',
      icono: 'delete',
      peligro: true,
    }).subscribe(() =>
      this.adminService.eliminarCliente(c.id!).subscribe({
        next: () => {
          this.avisar('Cliente eliminado');
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
