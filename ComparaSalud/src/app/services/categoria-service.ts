import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Categoria, CategoriaForm } from '../model/categoria';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  // GET /api/categorias
  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.url);
  }

  // POST /api/categorias
  crear(datos: CategoriaForm): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, datos);
  }

  // PUT /api/categorias/{id}
  editar(id: number, datos: CategoriaForm): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.url}/${id}`, datos);
  }

  // DELETE /api/categorias/{id}
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
