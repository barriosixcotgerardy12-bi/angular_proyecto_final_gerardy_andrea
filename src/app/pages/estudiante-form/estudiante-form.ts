import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { CatalogoService } from '../../services/catalogo.service';
import { ItemCatalogo } from '../../models/catalogo.model';
import { fechaNacimientoValida, mensajeDeError, sinSoloEspacios } from '../../validators/validadores';

const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'app-estudiante-form',
  imports: [
    ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule,
  ],
  templateUrl: './estudiante-form.html',
  styleUrl: './estudiante-form.css',
})
export class EstudianteForm {
  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);

  readonly generos = toSignal(this.catalogoService.generos$, { initialValue: [] as ItemCatalogo[] });
  readonly carreras = toSignal(this.catalogoService.carreras$, { initialValue: [] as string[] });

  readonly form = this.fb.nonNullable.group({
    id: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15), Validators.pattern(/^[A-Za-z0-9-]+$/)]],
    nombres: ['', [Validators.required, sinSoloEspacios, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(PATRON_NOMBRE)]],
    apellidos: ['', [Validators.required, sinSoloEspacios, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(PATRON_NOMBRE)]],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
    genero: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email, Validators.pattern(PATRON_CORREO), Validators.maxLength(100)]],
    direccion: ['', [Validators.required, sinSoloEspacios, Validators.minLength(5), Validators.maxLength(120)]],
    carreraId: ['', Validators.required],
    observaciones: ['', Validators.maxLength(200)],
  });

  readonly c = this.form.controls;
  readonly mensajeError = mensajeDeError;

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    console.log(this.form.getRawValue());
  }
}