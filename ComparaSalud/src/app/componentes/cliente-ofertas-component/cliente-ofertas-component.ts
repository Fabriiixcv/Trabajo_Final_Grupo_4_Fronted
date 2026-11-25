import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { Oferta } from '../../model/oferta';
import { AuthService } from '../../services/auth.service';
import { FavoritoService } from '../../services/favorito-service';
import { OfertaService } from '../../services/oferta-service';
import { claseStock, mensajeError, textoStock } from '../../utils/utilidades';
import { FarmaciaDetalleDialogComponent } from '../farmacia-detalle-dialog-component/farmacia-detalle-dialog-component';

type Orden = 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre';
type FiltroStock = 'todos' | 'ok' | 'poco';

const TAMANO_PAGINA = 24;
const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Ofertas de las farmacias: filtros, orden y mejor precio de cada medicamento (HU25, HU58)
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
    MatSelect,
    MatOption,
    MatIcon,
    MatProgressBar,
    MatTooltip,
  ],
  selector: 'app-cliente-ofertas-component',
  styleUrl: './cliente-ofertas-component.css',
  templateUrl: './cliente-ofertas-component.html',
})
export class ClienteOfertasComponent implements OnInit {
  auth: AuthService = inject(AuthService);
  ofertaService: OfertaService = inject(OfertaService);
  favoritoService: FavoritoService = inject(FavoritoService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  claseStock = claseStock;
  textoStock = textoStock;

  // Datos
  todas = signal<Oferta[]>([]);
  cargando = signal(true);
  favoritos = signal<Set<number>>(new Set());

  // Filtros (se aplican en el momento)
  texto = signal('');
  farmaciaId = signal<number | ''>('');
  distrito = signal('');
  stock = signal<FiltroStock>('todos');
  orden = signal<Orden>('recientes');
  limite = signal(TAMANO_PAGINA);

  // Opciones de los selectores, sacadas de las propias ofertas
  farmacias = computed(() => {
    const mapa = new Map<number, string>();
    for (const o of this.todas()) mapa.set(o.idFarmacia, o.nombreFarmacia);
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  });
  distritos = computed(() => [...new Set(this.todas().map((o) => o.distrito))].sort((a, b) => a.localeCompare(b, 'es')));

  // Precio más bajo y cantidad de ofertas de cada medicamento (para marcar "Mejor precio")
  minimos = computed(() => {
    const mapa = new Map<number, number>();
    for (const o of this.todas()) {
      const actual = mapa.get(o.idMedicamento);
      if (actual === undefined || o.precio < actual) mapa.set(o.idMedicamento, o.precio);
    }
    return mapa;
  });
  cuenta = computed(() => {
    const mapa = new Map<number, number>();
    for (const o of this.todas()) mapa.set(o.idMedicamento, (mapa.get(o.idMedicamento) ?? 0) + 1);
    return mapa;
  });

  // Cifras de la cabecera
  precioMinimo = computed(() => (this.todas().length ? Math.min(...this.todas().map((o) => o.precio)) : null));
  nFarmacias = computed(() => this.farmacias().length);
  nBuenStock = computed(() => this.todas().filter((o) => o.stock > 10).length);
  nPocoStock = computed(() => this.todas().filter((o) => o.stock > 0 && o.stock <= 10).length);

  hayFiltros = computed(
    () => !!this.texto().trim() || this.farmaciaId() !== '' || !!this.distrito() || this.stock() !== 'todos',
  );

  filtradas = computed(() => {
    const q = normalizar(this.texto().trim());
    const farmacia = this.farmaciaId();
    const distrito = this.distrito();
    const stock = this.stock();
    const lista = this.todas().filter(
      (o) =>
        (!q || normalizar(`${o.nombreMedicamento} ${o.nombreFarmacia}`).includes(q)) &&
        (farmacia === '' || o.idFarmacia === farmacia) &&
        (!distrito || o.distrito === distrito) &&
        (stock === 'todos' || (stock === 'ok' ? o.stock > 10 : o.stock > 0 && o.stock <= 10)),
    );
    switch (this.orden()) {
      case 'precio-asc':
        return lista.sort((a, b) => a.precio - b.precio);
      case 'precio-desc':
        return lista.sort((a, b) => b.precio - a.precio);
      case 'nombre':
        return lista.sort((a, b) => a.nombreMedicamento.localeCompare(b.nombreMedicamento, 'es') || a.precio - b.precio);
      default:
        return lista.sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion));
    }
  });
  visibles = computed(() => this.filtradas().slice(0, this.limite()));

  private get idCliente(): number {
    return this.auth.sesion()?.idCliente ?? 0;
  }

  ngOnInit() {
    // GET /api/ofertas (solo ofertas con stock)
    this.ofertaService.listar().subscribe({
      next: (lista) => {
        this.todas.set(lista);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisar(mensajeError(e));
      },
    });
    this.favoritoService.medicamentos(this.idCliente).subscribe({
      next: (lista) => this.favoritos.set(new Set(lista.map((m) => m.id))),
      error: () => this.favoritos.set(new Set()),
    });
  }

  // Cada cambio de filtro vuelve a la primera página
  setTexto(v: string) {
    this.texto.set(v);
    this.limite.set(TAMANO_PAGINA);
  }
  setFarmacia(v: number | '') {
    this.farmaciaId.set(v);
    this.limite.set(TAMANO_PAGINA);
  }
  setDistrito(v: string) {
    this.distrito.set(v);
    this.limite.set(TAMANO_PAGINA);
  }
  setStock(v: FiltroStock) {
    this.stock.set(v);
    this.limite.set(TAMANO_PAGINA);
  }
  setOrden(v: Orden) {
    this.orden.set(v);
    this.limite.set(TAMANO_PAGINA);
  }
  verMas() {
    this.limite.set(this.limite() + TAMANO_PAGINA);
  }
  limpiarFiltros() {
    this.texto.set('');
    this.farmaciaId.set('');
    this.distrito.set('');
    this.stock.set('todos');
    this.limite.set(TAMANO_PAGINA);
  }

  // ¿Es la más barata de ese medicamento? (solo tiene sentido si hay más de una oferta)
  esMejor(o: Oferta): boolean {
    return (this.cuenta().get(o.idMedicamento) ?? 0) > 1 && o.precio <= (this.minimos().get(o.idMedicamento) ?? o.precio);
  }

  // Cuánto más cara es frente a la más barata (0 si es la mejor o la única)
  extra(o: Oferta): number {
    const dif = o.precio - (this.minimos().get(o.idMedicamento) ?? o.precio);
    return dif > 0.004 ? dif : 0;
  }

  private dias(o: Oferta): number {
    const t = new Date(o.fechaActualizacion).getTime();
    return isNaN(t) ? 999 : Math.floor((Date.now() - t) / 86400000);
  }

  esNueva(o: Oferta): boolean {
    return this.dias(o) <= 2;
  }

  hace(o: Oferta): string {
    const d = this.dias(o);
    if (d >= 999) return '';
    if (d <= 0) return 'Actualizada hoy';
    if (d === 1) return 'Actualizada ayer';
    if (d < 7) return `Actualizada hace ${d} días`;
    const fecha = new Date(o.fechaActualizacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    return `Actualizada el ${fecha}`;
  }

  // Agrega o quita el medicamento de favoritos
  toggleFavorito(idMedicamento: number) {
    const esFavorito = this.favoritos().has(idMedicamento);
    const peticion = esFavorito
      ? this.favoritoService.quitarMedicamento(this.idCliente, idMedicamento)
      : this.favoritoService.agregarMedicamento(this.idCliente, idMedicamento);
    peticion.subscribe({
      next: () => {
        const nuevo = new Set(this.favoritos());
        if (esFavorito) nuevo.delete(idMedicamento);
        else nuevo.add(idMedicamento);
        this.favoritos.set(nuevo);
        this.avisar(esFavorito ? 'Quitado de favoritos' : 'Guardado en favoritos');
      },
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

  private avisar(mensaje: string) {
    this.snack.open(mensaje, 'OK', { duration: 3000 });
  }
}
