import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  Comparacion,
  Medicamento,
  MedicamentoBusqueda,
  MedicamentoForm,
  Recomendacion,
  ReportePrecios,
} from '../model/medicamento';

@Injectable({ providedIn: 'root' })
export class MedicamentoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medicamentos`;

  // GET /api/medicamentos/buscar?nombre=
  buscar(nombre: string): Observable<MedicamentoBusqueda[]> {
    return this.http.get<MedicamentoBusqueda[]>(`${this.url}/buscar`, { params: { nombre } });
  }

  // GET /api/medicamentos/{id}
  getById(id: number): Observable<Medicamento> {
    return this.http.get<Medicamento>(`${this.url}/${id}`);
  }

  // GET /api/medicamentos/{id}/recomendaciones
  recomendaciones(id: number): Observable<Recomendacion[]> {
    return this.http.get<Recomendacion[]>(`${this.url}/${id}/recomendaciones`);
  }

  // GET /api/medicamentos/{id}/reporte-precios
  reporte(id: number): Observable<ReportePrecios> {
    return this.http.get<ReportePrecios>(`${this.url}/${id}/reporte-precios`);
  }

  // GET /api/medicamentos/comparacion?ids=1,2
  comparar(ids: number[]): Observable<Comparacion[]> {
    return this.http.get<Comparacion[]>(`${this.url}/comparacion`, {
      params: { ids: ids.join(',') },
    });
  }

  // POST /api/medicamentos
  registrar(datos: MedicamentoForm): Observable<Medicamento> {
    return this.http.post<Medicamento>(this.url, datos);
  }

  // PUT /api/medicamentos/{id}  (solo los que registró la farmacia)
  editar(id: number, datos: MedicamentoForm): Observable<Medicamento> {
    return this.http.put<Medicamento>(`${this.url}/${id}`, datos);
  }

  // DELETE /api/medicamentos/{id}  (administrador: borra también sus ofertas y favoritos)
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
