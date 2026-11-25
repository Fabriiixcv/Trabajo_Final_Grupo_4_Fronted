import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatError, MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClientePublico } from '../../model/cliente';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente-service';
import { mensajeError } from '../../utils/utilidades';
import { ConfirmDialogComponent } from '../confirm-dialog-component/confirm-dialog-component';

// Mi cuenta: ver y editar nombre, eliminar cuenta (HU04, HU44, HU05)
@Component({
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatFormField,
    MatLabel,
    MatError,
    MatPrefix,
    MatInput,
    MatIcon,
  ],
  selector: 'app-cliente-cuenta-component',
  styleUrl: './cliente-cuenta-component.css',
  templateUrl: './cliente-cuenta-component.html',
})
export class ClienteCuentaComponent implements OnInit {
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);
  clienteService: ClienteService = inject(ClienteService);
  snack: MatSnackBar = inject(MatSnackBar);
  dialog: MatDialog = inject(MatDialog);

  cliente = signal<ClientePublico | null>(null);
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
  });

  private get idCliente(): number {
    return this.auth.sesion()?.idCliente ?? 0;
  }

  ngOnInit() {
    // GET /api/clientes/{id}
    this.clienteService.getById(this.idCliente).subscribe({
      next: (c) => {
        this.cliente.set(c);
        this.form.setValue({ nombre: c.nombre, apellidos: c.apellidos });
      },
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  // PUT /api/clientes/{id}/nombre
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.avisar('Completa tu nombre y apellidos');
      return;
    }
    this.guardando.set(true);
    this.clienteService.actualizarNombre(this.idCliente, this.form.getRawValue()).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.cliente.set(c);
        this.auth.actualizarNombre(c.nombre);
        this.avisar('Datos actualizados');
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisar(mensajeError(e));
      },
    });
  }

  // Pide confirmación con un diálogo de Angular Material; luego DELETE /api/clientes/{id} y cierra la sesión
  eliminarCuenta() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        maxWidth: '95vw',
        data: {
          titulo: 'Eliminar mi cuenta',
          mensaje: 'Se borrarán tu cuenta, tus favoritos y tus calificaciones. Esta acción no se puede deshacer.',
          confirmar: 'Eliminar cuenta',
          icono: 'delete',
          peligro: true,
        },
      })
      .afterClosed()
      .subscribe((confirmado) => {
        if (!confirmado) return;
        this.clienteService.delete(this.idCliente).subscribe({
          next: () => {
            this.auth.logout();
            this.router.navigate(['/login']);
          },
          error: (e) => this.avisar(mensajeError(e)),
        });
      });
  }

  inicial(nombre: string): string {
    return (nombre.trim()[0] ?? '?').toUpperCase();
  }

  private avisar(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 3000 });
  }
}
