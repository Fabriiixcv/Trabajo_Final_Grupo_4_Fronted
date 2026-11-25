import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { DatosFarmacia, Farmacia, FarmaciaPublica, PerfilComercial } from '../model/farmacia';
import { CalificacionesFarmacia, NuevaCalificacion, Ubicacion } from '../model/calificacion';

@Injectable({ providedIn: 'root' })
export class FarmaciaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/farmacias`;

  // Registro público de farmacia (POST /api/farmacias)
  insert(farmacia: Farmacia): Observable<Farmacia> {
    return this.http.post<Farmacia>(this.url, farmacia);
  }

  // GET /api/farmacias?nombre=&distrito=&estado=
  listar(filtros: { nombre?: string; distrito?: string; estado?: string } = {}): Observable<FarmaciaPublica[]> {
    let params = new HttpParams();
    if (filtros.nombre) params = params.set('nombre', filtros.nombre);
    if (filtros.distrito) params = params.set('distrito', filtros.distrito);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return this.http.get<FarmaciaPublica[]>(this.url, { params });
  }

  // GET /api/farmacias/{id}
  getById(id: number): Observable<FarmaciaPublica> {
    return this.http.get<FarmaciaPublica>(`${this.url}/${id}`);
  }

  // GET /api/farmacias/{id}/ubicacion
  ubicacion(id: number): Observable<Ubicacion> {
    return this.http.get<Ubicacion>(`${this.url}/${id}/ubicacion`);
  }

  // GET /api/farmacias/{id}/calificaciones
  calificaciones(id: number): Observable<CalificacionesFarmacia> {
    return this.http.get<CalificacionesFarmacia>(`${this.url}/${id}/calificaciones`);
  }

  // POST /api/farmacias/{id}/calificaciones
  calificar(id: number, calificacion: NuevaCalificacion): Observable<unknown> {
    return this.http.post(`${this.url}/${id}/calificaciones`, calificacion);
  }

  // PUT /api/farmacias/{id}
  editar(id: number, datos: DatosFarmacia): Observable<FarmaciaPublica> {
    return this.http.put<FarmaciaPublica>(`${this.url}/${id}`, datos);
  }

  // PUT /api/farmacias/{id}/perfil-comercial
  perfilComercial(id: number, perfil: PerfilComercial): Observable<FarmaciaPublica> {
    return this.http.put<FarmaciaPublica>(`${this.url}/${id}/perfil-comercial`, perfil);
  }
}
