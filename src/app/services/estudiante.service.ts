import { Injectable, inject, signal } from '@angular/core';
import { Estudiante } from '../models/estudiante.model';
import { CLAVES_STORAGE, StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  private storage = inject(StorageService);

  private readonly _estudiantes = signal<Estudiante[]>(
    this.storage.obtener<Estudiante[]>(CLAVES_STORAGE.estudiantes, [])
  );
  readonly estudiantes = this._estudiantes.asReadonly();

  obtenerPorId(id: string): Estudiante | undefined {
    return this._estudiantes().find(e => e.id === id);
  }

  existeId(id: string): boolean {
    const buscado = id.trim().toUpperCase();
    return this._estudiantes().some(e => e.id.toUpperCase() === buscado);
  }

  crear(estudiante: Estudiante): boolean {
    if (this.existeId(estudiante.id)) {
      return false;
    }
    this.guardarLista([...this._estudiantes(), estudiante]);
    return true;
  }

  actualizar(estudiante: Estudiante): void {
    this.guardarLista(
      this._estudiantes().map(e => (e.id === estudiante.id ? estudiante : e))
    );
  }

  eliminar(id: string): void {
    this.guardarLista(this._estudiantes().filter(e => e.id !== id));
  }

  reemplazarTodos(lista: Estudiante[]): void {
    this.guardarLista(lista);
  }

  private guardarLista(lista: Estudiante[]): void {
    this.storage.guardar(CLAVES_STORAGE.estudiantes, lista);
    this._estudiantes.set(lista);
  }
}