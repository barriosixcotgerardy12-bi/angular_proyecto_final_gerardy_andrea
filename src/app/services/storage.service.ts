import { Injectable } from '@angular/core';

export const CLAVES_STORAGE = {
  estudiantes: 'umes_estudiantes',
  inscripciones: 'umes_inscripciones',
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {
  obtener<T>(clave: string, valorPorDefecto: T): T {
    try {
      const texto = localStorage.getItem(clave);
      return texto ? (JSON.parse(texto) as T) : valorPorDefecto;
    } catch {
      return valorPorDefecto;
    }
  }

  guardar<T>(clave: string, valor: T): void {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  eliminar(clave: string): void {
    localStorage.removeItem(clave);
  }
}