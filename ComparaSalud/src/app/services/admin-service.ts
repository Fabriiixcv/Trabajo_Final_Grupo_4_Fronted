import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ClaveAdmin, TotalAdmin } from '../model/admin';

// Panel del administrador: /api/administradores
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/administradores`;

  // GET /api/administradores/{clave}  ->  { total, detalle }
  total<T = unknown>(clave: ClaveAdmin): Observable<TotalAdmin<T>> {
    return this.http.get<TotalAdmin<T>>(`${this.url}/${clave}`);
  }

  // DELETE /api/administradores/clientes/{id}
  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/clientes/${id}`);
  }

  // DELETE /api/administradores/farmacias/{id}
  bajaFarmacia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/farmacias/${id}`);
  }
}
