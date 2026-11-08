import { Injectable, inject } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ItemCatalogo } from '../models/catalogo.model';
import { Estudiante } from '../models/estudiante.model';
import { Inscripcion } from '../models/inscripcion.model';
import { ArchivoRespaldo, ResultadoValidacion, VERSION_RESPALDO } from '../models/respaldo.model';
import { CatalogoService } from './catalogo.service';
import { EstudianteService } from './estudiante.service';
import { InscripcionService } from './inscripcion.service';
import { CLAVES_STORAGE, StorageService } from './storage.service';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO = /^[0-9+\-\s()]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ERRORES = 10;

type Registro = Record<string, unknown>;

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

@Injectable({ providedIn: 'root' })
export class RespaldoService {
  private storage = inject(StorageService);
  private catalogoService = inject(CatalogoService);
  private estudianteService = inject(EstudianteService);
  private inscripcionService = inject(InscripcionService);

  exportar(): void {
    const respaldo: ArchivoRespaldo = {
      version: VERSION_RESPALDO,
      fechaExportacion: new Date().toISOString(),
      estudiantes: this.storage.obtener<Estudiante[]>(CLAVES_STORAGE.estudiantes, []),
      inscripciones: this.storage.obtener<Inscripcion[]>(CLAVES_STORAGE.inscripciones, []),
    };

    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'uniregistro_respaldo.json';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  async validar(texto: string): Promise<ResultadoValidacion> {
    // 1. Sintaxis
    let contenido: unknown;
    try {
      contenido = JSON.parse(texto);
    } catch {
      return { valido: false, errores: ['El archivo no contiene JSON válido (puede estar dañado o incompleto).'] };
    }

    if (!esRegistro(contenido)) {
      return { valido: false, errores: ['El archivo no tiene la estructura esperada de un respaldo.'] };
    }

    const estructura: string[] = [];
    if (contenido['version'] !== VERSION_RESPALDO) {
      estructura.push(`Versión de formato no compatible (se esperaba la versión ${VERSION_RESPALDO}).`);
    }
    const listaE = contenido['estudiantes'];
    const listaI = contenido['inscripciones'];
    if (!Array.isArray(listaE)) estructura.push('Falta la colección "estudiantes" o no es una lista.');
    if (!Array.isArray(listaI)) estructura.push('Falta la colección "inscripciones" o no es una lista.');
    if (!Array.isArray(listaE) || !Array.isArray(listaI) || estructura.length > 0) {
      return { valido: false, errores: estructura };
    }

    const cat = await firstValueFrom(
      forkJoin({
        generos: this.catalogoService.generos$,
        tipos: this.catalogoService.tiposContacto$,
        periodos: this.catalogoService.periodos$,
        jornadas: this.catalogoService.jornadas$,
        modalidades: this.catalogoService.modalidades$,
        estados: this.catalogoService.estados$,
        cursos: this.catalogoService.cursos$,
      })
    ).catch(() => null);

    if (!cat) {
      return { valido: false, errores: ['No se pudieron cargar los catálogos para validar el archivo.'] };
    }

    const ids = (lista: ItemCatalogo[]) => new Set(lista.map(x => x.id));
    const generos = ids(cat.generos);
    const tipos = ids(cat.tipos);
    const periodos = ids(cat.periodos);
    const jornadas = ids(cat.jornadas);
    const modalidades = ids(cat.modalidades);
    const estados = ids(cat.estados);
    const cursosValidos = new Set(cat.cursos.map(c => c.id));
    const carreras = new Set(cat.cursos.map(c => c.carreraId));

    const errores: string[] = [];

    const idsEstudiantes = new Set<string>();
    listaE.forEach((item: unknown, n: number) => {
      const et = `Estudiante #${n + 1}`;
      if (!esRegistro(item)) {
        errores.push(`${et}: no es un objeto válido.`);
        return;
      }

      for (const campo of ['id', 'nombres', 'apellidos', 'direccion', 'fechaRegistro']) {
        if (!esTexto(item[campo])) errores.push(`${et}: falta el campo "${campo}" o está vacío.`);
      }
      if (typeof item['observaciones'] !== 'string') {
        errores.push(`${et}: el campo "observaciones" debe ser texto.`);
      }

      const id = item['id'];
      if (esTexto(id)) {
        if (idsEstudiantes.has(id)) errores.push(`${et}: el código "${id}" está repetido.`);
        idsEstudiantes.add(id);
      }

      const genero = item['genero'];
      if (!esTexto(genero) || !generos.has(genero)) errores.push(`${et}: género inválido.`);

      const carrera = item['carreraId'];
      if (!esTexto(carrera) || !carreras.has(carrera)) errores.push(`${et}: carrera inválida.`);

      const correo = item['correo'];
      if (!esTexto(correo) || !CORREO.test(correo)) errores.push(`${et}: correo electrónico inválido.`);

      const fecha = item['fechaNacimiento'];
      if (!esTexto(fecha) || !FECHA.test(fecha) || isNaN(new Date(fecha + 'T00:00:00').getTime())) {
        errores.push(`${et}: fecha de nacimiento inválida (formato yyyy-MM-dd).`);
      }

      const contactos = item['contactos'];
      if (!Array.isArray(contactos)) {
        errores.push(`${et}: "contactos" debe ser una lista.`);
      } else {
        contactos.forEach((c: unknown, k: number) => {
          const ec = `${et}, contacto #${k + 1}`;
          if (!esRegistro(c)) {
            errores.push(`${ec}: no es un objeto válido.`);
            return;
          }
          const numero = c['numero'];
          const digitos = esTexto(numero) ? numero.replace(/\D/g, '').length : 0;
          if (!esTexto(numero) || !TELEFONO.test(numero) || digitos < 8 || digitos > 15) {
            errores.push(`${ec}: número inválido.`);
          }
          const tipo = c['tipo'];
          if (!esTexto(tipo) || !tipos.has(tipo)) errores.push(`${ec}: tipo de contacto inválido.`);
          if (typeof c['activo'] !== 'boolean') errores.push(`${ec}: "activo" debe ser true o false.`);
        });
      }
    });

    const idsInscripciones = new Set<string>();
    listaI.forEach((item: unknown, n: number) => {
      const et = `Inscripción #${n + 1}`;
      if (!esRegistro(item)) {
        errores.push(`${et}: no es un objeto válido.`);
        return;
      }

      const id = item['id'];
      if (!esTexto(id)) {
        errores.push(`${et}: falta el campo "id".`);
      } else {
        if (idsInscripciones.has(id)) errores.push(`${et}: el código "${id}" está repetido.`);
        idsInscripciones.add(id);
      }

      const estudianteId = item['estudianteId'];
      if (!esTexto(estudianteId)) {
        errores.push(`${et}: falta "estudianteId".`);
      } else if (!idsEstudiantes.has(estudianteId)) {
        errores.push(`${et}: el estudiante "${estudianteId}" no existe en el archivo.`);
      }

      const periodo = item['periodoId'];
      if (!esTexto(periodo) || !periodos.has(periodo)) errores.push(`${et}: período inválido.`);
      const jornada = item['jornadaId'];
      if (!esTexto(jornada) || !jornadas.has(jornada)) errores.push(`${et}: jornada inválida.`);
      const modalidad = item['modalidadId'];
      if (!esTexto(modalidad) || !modalidades.has(modalidad)) errores.push(`${et}: modalidad inválida.`);
      const estado = item['estado'];
      if (!esTexto(estado) || !estados.has(estado)) errores.push(`${et}: estado inválido.`);

      if (typeof item['observaciones'] !== 'string') errores.push(`${et}: "observaciones" debe ser texto.`);
      if (!esTexto(item['fechaRegistro'])) errores.push(`${et}: falta "fechaRegistro".`);

      const cursoIds = item['cursoIds'];
      if (!Array.isArray(cursoIds) || cursoIds.length === 0) {
        errores.push(`${et}: "cursoIds" debe ser una lista con al menos un curso.`);
      } else {
        if (new Set(cursoIds).size !== cursoIds.length) errores.push(`${et}: hay cursos repetidos.`);
        cursoIds.forEach((cursoId: unknown) => {
          if (!esTexto(cursoId) || !cursosValidos.has(cursoId)) {
            errores.push(`${et}: el curso "${String(cursoId)}" no existe en el catálogo.`);
          }
        });
      }
    });

    if (errores.length > 0) {
      const mostrados = errores.slice(0, MAX_ERRORES);
      if (errores.length > MAX_ERRORES) {
        mostrados.push(`…y ${errores.length - MAX_ERRORES} error(es) más.`);
      }
      return { valido: false, errores: mostrados };
    }

    return {
      valido: true,
      errores: [],
      datos: { estudiantes: listaE as Estudiante[], inscripciones: listaI as Inscripcion[] },
    };
  }

  reemplazarTodo(datos: { estudiantes: Estudiante[]; inscripciones: Inscripcion[] }): void {
    this.estudianteService.reemplazarTodos(datos.estudiantes);
    this.inscripcionService.reemplazarTodos(datos.inscripciones);
  }
}