import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MatToolbar } from '@angular/material/toolbar';
import { Rol } from '../../model/sesion';
import { AuthService } from '../../services/auth.service';

interface Enlace {
  ruta: string;
  texto: string;
  icono: string;
}

// Menú de cada rol (el menú público se arma aparte en la plantilla)
const MENUS: Record<Rol, Enlace[]> = {
  CLIENTE: [
    { ruta: '/cliente/buscar', texto: 'Buscar y comparar', icono: 'search' },
    { ruta: '/cliente/ofertas', texto: 'Ofertas', icono: 'sell' },
    { ruta: '/cliente/farmacias', texto: 'Farmacias', icono: 'store' },
    { ruta: '/cliente/favoritos', texto: 'Favoritos', icono: 'favorite' },
    { ruta: '/cliente/cuenta', texto: 'Mi cuenta', icono: 'account_circle' },
  ],
  FARMACIA: [
    { ruta: '/farmacia/ofertas', texto: 'Mis ofertas', icono: 'sell' },
    { ruta: '/farmacia/medicamentos', texto: 'Medicamentos', icono: 'medication' },
    { ruta: '/farmacia/perfil', texto: 'Mi farmacia', icono: 'storefront' },
  ],
  ADMINISTRADOR: [
    { ruta: '/admin/resumen', texto: 'Resumen', icono: 'dashboard' },
    { ruta: '/admin/categorias', texto: 'Categorías', icono: 'category' },
    { ruta: '/admin/farmacias', texto: 'Farmacias', icono: 'store' },
    { ruta: '/admin/clientes', texto: 'Clientes', icono: 'group' },
    { ruta: '/admin/medicamentos', texto: 'Medicamentos', icono: 'medication' },
  ],
};

// Barra superior: pestañas del rol, chip del usuario y menú desplegable en pantallas pequeñas
@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    MatAnchor,
    MatButton,
    MatIconButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    MatToolbar,
  ],
  selector: 'app-nav-component',
  styleUrl: './nav-component.css',
  templateUrl: './nav-component.html',
})
export class NavComponent {
  auth: AuthService = inject(AuthService);
  router: Router = inject(Router);

  enlaces = computed(() => {
    const rol = this.auth.sesion()?.rol;
    return rol ? MENUS[rol] : [];
  });

  // Etiqueta junto al logo para farmacia y administrador (como en el HTML)
  etiquetaRol = computed(() => {
    const rol = this.auth.sesion()?.rol;
    return rol === 'FARMACIA' ? 'Farmacia' : rol === 'ADMINISTRADOR' ? 'Admin' : '';
  });

  inicial = computed(() => (this.auth.sesion()?.nombre ?? '?').trim().charAt(0).toUpperCase() || '?');

  // El logo lleva a la pantalla principal del rol (o al Home si no hay sesión)
  inicio = computed(() => {
    const rol = this.auth.sesion()?.rol;
    return rol ? this.auth.inicio(rol) : '/';
  });

  cerrarSesion() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
