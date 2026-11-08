# UMES · Sistema de gestión de inscripciones universitarias

Proyecto final del curso de Programación Web. Aplicación web para registrar estudiantes y gestionar sus inscripciones a cursos por período académico.

**Integrantes:** [Nombre completo 1] y [Nombre completo 2]

## Tecnologías

- Angular 21 (standalone components, signals, control flow `@if` / `@for`)
- Angular Material y CDK
- Reactive Forms
- TypeScript
- localStorage (sin backend)

## Requisitos

- Node.js 20.19 o superior (recomendado 22 LTS)
- npm
- Angular CLI: `npm install -g @angular/cli`

## Instalación y ejecución

```bash
git clone https://github.com/barriosixcotgerardy12-bi/angular_proyecto_final_[nombre1]_[nombre2].git
cd angular_proyecto_final_[nombre1]_[nombre2]
npm install
ng serve
```

Abrir `http://localhost:4200` en el navegador.

Para generar la versión de producción: `ng build`.

## Funcionalidades

- **Estudiantes:** listado con filtros (texto, género y carrera), crear, editar, consultar y eliminar con confirmación. Formulario reactivo con validaciones, contactos dinámicos (arreglo de objetos con número, tipo y estado activo) y control de código duplicado.
- **Inscripciones:** registrar, listar con filtros (estudiante, período y estado), consultar, editar y cancelar. Los cursos se muestran según el área académica del estudiante.
- **Respaldo:** exportar e importar datos en JSON con validación completa.
- **Diseño responsive:** menú móvil y tablas adaptadas a pantallas pequeñas.

## Estructura del proyecto

```
public/assets/data/        Catálogos JSON de solo lectura (géneros, jornadas, modalidades,
                           períodos, estados, tipos de contacto y cursos)
ejemplos/                  Archivos JSON para probar la importación
src/app/
  models/                  Interfaces TypeScript (Estudiante, Curso, Inscripcion, respaldo)
  services/                Acceso a datos y lógica (Catalogo, Storage, Estudiante,
                           Inscripcion, Respaldo, Pantalla)
  validators/              Validadores personalizados y mensajes de error
  utils/                   Funciones auxiliares
  components/              Diálogos reutilizables (confirmación y detalles)
  pages/                   Páginas: inicio, estudiantes, inscripciones y respaldo
```

## Modelo de datos y relaciones

Un estudiante puede tener varias inscripciones. Cada inscripción pertenece a un solo estudiante y a un período, y puede incluir varios cursos. Las inscripciones guardan **identificadores** (`estudianteId`, `periodoId`, `cursoIds`) y no copian los datos del estudiante ni de los cursos.

```json
{ "id": "INS-001", "estudianteId": "EST-001", "periodoId": "2026-2", "cursoIds": ["WEB101", "BD101"], "estado": "REGISTRADA" }
```

Al guardar o importar una inscripción se comprueba que el estudiante y todos los cursos existan.

## Reglas de negocio de las inscripciones

- Entre 1 y 6 cursos por inscripción, sin repetidos.
- Máximo 24 créditos por inscripción.
- Un estudiante no puede tener dos inscripciones vigentes (distintas de Cancelada o Rechazada) en el mismo período.
- Una inscripción cancelada no se puede editar.
- Al eliminar un estudiante se eliminan también sus inscripciones.

## Persistencia

Los estudiantes y las inscripciones se guardan en `localStorage` mediante `StorageService`, y los componentes nunca acceden directamente a `localStorage`. Los catálogos se leen desde los JSON de `public/assets/data/`.

## Exportación e importación de datos

**Exportar:** en la página *Respaldo*, el botón «Exportar datos» descarga `uniregistro_respaldo.json` con esta estructura:

```json
{
  "version": 1,
  "fechaExportacion": "2026-11-08T12:00:00.000Z",
  "estudiantes": [],
  "inscripciones": []
}
```

Los catálogos no se exportan porque son archivos estáticos del proyecto.

**Importar:** el botón «Importar datos» permite elegir un archivo JSON. Antes de guardar cualquier cambio, la aplicación valida:

1. Que el contenido sea JSON válido.
2. Que tenga la versión esperada y las colecciones `estudiantes` e `inscripciones`.
3. Que cada registro tenga los campos requeridos con el tipo correcto (correo, fecha, contactos, etc.).
4. Que los valores existan en los catálogos (género, carrera, período, jornada, modalidad, estado, cursos).
5. Que no haya códigos repetidos y que cada inscripción haga referencia a un estudiante existente en el archivo.

Si todo es válido, se muestra una advertencia y se pide confirmación, porque la importación **reemplaza todos los datos actuales**. Si el archivo es inválido se muestran los errores y los datos existentes no se modifican.

### Pruebas realizadas

- Exportación de datos y descarga del archivo.
- Importación correcta de `ejemplos/respaldo_valido.json`.
- Importación rechazada de `ejemplos/respaldo_invalido.json` (estudiante y curso inexistentes), conservando los datos actuales.
- Importación rechazada de un archivo con JSON dañado.