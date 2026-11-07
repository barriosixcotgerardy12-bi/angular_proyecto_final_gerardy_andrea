import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { EstudiantesLista } from './pages/estudiantes-lista/estudiantes-lista';
import { InscripcionesLista } from './pages/inscripciones-lista/inscripciones-lista';
import { Respaldo } from './pages/respaldo/respaldo';
import { EstudianteForm } from './pages/estudiante-form/estudiante-form';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio },
  { path: 'estudiantes', component: EstudiantesLista },
  { path: 'estudiantes/nuevo', component: EstudianteForm },
  { path: 'inscripciones', component: InscripcionesLista },
  { path: 'respaldo', component: Respaldo },
  { path: '**', redirectTo: 'inicio' },
];