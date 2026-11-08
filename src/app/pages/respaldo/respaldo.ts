import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EstudianteService } from '../../services/estudiante.service';
import { InscripcionService } from '../../services/inscripcion.service';
import { RespaldoService } from '../../services/respaldo.service';
import { ConfirmarDialogo } from '../../components/confirmar-dialogo/confirmar-dialogo';

@Component({
  selector: 'app-respaldo',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './respaldo.html',
  styleUrl: './respaldo.css',
})
export class Respaldo {
  private respaldoService = inject(RespaldoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  readonly estudiantes = inject(EstudianteService).estudiantes;
  readonly inscripciones = inject(InscripcionService).inscripciones;

  readonly errores = signal<string[]>([]);
  readonly nombreArchivo = signal('');

  exportar(): void {
    this.respaldoService.exportar();
    this.snackBar.open('Respaldo exportado: uniregistro_respaldo.json', 'Cerrar', { duration: 3000 });
  }

  async alSeleccionarArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.errores.set([]);
    if (!archivo) return;
    this.nombreArchivo.set(archivo.name);

    let texto: string;
    try {
      texto = await archivo.text();
    } catch {
      this.errores.set(['No se pudo leer el archivo seleccionado.']);
      input.value = '';
      return;
    }
    input.value = ''; 
    const resultado = await this.respaldoService.validar(texto);
    if (!resultado.valido || !resultado.datos) {
      this.errores.set(resultado.errores);
      return; 
    }

    const datos = resultado.datos;
    this.dialog
      .open(ConfirmarDialogo, {
        data: {
          titulo: 'Importar datos',
          mensaje:
            `Se reemplazarán TODOS los datos actuales (${this.estudiantes().length} estudiantes y ` +
            `${this.inscripciones().length} inscripciones) por los del archivo (${datos.estudiantes.length} ` +
            `estudiantes y ${datos.inscripciones.length} inscripciones). Esta acción no se puede deshacer.`,
          textoConfirmar: 'Reemplazar datos',
        },
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (confirmado) {
          this.respaldoService.reemplazarTodo(datos);
          this.nombreArchivo.set('');
          this.snackBar.open('Datos importados correctamente', 'Cerrar', { duration: 4000 });
        }
      });
  }
}