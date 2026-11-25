import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CambioOferta, NuevaOferta, Oferta } from '../model/oferta';

@Injectable({ providedIn: 'root' })
export class OfertaService {
  private readonly http = inject(HttpClient);

  // GET /api/ofertas?farmaciaId=&distrito=  (solo ofertas con stock)
  listar(filtros: { farmaciaId?: string | number; distrito?: string } = {}): Observable<Oferta[]> {
    let params = new HttpParams();
    if (filtros.farmaciaId) params = params.set('farmaciaId', filtros.farmaciaId);
    if (filtros.distrito) params = params.set('distrito', filtros.distrito);
    return this.http.get<Oferta[]>(`${environment.apiUrl}/ofertas`, { params });
  }

  // GET /api/farmacias/{id}/ofertas  (todas las ofertas de una farmacia, también las agotadas)
  deFarmacia(idFarmacia: number): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${environment.apiUrl}/farmacias/${idFarmacia}/ofertas`);
  }

  // POST /api/ofertas
  crear(oferta: NuevaOferta): Observable<Oferta> {
    return this.http.post<Oferta>(`${environment.apiUrl}/ofertas`, oferta);
  }

  // PUT /api/ofertas/{id}  (precio y stock)
  editar(id: number, cambio: CambioOferta): Observable<Oferta> {
    return this.http.put<Oferta>(`${environment.apiUrl}/ofertas/${id}`, cambio);
  }

  // PUT /api/ofertas/{id}/precio-stock  (solo uno de los dos)
  editarPrecioStock(id: number, cambio: CambioOferta): Observable<Oferta> {
    return this.http.put<Oferta>(`${environment.apiUrl}/ofertas/${id}/precio-stock`, cambio);
  }

  // DELETE /api/ofertas/{id}
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/ofertas/${id}`);
  }
}
