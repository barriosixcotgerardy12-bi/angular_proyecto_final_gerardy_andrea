import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { EstudianteService } from '../../services/estudiante.service';
import { CatalogoService } from '../../services/catalogo.service';
import { ItemCatalogo } from '../../models/catalogo.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Estudiante } from '../../models/estudiante.model';
import { ConfirmarDialogo } from '../../components/confirmar-dialogo/confirmar-dialogo';
import { EstudianteDetalle } from '../../components/estudiante-detalle/estudiante-detalle';
import { InscripcionService } from '../../services/inscripcion.service';

@Component({
  selector: 'app-estudiantes-lista',
  imports: [RouterLink, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatCardModule],
  templateUrl: './estudiantes-lista.html',
  styleUrl: './estudiantes-lista.css',
})
export class EstudiantesLista {
  private estudianteService = inject(EstudianteService);
  private catalogoService = inject(CatalogoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private inscripcionService = inject(InscripcionService);

  readonly estudiantes = this.estudianteService.estudiantes;
  readonly columnas = ['id', 'nombre', 'correo', 'genero', 'carrera', 'acciones'];

  readonly generos = toSignal(this.catalogoService.generos$, { initialValue: [] as ItemCatalogo[] });
  readonly carreras = toSignal(this.catalogoService.carreras$, { initialValue: [] as string[] });

  readonly texto = signal('');
  readonly generoFiltro = signal('');
  readonly carreraFiltro = signal('');

  readonly estudiantesFiltrados = computed(() => {
    const texto = this.texto().trim().toLowerCase();
    const genero = this.generoFiltro();
    const carrera = this.carreraFiltro();

    return this.estudiantes().filter(e => {
      const coincideTexto =
        !texto || `${e.id} ${e.nombres} ${e.apellidos} ${e.correo}`.toLowerCase().includes(texto);
      const coincideGenero = !genero || e.genero === genero;
      const coincideCarrera = !carrera || e.carreraId === carrera;
      return coincideTexto && coincideGenero && coincideCarrera;
    });
  });

  alCambiarTexto(evento: Event): void {
    this.texto.set((evento.target as HTMLInputElement).value);
  }

  nombreGenero(id: string): string {
    return this.generos().find(g => g.id === id)?.nombre ?? id;
  }

    ver(e: Estudiante): void {
    this.dialog.open(EstudianteDetalle, { data: e });
  }

    eliminar(e: Estudiante): void {
    const cantidad = this.inscripcionService.contarPorEstudiante(e.id);
    const aviso = cantidad > 0 ? ` También se eliminarán sus ${cantidad} inscripción(es).` : '';

    this.dialog
      .open(ConfirmarDialogo, {
        data: {
          titulo: 'Eliminar estudiante',
          mensaje: `¿Seguro que deseas eliminar a ${e.nombres} ${e.apellidos} (${e.id})?${aviso} Esta acción no se puede deshacer.`,
          textoConfirmar: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (confirmado) {
          this.inscripcionService.eliminarPorEstudiante(e.id);
          this.estudianteService.eliminar(e.id);
          this.snackBar.open('Estudiante eliminado', 'Cerrar', { duration: 3000 });
        }
      });
  }

  limpiarFiltros(): void {
    this.texto.set('');
    this.generoFiltro.set('');
    this.carreraFiltro.set('');
  }
}