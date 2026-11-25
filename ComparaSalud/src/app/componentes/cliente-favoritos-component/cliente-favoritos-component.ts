import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { FarmaciaPublica } from '../../model/farmacia';
import { FarmaciaFavorita, MedicamentoFavorito } from '../../model/favorito';
import { Oferta } from '../../model/oferta';
import { AuthService } from '../../services/auth.service';
import { FarmaciaService } from '../../services/farmacia-service';
import { FavoritoService } from '../../services/favorito-service';
import { OfertaService } from '../../services/oferta-service';
import { claseStock, mensajeError, textoStock } from '../../utils/utilidades';
import { FarmaciaDetalleDialogComponent } from '../farmacia-detalle-dialog-component/farmacia-detalle-dialog-component';

type Pestana = 'medicamentos' | 'farmacias';

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Medicamentos y farmacias guardados (HU18, HU19, HU20, HU33, HU51)
@Component({
  imports: [
    CurrencyPipe,
    RouterLink,
    MatAnchor,
    MatButton,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardActions,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatIcon,
    MatTooltip,
  ],
  selector: 'app-cliente-favoritos-component',
  styleUrl: './cliente-favoritos-component.css',
  templateUrl: './cliente-favoritos-component.html',
})
export class ClienteFavoritosComponent implements OnInit {
  auth: AuthService = inject(AuthService);
  favoritoService: FavoritoService = inject(FavoritoService);
  ofertaService: OfertaService = inject(OfertaService);
  farmaciaService: FarmaciaService = inject(FarmaciaService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  claseStock = claseStock;
  textoStock = textoStock;

  pestana = signal<Pestana>('medicamentos');
  texto = signal('');
  cargando = signal(true);

  medicamentos = signal<MedicamentoFavorito[]>([]);
  farmacias = signal<FarmaciaFavorita[]>([]);
  ofertas = signal<Oferta[]>([]); // para mostrar el mejor precio de hoy de cada favorito
  datosFarmacias = signal<Map<number, FarmaciaPublica>>(new Map()); // horario y teléfono

  // La oferta más barata de hoy para cada medicamento
  mejorOferta = computed(() => {
    const mapa = new Map<number, Oferta>();
    for (const o of this.ofertas()) {
      const actual = mapa.get(o.idMedicamento);
      if (!actual || o.precio < actual.precio) mapa.set(o.idMedicamento, o);
    }
    return mapa;
  });

  medicamentosVisibles = computed(() => {
    const q = normalizar(this.texto().trim());
    return this.medicamentos().filter((m) => !q || normalizar(`${m.nombre} ${m.nombreComercial ?? ''}`).includes(q));
  });

  farmaciasVisibles = computed(() => {
    const q = normalizar(this.texto().trim());
    return this.farmacias().filter((f) => !q || normalizar(`${f.nombre} ${f.distrito} ${f.direccion}`).includes(q));
  });

  private get idCliente(): number {
    return this.auth.sesion()?.idCliente ?? 0;
  }

  ngOnInit() {
    this.cargar();
    // Datos extra para enriquecer las tarjetas; si fallan, las tarjetas se ven igual con lo básico
    this.ofertaService.listar().subscribe({
      next: (lista) => this.ofertas.set(lista),
      error: () => this.ofertas.set([]),
    });
    this.farmaciaService.listar({ estado: 'activa' }).subscribe({
      next: (lista) => this.datosFarmacias.set(new Map<number, FarmaciaPublica>(lista.map((f) => [f.id!, f] as [number, FarmaciaPublica]))),
      error: () => this.datosFarmacias.set(new Map()),
    });
  }

  cargar() {
    this.favoritoService.medicamentos(this.idCliente).subscribe({
      next: (lista) => {
        this.medicamentos.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisar(mensajeError(e));
      },
    });
    this.favoritoService.farmacias(this.idCliente).subscribe({
      next: (lista) => this.farmacias.set(lista),
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  cambiarPestana(p: Pestana) {
    this.pestana.set(p);
    this.texto.set('');
  }

  // DELETE /api/clientes/{id}/medicamentos-favoritos/{idMedicamento}
  quitarMedicamento(m: MedicamentoFavorito) {
    this.favoritoService.quitarMedicamento(this.idCliente, m.id).subscribe({
      next: () => {
        this.medicamentos.set(this.medicamentos().filter((x) => x.id !== m.id));
        this.snack
          .open('Quitado de favoritos', 'Deshacer', { duration: 5000 })
          .onAction()
          .subscribe(() => this.deshacerMedicamento(m.id));
      },
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  // DELETE /api/clientes/{id}/farmacias-favoritas/{idFarmacia}
  quitarFarmacia(f: FarmaciaFavorita) {
    this.favoritoService.quitarFarmacia(this.idCliente, f.id).subscribe({
      next: () => {
        this.farmacias.set(this.farmacias().filter((x) => x.id !== f.id));
        this.snack
          .open('Farmacia quitada de favoritos', 'Deshacer', { duration: 5000 })
          .onAction()
          .subscribe(() => this.deshacerFarmacia(f.id));
      },
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  private deshacerMedicamento(id: number) {
    this.favoritoService.agregarMedicamento(this.idCliente, id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  private deshacerFarmacia(id: number) {
    this.favoritoService.agregarFarmacia(this.idCliente, id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  verFarmacia(id: number) {
    this.dialog.open(FarmaciaDetalleDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { id },
    });
  }

  urlMapa(f: FarmaciaFavorita): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${f.direccion}, ${f.distrito}`);
  }

  private avisar(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 3000 });
  }
}
