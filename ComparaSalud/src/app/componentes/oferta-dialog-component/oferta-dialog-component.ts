import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CambioOferta } from '../../model/oferta';
import { AuthService } from '../../services/auth.service';
import { OfertaService } from '../../services/oferta-service';
import { mensajeError } from '../../utils/utilidades';

export interface OfertaDialogData {
  modo: 'crear' | 'editar';
  nombre: string; // nombre del medicamento
  idMedicamento?: number; // solo al crear
  id?: number; // solo al editar
  precio?: number;
  stock?: number;
}

// Crear oferta (POST /ofertas) o editar precio y stock (PUT /ofertas/{id} o /ofertas/{id}/precio-stock)
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
  selector: 'app-oferta-dialog-component',
  styleUrl: './oferta-dialog-component.css',
  templateUrl: './oferta-dialog-component.html',
})
export class OfertaDialogComponent {
  data = inject<OfertaDialogData>(MAT_DIALOG_DATA);
  ref = inject<MatDialogRef<OfertaDialogComponent, boolean>>(MatDialogRef);
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  ofertaService: OfertaService = inject(OfertaService);
  snack: MatSnackBar = inject(MatSnackBar);

  esNueva = this.data.modo === 'crear';
  guardando = signal(false);

  form = this.fb.group({
    precio: [this.data.precio ?? (null as number | null)],
    stock: [this.data.stock ?? (null as number | null)],
  });

  guardar() {
    const { precio, stock } = this.form.getRawValue();
    const hayPrecio = precio !== null && precio !== undefined && `${precio}` !== '';
    const hayStock = stock !== null && stock !== undefined && `${stock}` !== '';

    if (this.esNueva) {
      if (!hayPrecio || !hayStock || Number(precio) <= 0 || Number(stock) <= 0) {
        this.avisar('Indica un precio y un stock mayores que 0');
        return;
      }
    } else if (!hayPrecio && !hayStock) {
      this.avisar('Indica el precio o el stock');
      return;
    }

    this.guardando.set(true);
    const idFarmacia = this.auth.sesion()?.idFarmacia ?? 0;
    const cambio: CambioOferta = {};
    if (hayPrecio) cambio.precio = Number(precio);
    if (hayStock) cambio.stock = Number(stock);

    // Crear: POST. Editar con ambos campos: PUT completo. Editar solo uno: PUT precio-stock.
    const peticion = this.esNueva
      ? this.ofertaService.crear({
          idMedicamento: this.data.idMedicamento ?? 0,
          idFarmacia,
          precio: Number(precio),
          stock: Number(stock),
        })
      : hayPrecio && hayStock
        ? this.ofertaService.editar(this.data.id ?? 0, cambio)
        : this.ofertaService.editarPrecioStock(this.data.id ?? 0, cambio);

    peticion.subscribe({
      next: () => {
        this.snack.open(this.esNueva ? 'Oferta publicada' : 'Oferta actualizada', 'OK', { duration: 3000 });
        this.ref.close(true);
      },
      error: (e) => {
        this.guardando.set(false);
        this.avisar(mensajeError(e));
      },
    });
  }

  private avisar(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 4000 });
  }
}
