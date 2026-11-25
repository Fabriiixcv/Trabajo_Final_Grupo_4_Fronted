import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { FarmaciaFavorita, MedicamentoFavorito } from '../model/favorito';

// Favoritos del cliente: /api/clientes/{id}/medicamentos-favoritos y /farmacias-favoritas
@Injectable({ providedIn: 'root' })
export class FavoritoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clientes`;

  medicamentos(idCliente: number): Observable<MedicamentoFavorito[]> {
    return this.http.get<MedicamentoFavorito[]>(`${this.url}/${idCliente}/medicamentos-favoritos`);
  }

  agregarMedicamento(idCliente: number, idMedicamento: number): Observable<unknown> {
    return this.http.post(`${this.url}/${idCliente}/medicamentos-favoritos`, { idMedicamento });
  }

  quitarMedicamento(idCliente: number, idMedicamento: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${idCliente}/medicamentos-favoritos/${idMedicamento}`);
  }

  farmacias(idCliente: number): Observable<FarmaciaFavorita[]> {
    return this.http.get<FarmaciaFavorita[]>(`${this.url}/${idCliente}/farmacias-favoritas`);
  }

  agregarFarmacia(idCliente: number, idFarmacia: number): Observable<unknown> {
    return this.http.post(`${this.url}/${idCliente}/farmacias-favoritas`, { idFarmacia });
  }

  quitarFarmacia(idCliente: number, idFarmacia: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${idCliente}/farmacias-favoritas/${idFarmacia}`);
  }
}
