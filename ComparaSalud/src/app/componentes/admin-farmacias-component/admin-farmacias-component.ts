import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TotalAdmin } from '../../model/admin';
import { FarmaciaPublica } from '../../model/farmacia';
import { AdminService } from '../../services/admin-service';
import { mensajeError } from '../../utils/utilidades';
import { pedirConfirmacion } from '../confirm-dialog-component/confirm-dialog-component';

// Farmacias activas y baja de farmacias (HU57)
@Component({
  imports: [MatButton, MatCard, MatCardContent, MatIcon],
  selector: 'app-admin-farmacias-component',
  styleUrl: './admin-farmacias-component.css',
  templateUrl: './admin-farmacias-component.html',
})
export class AdminFarmaciasComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  datos = signal<TotalAdmin<FarmaciaPublica> | null>(null);

  ngOnInit() {
    this.cargar();
  }

  // GET /api/administradores/farmacias
  cargar() {
    this.adminService.total<FarmaciaPublica>('farmacias').subscribe({
      next: (d) => this.datos.set(d),
      error: (e) => {
        this.datos.set({ total: 0, detalle: [] });
        this.avisar(mensajeError(e));
      },
    });
  }

  // Pide confirmación y luego DELETE /api/administradores/farmacias/{id}
  darDeBaja(f: FarmaciaPublica) {
    pedirConfirmacion(this.dialog, {
      titulo: 'Dar de baja',
      mensaje: `¿Dar de baja a "${f.nombre}"? Dejará de aparecer y no podrá iniciar sesión.`,
      confirmar: 'Dar de baja',
      icono: 'block',
      peligro: true,
    }).subscribe(() =>
      this.adminService.bajaFarmacia(f.id!).subscribe({
        next: () => {
          this.avisar('Farmacia dada de baja');
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
