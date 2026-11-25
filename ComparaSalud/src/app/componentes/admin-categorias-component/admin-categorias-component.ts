import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TotalAdmin } from '../../model/admin';
import { Categoria } from '../../model/categoria';
import { AdminService } from '../../services/admin-service';
import { CategoriaService } from '../../services/categoria-service';
import { mensajeError } from '../../utils/utilidades';
import { pedirConfirmacion } from '../confirm-dialog-component/confirm-dialog-component';
import { CategoriaFormDialogComponent } from '../categoria-form-dialog-component/categoria-form-dialog-component';

// Categorías: listar, crear, editar y eliminar (HU38–HU41)
@Component({
  imports: [MatButton, MatCard, MatCardContent, MatIcon],
  selector: 'app-admin-categorias-component',
  styleUrl: './admin-categorias-component.css',
  templateUrl: './admin-categorias-component.html',
})
export class AdminCategoriasComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  categoriaService: CategoriaService = inject(CategoriaService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  datos = signal<TotalAdmin<Categoria> | null>(null);

  ngOnInit() {
    this.cargar();
  }

  // GET /api/administradores/categorias
  cargar() {
    this.adminService.total<Categoria>('categorias').subscribe({
      next: (d) => this.datos.set(d),
      error: (e) => {
        this.datos.set({ total: 0, detalle: [] });
        this.avisar(mensajeError(e));
      },
    });
  }

  nueva() {
    this.abrirFormulario({});
  }

  editar(c: Categoria) {
    this.abrirFormulario(c);
  }

  private abrirFormulario(categoria: Partial<Categoria>) {
    this.dialog
      .open(CategoriaFormDialogComponent, { width: '440px', data: categoria })
      .afterClosed()
      .subscribe((ok) => ok && this.cargar());
  }

  // Pide confirmación y luego DELETE /api/categorias/{id}
  eliminar(c: Categoria) {
    pedirConfirmacion(this.dialog, {
      titulo: 'Eliminar categoría',
      mensaje: `¿Eliminar la categoría "${c.nombre}"?`,
      confirmar: 'Eliminar',
      icono: 'delete',
      peligro: true,
    }).subscribe(() =>
      this.categoriaService.eliminar(c.id).subscribe({
        next: () => {
          this.avisar('Categoría eliminada');
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
