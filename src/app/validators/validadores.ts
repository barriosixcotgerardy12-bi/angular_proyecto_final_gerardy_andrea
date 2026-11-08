import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MAX_CREDITOS, MAX_CURSOS } from '../models/inscripcion.model';

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
  if (control.hasError('telefonoFormato')) return 'Solo se permiten números, espacios, +, - y paréntesis.';
  if (control.hasError('telefonoLongitud')) return 'El número debe tener entre 8 y 15 dígitos.';
  if (control.hasError('codigoDuplicado')) return 'Ya existe un estudiante con este código.';
  if (control.hasError('sinCursos')) return 'Selecciona al menos un curso.';
  if (control.hasError('demasiadosCursos')) return `El máximo es ${MAX_CURSOS} cursos por inscripción.`;
  if (control.hasError('demasiadosCreditos')) return `El máximo es ${MAX_CREDITOS} créditos por inscripción.`;
  return '';
}

export function formatoTelefono(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null;
  if (!/^[0-9+\-\s()]+$/.test(valor)) return { telefonoFormato: true };
  const digitos = valor.replace(/\D/g, '');
  return digitos.length >= 8 && digitos.length <= 15 ? null : { telefonoLongitud: true };
}

export function algunContactoActivo(control: AbstractControl): ValidationErrors | null {
  const contactos = control.value as { activo: boolean }[];
  return contactos.some(c => c.activo) ? null : { sinContactoActivo: true };
}

import { ValidatorFn } from '@angular/forms';  // súbanlo al import de arriba

export function codigoUnico(existe: (id: string) => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string;
    return valor && existe(valor) ? { codigoDuplicado: true } : null;
  };
}
export function seleccionValida(
  maxCursos: number,
  maxCreditos: number,
  creditosDe: (ids: string[]) => number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const ids = control.value as string[];
    if (!ids || ids.length === 0) return { sinCursos: true };
    if (ids.length > maxCursos) return { demasiadosCursos: true };
    if (creditosDe(ids) > maxCreditos) return { demasiadosCreditos: true };
    return null;
  };
}