import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Inscripcion } from '../../models/inscripcion.model';
import { ItemCatalogo } from '../../models/catalogo.model';
import { Curso } from '../../models/curso.model';
import { CatalogoService } from '../../services/catalogo.service';
import { EstudianteService } from '../../services/estudiante.service';
import { nombreDe } from '../../utils/catalogo.utils';

@Component({
  selector: 'app-inscripcion-detalle',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './inscripcion-detalle.html',
  styleUrl: './inscripcion-detalle.css',
})
export class InscripcionDetalle {
  readonly i = inject<Inscripcion>(MAT_DIALOG_DATA);
  private catalogoService = inject(CatalogoService);
  private estudianteService = inject(EstudianteService);

  readonly estudiante = this.estudianteService.obtenerPorId(this.i.estudianteId);
  readonly periodos = toSignal(this.catalogoService.periodos$, { initialValue: [] as ItemCatalogo[] });
  readonly jornadas = toSignal(this.catalogoService.jornadas$, { initialValue: [] as ItemCatalogo[] });
  readonly modalidades = toSignal(this.catalogoService.modalidades$, { initialValue: [] as ItemCatalogo[] });
  readonly estados = toSignal(this.catalogoService.estados$, { initialValue: [] as ItemCatalogo[] });
  private readonly cursos = toSignal(this.catalogoService.cursos$, { initialValue: [] as Curso[] });

  readonly cursosInscritos = computed(() => this.cursos().filter(c => this.i.cursoIds.includes(c.id)));
  readonly totalCreditos = computed(() => this.cursosInscritos().reduce((t, c) => t + c.creditos, 0));

  readonly nombre = nombreDe;
}