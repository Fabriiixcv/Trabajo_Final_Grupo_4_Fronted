import { Component, inject } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  confirmar: string; // texto del botón principal, p. ej. "Eliminar cuenta"
  icono?: string;
  peligro?: boolean; // true = botón y icono en rojo
}

// Diálogo de confirmación reutilizable: devuelve true si la persona confirma
@Component({
  imports: [MatButton, MatIcon, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
  selector: 'app-confirm-dialog-component',
  styleUrl: './confirm-dialog-component.css',
  templateUrl: './confirm-dialog-component.html',
})
export class ConfirmDialogComponent {
  data = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}

// Abre el diálogo de confirmación y emite solo si la persona confirma (para eliminar, dar de baja, etc.)
export function pedirConfirmacion(dialog: MatDialog, datos: DatosConfirmacion): Observable<boolean> {
  return dialog
    .open(ConfirmDialogComponent, { width: '440px', maxWidth: '95vw', data: datos })
    .afterClosed()
    .pipe(filter((ok): ok is boolean => !!ok));
}
