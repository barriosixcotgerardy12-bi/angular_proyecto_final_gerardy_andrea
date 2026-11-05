import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { ItemCatalogo } from '../models/catalogo.model';
import { Curso } from '../models/curso.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);

  readonly generos$ = this.cargar<ItemCatalogo>('generos');
  readonly jornadas$ = this.cargar<ItemCatalogo>('jornadas');
  readonly modalidades$ = this.cargar<ItemCatalogo>('modalidades');
  readonly periodos$ = this.cargar<ItemCatalogo>('periodos');
  readonly estados$ = this.cargar<ItemCatalogo>('estados');
  readonly tiposContacto$ = this.cargar<ItemCatalogo>('tipos-contacto');
  readonly cursos$ = this.cargar<Curso>('cursos');

  readonly carreras$ = this.cursos$.pipe(
    map(cursos => [...new Set(cursos.map(c => c.carreraId))].sort())
  );

  cursosDeCarrera(carreraId: string): Observable<Curso[]> {
    return this.cursos$.pipe(
      map(cursos => cursos.filter(c => c.carreraId === carreraId))
    );
  }

  private cargar<T>(archivo: string): Observable<T[]> {
    return this.http.get<T[]>(`assets/data/${archivo}.json`).pipe(shareReplay(1));
  }
}