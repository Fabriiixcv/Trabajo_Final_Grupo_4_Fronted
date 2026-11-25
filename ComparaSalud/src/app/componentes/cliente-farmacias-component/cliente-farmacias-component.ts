import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
import { FarmaciaPublica } from '../../model/farmacia';
import { Oferta } from '../../model/oferta';
import { AuthService } from '../../services/auth.service';
import { FarmaciaService } from '../../services/farmacia-service';
import { FavoritoService } from '../../services/favorito-service';
import { OfertaService } from '../../services/oferta-service';
import { ESTRELLAS, mensajeError } from '../../utils/utilidades';
import { FarmaciaDetalleDialogComponent } from '../farmacia-detalle-dialog-component/farmacia-detalle-dialog-component';

type Orden = 'nombre' | 'calificacion' | 'productos';

// Quita tildes y pasa a minúsculas para que "Jesus Maria" encuentre "Jesús María"
const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Farmacias: búsqueda por nombre o distrito, ubicación, calificaciones y favoritos (HU10–HU14, HU19, HU26, HU27, HU28, HU47)
@Component({
  imports: [
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
    MatTooltip,
    MatProgressBar,
  ],
  selector: 'app-cliente-farmacias-component',
  styleUrl: './cliente-farmacias-component.css',
  templateUrl: './cliente-farmacias-component.html',
})
export class ClienteFarmaciasComponent implements OnInit {
  auth: AuthService = inject(AuthService);
  farmaciaService: FarmaciaService = inject(FarmaciaService);
  favoritoService: FavoritoService = inject(FavoritoService);
  ofertaService: OfertaService = inject(OfertaService);
  dialog: MatDialog = inject(MatDialog);
  snack: MatSnackBar = inject(MatSnackBar);

  estrellas = ESTRELLAS;

  // Datos
  todas = signal<FarmaciaPublica[]>([]); // farmacias activas
  cargando = signal(true);
  favoritas = signal<Set<number>>(new Set());
  ofertas = signal<Oferta[]>([]);
  calificaciones = signal<Map<number, { promedio: number | null; total: number }>>(new Map());

  // Filtros (se aplican en el momento, sin pulsar "Buscar")
  texto = signal('');
  distrito = signal('');
  soloFavoritas = signal(false);
  orden = signal<Orden>('nombre');

  // Cuántas farmacias hay en cada distrito (para los filtros rápidos)
  distritos = computed(() => {
    const cuenta = new Map<string, number>();
    for (const f of this.todas()) cuenta.set(f.distrito, (cuenta.get(f.distrito) ?? 0) + 1);
    return [...cuenta.entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([nombre, n]) => ({ nombre, n }));
  });

  // Cuántos productos con stock publica cada farmacia
  productos = computed(() => {
    const cuenta = new Map<number, number>();
    for (const o of this.ofertas()) cuenta.set(o.idFarmacia, (cuenta.get(o.idFarmacia) ?? 0) + 1);
    return cuenta;
  });

  hayFiltros = computed(() => !!this.texto().trim() || !!this.distrito() || this.soloFavoritas());

  visibles = computed(() => {
    const q = normalizar(this.texto().trim());
    const distrito = this.distrito();
    const favs = this.favoritas();
    const lista = this.todas().filter(
      (f) =>
        (!distrito || f.distrito === distrito) &&
        (!this.soloFavoritas() || favs.has(f.id!)) &&
        (!q || normalizar(`${f.nombre} ${f.distrito} ${f.direccion}`).includes(q)),
    );
    const porNombre = (a: FarmaciaPublica, b: FarmaciaPublica) => a.nombre.localeCompare(b.nombre, 'es');
    switch (this.orden()) {
      case 'calificacion': {
        const cal = this.calificaciones();
        const nota = (f: FarmaciaPublica) => cal.get(f.id!)?.promedio ?? -1;
        return lista.sort((a, b) => nota(b) - nota(a) || porNombre(a, b));
      }
      case 'productos': {
        const prod = this.productos();
        return lista.sort((a, b) => (prod.get(b.id!) ?? 0) - (prod.get(a.id!) ?? 0) || porNombre(a, b));
      }
      default:
        return lista.sort(porNombre);
    }
  });

  private get idCliente(): number {
    return this.auth.sesion()?.idCliente ?? 0;
  }

  ngOnInit() {
    this.favoritoService.farmacias(this.idCliente).subscribe({
      next: (lista) => this.favoritas.set(new Set(lista.map((f) => f.id))),
      error: (e) => this.avisar(mensajeError(e)),
    });
    this.farmaciaService.listar({ estado: 'activa' }).subscribe({
      next: (lista) => {
        this.todas.set(lista);
        this.cargando.set(false);
        this.cargarCalificaciones(lista);
      },
      error: (e) => {
        this.cargando.set(false);
        this.avisar(mensajeError(e));
      },
    });
    // GET /api/ofertas -> solo para contar los productos de cada farmacia (si falla, no se muestra el dato)
    this.ofertaService.listar().subscribe({
      next: (lista) => this.ofertas.set(lista),
      error: () => this.ofertas.set([]),
    });
  }

  // GET /api/farmacias/{id}/calificaciones de cada farmacia, para las estrellas y el orden
  private cargarCalificaciones(lista: FarmaciaPublica[]) {
    if (!lista.length) return;
    forkJoin(lista.map((f) => this.farmaciaService.calificaciones(f.id!).pipe(catchError(() => of(null))))).subscribe((res) => {
      const mapa = new Map<number, { promedio: number | null; total: number }>();
      res.forEach((r, i) => {
        if (r) mapa.set(lista[i].id!, { promedio: r.promedio, total: r.total });
      });
      this.calificaciones.set(mapa);
    });
  }

  elegirDistrito(nombre: string) {
    this.distrito.set(this.distrito() === nombre ? '' : nombre);
  }

  limpiarFiltros() {
    this.texto.set('');
    this.distrito.set('');
    this.soloFavoritas.set(false);
  }

  // Parte el nombre en trozos para resaltar lo que escribió la persona
  partes(texto: string): { t: string; m: boolean }[] {
    const q = this.texto().trim();
    if (!q) return [{ t: texto, m: false }];
    const nt = normalizar(texto);
    const i = nt.indexOf(normalizar(q));
    if (i < 0 || nt.length !== texto.length) return [{ t: texto, m: false }];
    return [
      { t: texto.slice(0, i), m: false },
      { t: texto.slice(i, i + q.length), m: true },
      { t: texto.slice(i + q.length), m: false },
    ].filter((p) => p.t);
  }

  redondear(n: number | null | undefined): number {
    return Math.round(n ?? 0);
  }

  // Enlace a Google Maps con la dirección de la farmacia (HU47)
  urlMapa(f: FarmaciaPublica): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${f.direccion}, ${f.distrito}`);
  }

  // Agrega o quita la farmacia de favoritos (HU28 / HU51)
  toggleFavorita(id: number) {
    const esFavorita = this.favoritas().has(id);
    const peticion = esFavorita
      ? this.favoritoService.quitarFarmacia(this.idCliente, id)
      : this.favoritoService.agregarFarmacia(this.idCliente, id);
    peticion.subscribe({
      next: () => {
        const nuevo = new Set(this.favoritas());
        if (esFavorita) nuevo.delete(id);
        else nuevo.add(id);
        this.favoritas.set(nuevo);
        this.avisar(esFavorita ? 'Farmacia quitada de favoritos' : 'Farmacia guardada en favoritos');
      },
      error: (e) => this.avisar(mensajeError(e)),
    });
  }

  verDetalle(id: number) {
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
