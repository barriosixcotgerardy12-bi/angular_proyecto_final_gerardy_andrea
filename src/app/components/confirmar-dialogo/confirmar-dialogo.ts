import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
}

@Component({
  selector: 'app-confirmar-dialogo',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './confirmar-dialogo.html',
  styleUrl: './confirmar-dialogo.css',
})
export class ConfirmarDialogo {
  readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}