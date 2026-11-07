import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogoService } from '../../services/catalogo.service';
import { EstudianteService } from '../../services/estudiante.service';
import { ItemCatalogo } from '../../models/catalogo.model';
import { Estudiante } from '../../models/estudiante.model';
import {
  algunContactoActivo, codigoUnico, fechaNacimientoValida,
  formatoTelefono, mensajeDeError, sinSoloEspacios,
} from '../../validators/validadores';

const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]+$/;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Component({
  selector: 'app-estudiante-form',
  imports: [
    ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule, MatCheckboxModule,
  ],
  templateUrl: './estudiante-form.html',
  styleUrl: './estudiante-form.css',
})
export class EstudianteForm {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private catalogoService = inject(CatalogoService);
  private estudianteService = inject(EstudianteService);

  // Si la ruta trae :id estamos editando; si no, creando
  readonly idEdicion = this.route.snapshot.paramMap.get('id');
  readonly modoEdicion = this.idEdicion !== null;

  readonly generos = toSignal(this.catalogoService.generos$, { initialValue: [] as ItemCatalogo[] });
  readonly carreras = toSignal(this.catalogoService.carreras$, { initialValue: [] as string[] });
  readonly tiposContacto = toSignal(this.catalogoService.tiposContacto$, { initialValue: [] as ItemCatalogo[] });

  readonly form = this.fb.nonNullable.group({
    id: ['', [
      Validators.required, Validators.minLength(3), Validators.maxLength(15),
      Validators.pattern(/^[A-Za-z0-9-]+$/),
      codigoUnico(id => this.estudianteService.existeId(id)),
    ]],
    nombres: ['', [Validators.required, sinSoloEspacios, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(PATRON_NOMBRE)]],
    apellidos: ['', [Validators.required, sinSoloEspacios, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(PATRON_NOMBRE)]],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
    genero: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email, Validators.pattern(PATRON_CORREO), Validators.maxLength(100)]],
    direccion: ['', [Validators.required, sinSoloEspacios, Validators.minLength(5), Validators.maxLength(120)]],
    carreraId: ['', Validators.required],
    observaciones: ['', Validators.maxLength(200)],
    contactos: this.fb.array([this.crearContacto()], algunContactoActivo),
  });

  readonly c = this.form.controls;
  readonly contactos = this.form.controls.contactos;
  readonly mensajeError = mensajeDeError;

  constructor() {
    if (this.idEdicion !== null) {
      const existente = this.estudianteService.obtenerPorId(this.idEdicion);
      if (existente) {
        this.cargarEstudiante(existente);
      } else {
        this.router.navigate(['/estudiantes']);
      }
    }
  }

  private cargarEstudiante(e: Estudiante): void {
    const { contactos, fechaRegistro, ...datos } = e;
    this.form.patchValue(datos);
    this.contactos.clear();
    contactos.forEach(c => this.contactos.push(this.crearContacto(c)));
    this.c.id.disable(); // el código no se cambia al editar
  }

  crearContacto(contacto?: { numero: string; tipo: string; activo: boolean }) {
    return this.fb.nonNullable.group({
      numero: [contacto?.numero ?? '', [Validators.required, formatoTelefono]],
      tipo: [contacto?.tipo ?? 'movil', Validators.required],
      activo: [contacto?.activo ?? true],
    });
  }

  agregarContacto(): void {
    this.contactos.push(this.crearContacto());
  }

  quitarContacto(indice: number): void {
    this.contactos.removeAt(indice);
    this.contactos.markAsTouched();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue(); // incluye el id aunque esté deshabilitado
    const existente = this.idEdicion ? this.estudianteService.obtenerPorId(this.idEdicion) : undefined;

    const estudiante: Estudiante = {
      id: v.id.trim().toUpperCase(),
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      fechaNacimiento: v.fechaNacimiento,
      genero: v.genero,
      correo: v.correo.trim().toLowerCase(),
      direccion: v.direccion.trim(),
      carreraId: v.carreraId,
      observaciones: v.observaciones.trim(),
      contactos: v.contactos.map(c => ({ numero: c.numero.trim(), tipo: c.tipo, activo: c.activo })),
      fechaRegistro: existente?.fechaRegistro ?? new Date().toISOString(),
    };

    if (this.modoEdicion) {
      this.estudianteService.actualizar(estudiante);
      this.snackBar.open('Estudiante actualizado correctamente', 'Cerrar', { duration: 3000 });
    } else if (this.estudianteService.crear(estudiante)) {
      this.snackBar.open('Estudiante registrado correctamente', 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open('Ya existe un estudiante con ese código', 'Cerrar', { duration: 4000 });
      return;
    }

    this.router.navigate(['/estudiantes']);
  }
}