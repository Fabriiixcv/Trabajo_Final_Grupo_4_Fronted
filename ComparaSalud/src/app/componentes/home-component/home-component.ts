import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

// Pantalla pública de bienvenida
@Component({
  imports: [RouterLink, MatAnchor, MatCard, MatCardContent, MatIcon],
  selector: 'app-home-component',
  styleUrl: './home-component.css',
  templateUrl: './home-component.html',
})
export class HomeComponent {
  auth: AuthService = inject(AuthService);

  // Con sesión, el botón principal lleva al panel del rol
  panel = computed(() => {
    const rol = this.auth.sesion()?.rol;
    return rol ? this.auth.inicio(rol) : null;
  });

  pasos = [
    {
      icono: 'search',
      titulo: 'Busca por nombre',
      texto: 'Escribe el medicamento que necesitas y mira qué farmacias lo tienen hoy.',
    },
    {
      icono: 'balance',
      titulo: 'Compara precio y stock',
      texto: 'Ordenamos las ofertas de la más barata a la más cara, con las unidades disponibles.',
    },
    {
      icono: 'location_on',
      titulo: 'Ubica la farmacia',
      texto: 'Revisa la dirección, el horario y las calificaciones, y abre la ruta en el mapa.',
    },
  ];

  beneficios = [
    {
      icono: 'sell',
      titulo: 'Precios sin sorpresas',
      texto: 'Ves el precio real de cada farmacia, ordenado del más barato al más caro.',
      puntos: ['Mejor precio destacado', 'Comparación lado a lado', 'Ofertas y descuentos vigentes'],
    },
    {
      icono: 'inventory_2',
      titulo: 'Stock al día',
      texto: 'Antes de salir de casa sabes si la farmacia tiene las unidades que necesitas.',
      puntos: ['Unidades disponibles', 'Aviso de poco stock', 'Horarios y dirección a mano'],
    },
    {
      icono: 'verified_user',
      titulo: 'Seguridad y confianza',
      texto: 'Farmacias registradas con licencia y calificaciones de otros clientes.',
      puntos: ['Farmacias con licencia', 'Calificaciones reales', 'Tus datos protegidos'],
    },
  ];

  ventajasPaciente = [
    {
      icono: 'savings',
      titulo: 'Compara y ahorra',
      texto: 'Evita pagar de más: mira el mismo medicamento en varias farmacias y elige la mejor opción.',
    },
    {
      icono: 'favorite',
      titulo: 'Guarda tus favoritos',
      texto: 'Marca los medicamentos y farmacias que usas seguido y encuéntralos con un clic.',
    },
    {
      icono: 'star',
      titulo: 'Opiniones reales',
      texto: 'Lee las calificaciones de otras personas y elige una farmacia con confianza.',
    },
  ];

  cifrasPaciente = [
    { valor: '70%', texto: 'Ahorro promedio al comparar' },
    { valor: '15 min', texto: 'Menos tiempo buscando' },
    { valor: '95%', texto: 'Clientes satisfechos' },
    { valor: '4.8★', texto: 'Calificación promedio' },
  ];

  metricasFarmacia = [
    { icono: 'groups', texto: 'Nuevos clientes', valor: '+45%', color: 'azul' },
    { icono: 'inventory', texto: 'Stock visible', valor: '92%', color: 'verde' },
    { icono: 'trending_up', texto: 'Ventas por ofertas', valor: '+30%', color: 'morado' },
  ];

  ventajasFarmacia = [
    {
      icono: 'visibility',
      titulo: 'Más visibilidad',
      texto: 'Llega a las personas que buscan tus productos en tu distrito.',
    },
    {
      icono: 'tune',
      titulo: 'Gestión simple',
      texto: 'Administra tu catálogo, tu stock y tus ofertas desde un solo panel.',
    },
    {
      icono: 'campaign',
      titulo: 'Ofertas que se notan',
      texto: 'Publica promociones y destácalas frente a otras farmacias.',
    },
  ];

  confianza = [
    { logo: 'logo1', nombre: 'Farmacia Central' },
    { logo: 'logo2', nombre: 'Botica del Barrio' },
    { logo: 'logo3', nombre: 'Salud Total' },
    { logo: 'logo4', nombre: 'Farmacia Lima' },
  ];

  preguntas = [
    {
      p: '¿Cuesta algo usar ComparaSalud?',
      r: 'No. Buscar y comparar medicamentos es gratis para los clientes.',
    },
    {
      p: '¿Cómo sé si una farmacia tiene el medicamento?',
      r: 'En cada resultado ves el stock disponible y la etiqueta de “poco stock” cuando quedan pocas unidades.',
    },
    {
      p: '¿Puedo guardar farmacias y medicamentos?',
      r: 'Sí. Con el corazón los guardas en tus favoritos para volver a ellos rápido.',
    },
    {
      p: '¿Cómo publico las ofertas de mi farmacia?',
      r: 'Crea una cuenta de farmacia, registra tus medicamentos y publica tus ofertas desde tu panel.',
    },
  ];
}
