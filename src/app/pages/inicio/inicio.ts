import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { EstudianteService } from '../../services/estudiante.service';
import { InscripcionService } from '../../services/inscripcion.service';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  readonly estudiantes = inject(EstudianteService).estudiantes;
  readonly inscripciones = inject(InscripcionService).inscripciones;

  readonly vigentes = computed(
    () => this.inscripciones().filter(i => i.estado !== 'CANCELADA' && i.estado !== 'RECHAZADA').length
  );
}