import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InscripcionService } from '../../services/inscripcion.service';
import { EstudianteService } from '../../services/estudiante.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ItemCatalogo } from '../../models/catalogo.model';
import { Curso } from '../../models/curso.model';
import { Inscripcion } from '../../models/inscripcion.model';
import { ConfirmarDialogo } from '../../components/confirmar-dialogo/confirmar-dialogo';
import { InscripcionDetalle } from '../../components/inscripcion-detalle/inscripcion-detalle';
import { nombreDe } from '../../utils/catalogo.utils';

@Component({
  selector: 'app-inscripciones-lista',
  imports: [
    RouterLink, MatTableModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCardModule,
  ],
  templateUrl: './inscripciones-lista.html',
  styleUrl: './inscripciones-lista.css',
})
export class InscripcionesLista {
  private inscripcionService = inject(InscripcionService);
  private estudianteService = inject(EstudianteService);
  private catalogoService = inject(CatalogoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly inscripciones = this.inscripcionService.inscripciones;
  readonly columnas = ['id', 'estudiante', 'periodo', 'cursos', 'estado', 'acciones'];

  readonly periodos = toSignal(this.catalogoService.periodos$, { initialValue: [] as ItemCatalogo[] });
  readonly estados = toSignal(this.catalogoService.estados$, { initialValue: [] as ItemCatalogo[] });
  private readonly cursos = toSignal(this.catalogoService.cursos$, { initialValue: [] as Curso[] });

  readonly texto = signal('');
  readonly periodoFiltro = signal('');
  readonly estadoFiltro = signal('');

  readonly inscripcionesFiltradas = computed(() => {
    const texto = this.texto().trim().toLowerCase();
    const periodo = this.periodoFiltro();
    const estado = this.estadoFiltro();

    return this.inscripciones().filter(i => {
      const coincideTexto =
        !texto ||
        `${i.estudianteId} ${this.nombreEstudiante(i.estudianteId)}`.toLowerCase().includes(texto);
      const coincidePeriodo = !periodo || i.periodoId === periodo;
      const coincideEstado = !estado || i.estado === estado;
      return coincideTexto && coincidePeriodo && coincideEstado;
    });
  });

  readonly nombre = nombreDe;

  alCambiarTexto(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  nombreEstudiante(id: string): string {
    const e = this.estudianteService.obtenerPorId(id);
    return e ? `${e.nombres} ${e.apellidos}` : `${id} (no encontrado)`;
  }

  nombreCursos(ids: string[]): string {
    return this.cursos()
      .filter(c => ids.includes(c.id))
      .map(c => c.nombre)
      .join(', ');
  }

  ver(i: Inscripcion): void {
    this.dialog.open(InscripcionDetalle, { data: i });
  }

  cancelar(i: Inscripcion): void {
    this.dialog
      .open(ConfirmarDialogo, {
        data: {
          titulo: 'Cancelar inscripción',
          mensaje: `¿Deseas cancelar la inscripción ${i.id} de ${this.nombreEstudiante(i.estudianteId)}? Quedará con estado "Cancelada" y ya no podrá editarse.`,
          textoConfirmar: 'Cancelar inscripción',
        },
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (confirmado) {
          this.inscripcionService.cancelar(i.id);
          this.snackBar.open('Inscripción cancelada', 'Cerrar', { duration: 3000 });
        }
      });
  }

  limpiarFiltros(): void {
    this.texto.set('');
    this.periodoFiltro.set('');
    this.estadoFiltro.set('');
  }
}