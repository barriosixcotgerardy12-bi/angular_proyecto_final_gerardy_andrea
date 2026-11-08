import { Estudiante } from './estudiante.model';
import { Inscripcion } from './inscripcion.model';

export const VERSION_RESPALDO = 1;

export interface ArchivoRespaldo {
  version: number;
  fechaExportacion: string;
  estudiantes: Estudiante[];
  inscripciones: Inscripcion[];
}

export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
  datos?: { estudiantes: Estudiante[]; inscripciones: Inscripcion[] };
}