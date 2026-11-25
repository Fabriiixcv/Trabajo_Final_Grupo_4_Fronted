// GET /administradores/{farmacias|ofertas|clientes|categorias|medicamentos}
export interface TotalAdmin<T = unknown> {
  total: number;
  detalle: T[];
}

export type ClaveAdmin = 'farmacias' | 'ofertas' | 'clientes' | 'categorias' | 'medicamentos';
