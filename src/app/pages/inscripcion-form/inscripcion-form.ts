import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { InscripcionService } from '../../services/inscripcion.service';
import { ItemCatalogo } from '../../models/catalogo.model';
import { Curso } from '../../models/curso.model';
import { Inscripcion, MAX_CREDITOS, MAX_CURSOS } from '../../models/inscripcion.model';
import { mensajeDeError, seleccionValida } from '../../validators/validadores';

@Component({
  selector: 'app-inscripcion-form',
  imports: [
    ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatRadioModule, MatCheckboxModule,
  ],
  templateUrl: './inscripcion-form.html',
  styleUrl: './inscripcion-form.css',
})
export class InscripcionForm {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private catalogoService = inject(CatalogoService);
  private estudianteService = inject(EstudianteService);
  private inscripcionService = inject(InscripcionService);

  readonly idEdicion = this.route.snapshot.paramMap.get('id');
  readonly modoEdicion = this.idEdicion !== null;

  readonly estudiantes = this.estudianteService.estudiantes;
  readonly periodos = toSignal(this.catalogoService.periodos$, { initialValue: [] as ItemCatalogo[] });
  readonly jornadas = toSignal(this.catalogoService.jornadas$, { initialValue: [] as ItemCatalogo[] });
  readonly modalidades = toSignal(this.catalogoService.modalidades$, { initialValue: [] as ItemCatalogo[] });
  readonly carreras = toSignal(this.catalogoService.carreras$, { initialValue: [] as string[] });
  private readonly estados = toSignal(this.catalogoService.estados$, { initialValue: [] as ItemCatalogo[] });
  private readonly cursos = toSignal(this.catalogoService.cursos$, { initialValue: [] as Curso[] });

  // "Cancelada" no se elige aquí: se usa la acción Cancelar del listado
  readonly estadosDisponibles = computed(() => this.estados().filter(e => e.id !== 'CANCELADA'));

  readonly maxCursos = MAX_CURSOS;
  readonly maxCreditos = MAX_CREDITOS;

  readonly area = signal('');
  readonly seleccionados = signal<string[]>([]);
  readonly erroresServicio = signal<string[]>([]);

  readonly cursosDelArea = computed(() => this.cursos().filter(c => c.carreraId === this.area()));
  readonly cursosElegidos = computed(() => this.cursos().filter(c => this.seleccionados().includes(c.id)));
  readonly totalCreditos = computed(() => this.inscripcionService.creditosDe(this.seleccionados()));

  readonly form = this.fb.nonNullable.group({
    estudianteId: ['', Validators.required],
    periodoId: ['', Validators.required],
    jornadaId: ['', Validators.required],
    modalidadId: ['', Validators.required],
    estado: ['REGISTRADA', Validators.required],
    cursoIds: [
      [] as string[],
      seleccionValida(MAX_CURSOS, MAX_CREDITOS, ids => this.inscripcionService.creditosDe(ids)),
    ],
    observaciones: ['', Validators.maxLength(200)],
  });

  readonly c = this.form.controls;
  readonly mensajeError = mensajeDeError;

  constructor() {
    // Al elegir un estudiante, se muestran los cursos de su carrera
    this.c.estudianteId.valueChanges.pipe(takeUntilDestroyed()).subscribe(id => {
      const estudiante = this.estudianteService.obtenerPorId(id);
      if (estudiante) this.area.set(estudiante.carreraId);
    });

    if (this.idEdicion !== null) {
      const existente = this.inscripcionService.obtenerPorId(this.idEdicion);
      if (!existente || existente.estado === 'CANCELADA') {
        this.snackBar.open('La inscripción no existe o está cancelada y no se puede editar', 'Cerrar', { duration: 4000 });
        this.router.navigate(['/inscripciones']);
        return;
      }
      const { id, cursoIds, fechaRegistro, ...datos } = existente;
      this.form.patchValue(datos);
      this.fijarSeleccion(cursoIds);
      this.c.estudianteId.disable(); // una inscripción pertenece a un solo estudiante
    }
  }

  private fijarSeleccion(ids: string[]): void {
    this.seleccionados.set(ids);
    this.c.cursoIds.setValue(ids);
    this.c.cursoIds.markAsTouched();
  }

  alternarCurso(id: string): void {
    const actuales = this.seleccionados();
    this.fijarSeleccion(actuales.includes(id) ? actuales.filter(x => x !== id) : [...actuales, id]);
  }

  guardar(): void {
    this.erroresServicio.set([]);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue(); // incluye estudianteId aunque esté deshabilitado
    const existente = this.idEdicion ? this.inscripcionService.obtenerPorId(this.idEdicion) : undefined;

    const inscripcion: Inscripcion = {
      id: existente?.id ?? this.inscripcionService.siguienteId(),
      estudianteId: v.estudianteId,
      periodoId: v.periodoId,
      cursoIds: v.cursoIds,
      jornadaId: v.jornadaId,
      modalidadId: v.modalidadId,
      estado: v.estado,
      observaciones: v.observaciones.trim(),
      fechaRegistro: existente?.fechaRegistro ?? new Date().toISOString(),
    };

    const errores = this.modoEdicion
      ? this.inscripcionService.actualizar(inscripcion)
      : this.inscripcionService.crear(inscripcion);

    if (errores.length > 0) {
      this.erroresServicio.set(errores);
      return;
    }

    this.snackBar.open(
      this.modoEdicion ? 'Inscripción actualizada correctamente' : 'Inscripción registrada correctamente',
      'Cerrar',
      { duration: 3000 }
    );
    this.router.navigate(['/inscripciones']);
  }
}