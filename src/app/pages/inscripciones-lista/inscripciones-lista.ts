import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-inscripciones-lista',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './inscripciones-lista.html',
  styleUrl: './inscripciones-lista.css',
})
export class InscripcionesLista {}