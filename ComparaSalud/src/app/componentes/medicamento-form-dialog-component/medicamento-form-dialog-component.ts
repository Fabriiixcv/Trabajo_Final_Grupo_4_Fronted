import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Categoria } from '../../model/categoria';
import { Medicamento, MedicamentoForm } from '../../model/medicamento';
import { AuthService } from '../../services/auth.service';
import { CategoriaService } from '../../services/categoria-service';
import { MedicamentoService } from '../../services/medicamento-service';
import { mensajeError } from '../../utils/utilidades';

// Registrar medicamento (POST /medicamentos) o editarlo (PUT /medicamentos/{id})
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
    MatSelect,
    MatOption,
    MatIcon,
  ],
  selector: 'app-medicamento-form-dialog-component',
  styleUrl: './medicamento-form-dialog-component.css',
  templateUrl: './medicamento-form-dialog-component.html',
})
export class MedicamentoFormDialogComponent implements OnInit {
  data = inject<{ id?: number }>(MAT_DIALOG_DATA);
  ref = inject<MatDialogRef<MedicamentoFormDialogComponent, Medicamento>>(MatDialogRef);
  fb: FormBuilder = inject(FormBuilder);
  auth: AuthService = inject(AuthService);
  medicamentoService: MedicamentoService = inject(MedicamentoService);
  categoriaService: CategoriaService = inject(CategoriaService);
  snack: MatSnackBar = inject(MatSnackBar);

  esEdicion = !!this.data.id;
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  guardando = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    nombreComercial: [''],
    principioActivo: [''],
    concentracion: [''],
    presentacion: [''],
    laboratorio: [''],
    idCategoria: ['' as string | number],
    descripcion: [''],
    advertencias: [''],
  });

  ngOnInit() {
    // Categorías para el select y, si se edita, los datos actuales del medicamento
    forkJoin({
      categorias: this.categoriaService.listar(),
      medicamento: this.data.id ? this.medicamentoService.getById(this.data.id) : of(null),
    }).subscribe({
      next: ({ categorias, medicamento }) => {
        this.categorias.set(categorias);
        if (medicamento) {
          this.form.patchValue({
            nombre: medicamento.nombre ?? '',
            nombreComercial: medicamento.nombreComercial ?? '',
            principioActivo: medicamento.principioActivo ?? '',
            concentracion: medicamento.concentracion ?? '',
            presentacion: medicamento.presentacion ?? '',
            laboratorio: medicamento.laboratorio ?? '',
            idCategoria: medicamento.idCategoria ?? '',
            descripcion: medicamento.descripcion ?? '',
            advertencias: medicamento.advertencias ?? '',
          });
        }
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisar(mensajeError(e));
      },
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.avisar('El nombre del medicamento es obligatorio');
      return;
    }
    const { idCategoria, ...resto } = this.form.getRawValue();
    const datos: MedicamentoForm = {
      ...resto,
      idCategoria: idCategoria ? Number(idCategoria) : undefined,
      idFarmacia: this.auth.sesion()?.idFarmacia,
    };

    this.guardando.set(true);
    const peticion = this.data.id
      ? this.medicamentoService.editar(this.data.id, datos)
      : this.medicamentoService.registrar(datos);

    peticion.subscribe({
      next: (m) => {
        this.snack.open(this.esEdicion ? 'Medicamento actualizado' : 'Medicamento registrado', 'OK', { duration: 3000 });
        this.ref.close(m);
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
