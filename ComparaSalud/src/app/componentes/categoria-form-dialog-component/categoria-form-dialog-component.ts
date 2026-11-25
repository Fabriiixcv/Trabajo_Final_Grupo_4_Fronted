import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Categoria } from '../../model/categoria';
import { CategoriaService } from '../../services/categoria-service';
import { mensajeError } from '../../utils/utilidades';

// Nueva categoría (POST /categorias) o editar una existente (PUT /categorias/{id}): el mismo formulario (HU38, HU40)
@Component({
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatIcon,
  ],
  selector: 'app-categoria-form-dialog-component',
  styleUrl: './categoria-form-dialog-component.css',
  templateUrl: './categoria-form-dialog-component.html',
})
export class CategoriaFormDialogComponent {
  data = inject<Partial<Categoria>>(MAT_DIALOG_DATA);
  ref = inject<MatDialogRef<CategoriaFormDialogComponent, boolean>>(MatDialogRef);
  fb: FormBuilder = inject(FormBuilder);
  categoriaService: CategoriaService = inject(CategoriaService);
  snack: MatSnackBar = inject(MatSnackBar);

  esEdicion = !!this.data.id;
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    nombre: [this.data.nombre ?? ''],
    descripcion: [this.data.descripcion ?? ''],
  });

  guardar() {
    const datos = this.form.getRawValue();
    this.guardando.set(true);
    const peticion = this.data.id
      ? this.categoriaService.editar(this.data.id, datos)
      : this.categoriaService.crear(datos);

    peticion.subscribe({
      next: () => {
        this.snack.open(this.esEdicion ? 'Categoría actualizada' : 'Categoría registrada', 'OK', { duration: 3000 });
        this.ref.close(true);
      },
      error: (e) => {
        this.guardando.set(false);
        this.snack.open(mensajeError(e), 'OK', { duration: 4000 });
      },
    });
  }
}
