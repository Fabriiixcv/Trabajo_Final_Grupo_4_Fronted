import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FarmaciaPublica } from '../../model/farmacia';
import { CalificacionesFarmacia, Ubicacion } from '../../model/calificacion';
import { AuthService } from '../../services/auth.service';
import { FarmaciaService } from '../../services/farmacia-service';
import { ESTRELLAS, mensajeError } from '../../utils/utilidades';

// Ubicación (GET /farmacias/{id}/ubicacion) + calificaciones (GET/POST /farmacias/{id}/calificaciones)
@Component({
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatAnchor,
    MatButton,
    MatIconButton,
    MatIcon,
    MatDivider,
    MatProgressBar,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  selector: 'app-farmacia-detalle-dialog-component',
  styleUrl: './farmacia-detalle-dialog-component.css',
  templateUrl: './farmacia-detalle-dialog-component.html',
})
export class FarmaciaDetalleDialogComponent {
  data = inject<{ id: number }>(MAT_DIALOG_DATA);
  farmaciaService: FarmaciaService = inject(FarmaciaService);
  auth: AuthService = inject(AuthService);
  fb: FormBuilder = inject(FormBuilder);
  snack: MatSnackBar = inject(MatSnackBar);

  estrellas = ESTRELLAS;
  farmacia = signal<FarmaciaPublica | null>(null);
  ubicacion = signal<Ubicacion | null>(null);
  calificaciones = signal<CalificacionesFarmacia | null>(null);
  puntuacion = signal(5);
  sobre = signal(0); // estrella sobre la que está el mouse (vista previa)
  enviando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({ comentario: [''] });

  constructor() {
    forkJoin({
      farmacia: this.farmaciaService.getById(this.data.id),
      ubicacion: this.farmaciaService.ubicacion(this.data.id),
      calificaciones: this.farmaciaService.calificaciones(this.data.id),
    }).subscribe({
      next: (r) => {
        this.farmacia.set(r.farmacia);
        this.ubicacion.set(r.ubicacion);
        this.calificaciones.set(r.calificaciones);
      },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  // Enlace a Google Maps con la dirección de la farmacia
  urlMapa(u: Ubicacion): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${u.direccion}, ${u.distrito}`);
  }

  textoPuntuacion(n: number): string {
    return ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'][n] ?? '';
  }

  inicial(nombre: string): string {
    return (nombre.trim()[0] ?? '?').toUpperCase();
  }

  elegirPuntuacion(n: number) {
    this.puntuacion.set(n);
  }

  // POST /api/farmacias/{id}/calificaciones y recarga la lista
  enviar() {
    this.enviando.set(true);
    this.farmaciaService
      .calificar(this.data.id, {
        puntuacion: this.puntuacion(),
        comentario: this.form.getRawValue().comentario.trim(),
        idCliente: this.auth.sesion()?.idCliente,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.form.reset();
          this.snack.open('Gracias por tu calificación', 'OK', { duration: 3000 });
          this.farmaciaService.calificaciones(this.data.id).subscribe((c) => this.calificaciones.set(c));
        },
        error: (e) => {
          this.enviando.set(false);
          this.snack.open(mensajeError(e), 'OK', { duration: 4000 });
        },
      });
  }
}
