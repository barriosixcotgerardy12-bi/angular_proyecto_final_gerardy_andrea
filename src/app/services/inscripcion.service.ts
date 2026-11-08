import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Curso } from '../models/curso.model';
import { Inscripcion, MAX_CREDITOS, MAX_CURSOS } from '../models/inscripcion.model';
import { CatalogoService } from './catalogo.service';
import { EstudianteService } from './estudiante.service';
import { CLAVES_STORAGE, StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class InscripcionService {
  private storage = inject(StorageService);
  private estudianteService = inject(EstudianteService);
  private catalogoService = inject(CatalogoService);

  private readonly cursos = toSignal(this.catalogoService.cursos$, { initialValue: [] as Curso[] });

  private readonly _inscripciones = signal<Inscripcion[]>(
    this.storage.obtener<Inscripcion[]>(CLAVES_STORAGE.inscripciones, [])
  );
  readonly inscripciones = this._inscripciones.asReadonly();

  obtenerPorId(id: string): Inscripcion | undefined {
    return this._inscripciones().find(i => i.id === id);
  }

  contarPorEstudiante(estudianteId: string): number {
    return this._inscripciones().filter(i => i.estudianteId === estudianteId).length;
  }

  siguienteId(): string {
    const maximo = this._inscripciones().reduce((m, i) => {
      const n = parseInt(i.id.replace('INS-', ''), 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
    return 'INS-' + String(maximo + 1).padStart(3, '0');
  }

  creditosDe(cursoIds: string[]): number {
    return this.cursos()
      .filter(c => cursoIds.includes(c.id))
      .reduce((total, c) => total + c.creditos, 0);
  }

  validar(i: Inscripcion): string[] {
    const errores: string[] = [];

    if (!this.estudianteService.obtenerPorId(i.estudianteId)) {
      errores.push(`El estudiante "${i.estudianteId}" no existe.`);
    }

    if (i.cursoIds.length === 0) {
      errores.push('Debe seleccionar al menos un curso.');
    }
    if (i.cursoIds.length > MAX_CURSOS) {
      errores.push(`No se pueden seleccionar más de ${MAX_CURSOS} cursos.`);
    }
    if (new Set(i.cursoIds).size !== i.cursoIds.length) {
      errores.push('Hay cursos repetidos en la inscripción.');
    }

    const catalogo = this.cursos();
    if (catalogo.length === 0) {
      errores.push('No se pudo cargar el catálogo de cursos.');
    } else {
      const inexistentes = i.cursoIds.filter(id => !catalogo.some(c => c.id === id));
      if (inexistentes.length > 0) {
        errores.push(`Los siguientes cursos no existen: ${inexistentes.join(', ')}.`);
      } else if (this.creditosDe(i.cursoIds) > MAX_CREDITOS) {
        errores.push(`Se superan los ${MAX_CREDITOS} créditos permitidos.`);
      }
    }

    const duplicada = this._inscripciones().some(
      x =>
        x.id !== i.id &&
        x.estudianteId === i.estudianteId &&
        x.periodoId === i.periodoId &&
        x.estado !== 'CANCELADA' &&
        x.estado !== 'RECHAZADA'
    );
    if (duplicada) {
      errores.push('El estudiante ya tiene una inscripción vigente en ese período.');
    }

    return errores;
  }

  crear(inscripcion: Inscripcion): string[] {
    const errores = this.validar(inscripcion);
    if (errores.length > 0) return errores;
    this.guardarLista([...this._inscripciones(), inscripcion]);
    return [];
  }

  actualizar(inscripcion: Inscripcion): string[] {
    const errores = this.validar(inscripcion);
    if (errores.length > 0) return errores;
    this.guardarLista(this._inscripciones().map(i => (i.id === inscripcion.id ? inscripcion : i)));
    return [];
  }

  cancelar(id: string): void {
    this.guardarLista(
      this._inscripciones().map(i => (i.id === id ? { ...i, estado: 'CANCELADA' } : i))
    );
  }

  eliminarPorEstudiante(estudianteId: string): void {
    this.guardarLista(this._inscripciones().filter(i => i.estudianteId !== estudianteId));
  }

  reemplazarTodos(lista: Inscripcion[]): void {
    this.guardarLista(lista);
  }

  private guardarLista(lista: Inscripcion[]): void {
    this.storage.guardar(CLAVES_STORAGE.inscripciones, lista);
    this._inscripciones.set(lista);
  }
}