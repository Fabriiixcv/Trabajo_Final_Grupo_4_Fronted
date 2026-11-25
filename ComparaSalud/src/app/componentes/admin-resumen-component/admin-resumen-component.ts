import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClaveAdmin } from '../../model/admin';
import { AdminService } from '../../services/admin-service';
import { mensajeError } from '../../utils/utilidades';

interface Kpi {
  clave: ClaveAdmin;
  etiqueta: string;
  icono: string;
  total?: number;
}

// Resumen de la plataforma: totales de farmacias, ofertas, clientes, categorías y medicamentos (HU34, HU36, HU37, HU46, HU50)
@Component({
  imports: [MatCard, MatCardContent, MatIcon],
  selector: 'app-admin-resumen-component',
  styleUrl: './admin-resumen-component.css',
  templateUrl: './admin-resumen-component.html',
})
export class AdminResumenComponent implements OnInit {
  adminService: AdminService = inject(AdminService);
  snack: MatSnackBar = inject(MatSnackBar);

  kpis = signal<Kpi[]>([
    { clave: 'farmacias', etiqueta: 'Farmacias activas', icono: 'store' },
    { clave: 'ofertas', etiqueta: 'Ofertas', icono: 'sell' },
    { clave: 'clientes', etiqueta: 'Clientes registrados', icono: 'group' },
    { clave: 'categorias', etiqueta: 'Categorías', icono: 'category' },
    { clave: 'medicamentos', etiqueta: 'Medicamentos', icono: 'medication' },
  ]);

  ngOnInit() {
    this.cargar();
  }

  // GET /api/administradores/{farmacias|ofertas|clientes|categorias|medicamentos}
  cargar() {
    const actuales = this.kpis();
    forkJoin(actuales.map((k) => this.adminService.total(k.clave))).subscribe({
      next: (respuestas) => this.kpis.set(actuales.map((k, i) => ({ ...k, total: respuestas[i].total }))),
      error: (e) => this.snack.open(mensajeError(e), 'OK', { duration: 3000 }),
    });
  }
}
