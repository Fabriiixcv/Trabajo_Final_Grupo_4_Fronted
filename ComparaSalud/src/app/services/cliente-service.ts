import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Cliente, ClientePublico } from '../model/cliente';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes`;

  // Registro público de cliente (POST /api/clientes)
  insert(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.url, cliente);
  }

  // GET /api/clientes/{id}
  getById(id: number): Observable<ClientePublico> {
    return this.http.get<ClientePublico>(`${this.url}/${id}`);
  }

  // PUT /api/clientes/{id}/nombre
  actualizarNombre(id: number, datos: { nombre: string; apellidos: string }): Observable<ClientePublico> {
    return this.http.put<ClientePublico>(`${this.url}/${id}/nombre`, datos);
  }

  // DELETE /api/clientes/{id}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
