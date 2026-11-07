import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Estudiante } from '../../models/estudiante.model';
import { ItemCatalogo } from '../../models/catalogo.model';
import { CatalogoService } from '../../services/catalogo.service';

@Component({
  selector: 'app-estudiante-detalle',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './estudiante-detalle.html',
  styleUrl: './estudiante-detalle.css',
})
export class EstudianteDetalle {
  readonly e = inject<Estudiante>(MAT_DIALOG_DATA);
  private catalogoService = inject(CatalogoService);

  private generos = toSignal(this.catalogoService.generos$, { initialValue: [] as ItemCatalogo[] });
  private tipos = toSignal(this.catalogoService.tiposContacto$, { initialValue: [] as ItemCatalogo[] });

  nombreGenero(id: string): string {
    return this.generos().find(g => g.id === id)?.nombre ?? id;
  }

  nombreTipo(id: string): string {
    return this.tipos().find(t => t.id === id)?.nombre ?? id;
  }
}