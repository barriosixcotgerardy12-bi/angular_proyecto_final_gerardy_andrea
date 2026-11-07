import { AbstractControl, ValidationErrors } from '@angular/forms';

export function sinSoloEspacios(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (typeof valor !== 'string' || valor.length === 0) return null;
  return valor.trim().length === 0 ? { soloEspacios: true } : null;
}

export function fechaNacimientoValida(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null;

  const fecha = new Date(valor + 'T00:00:00');
  if (isNaN(fecha.getTime())) return { fechaInvalida: true };

  const hoy = new Date();
  if (fecha > hoy) return { fechaFutura: true };

  let edad = hoy.getFullYear() - fecha.getFullYear();
  const cumpleEsteAnio = new Date(hoy.getFullYear(), fecha.getMonth(), fecha.getDate());
  if (hoy < cumpleEsteAnio) edad--;

  if (edad < 15) return { edadMinima: true };
  if (edad > 100) return { edadMaxima: true };
  return null;
}

export function mensajeDeError(control: AbstractControl, mensajePatron = 'El formato no es válido.'): string {
  if (control.hasError('required')) return 'Este campo es obligatorio.';
  if (control.hasError('soloEspacios')) return 'No puede contener solo espacios.';
  if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
  if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
  if (control.hasError('email')) return 'Escribe un correo electrónico válido.';
  if (control.hasError('pattern')) return mensajePatron;
  if (control.hasError('fechaInvalida')) return 'Ingresa una fecha válida.';
  if (control.hasError('fechaFutura')) return 'La fecha no puede ser futura.';
  if (control.hasError('edadMinima')) return 'El estudiante debe tener al menos 15 años.';
  if (control.hasError('edadMaxima')) return 'La fecha de nacimiento no es razonable.';
  return '';
}