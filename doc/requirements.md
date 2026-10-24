# Requirements — API REST Sistema Académico

## 1. Descripción general

Desarrollar una **API REST para la gestión académica de estudiantes**, utilizando:

* **NestJS** como framework backend.
* **TypeScript** como lenguaje de programación.
* **Prisma ORM** para el acceso y gestión de datos.
* **SQLite** como motor de base de datos inicial.
* **Arquitectura MVC** para organizar la aplicación.
* API REST utilizando HTTP y JSON.
* DTOs para validación y transferencia de datos.
* Prisma Migrations para controlar la evolución del esquema de base de datos.

El sistema permitirá administrar estudiantes, cursos, materias, docentes, inscripciones y calificaciones.

La solución debe diseñarse de manera que posteriormente sea posible migrar SQLite a un motor como PostgreSQL sin realizar cambios importantes en la lógica de negocio.

---

# 2. Objetivo general

Construir una API REST que permita gestionar la información académica de una institución educativa, manteniendo relaciones consistentes entre:

```text
ESTUDIANTE
    │
    └── INSCRIPCIÓN
            │
            ├── CURSO
            │      └── MATERIA
            │
            └── CALIFICACIÓN
```

La API deberá permitir consultar el historial académico de un estudiante, conocer los estudiantes inscritos en un curso, administrar materias y cursos, registrar docentes y gestionar las calificaciones obtenidas.

---

# 3. Alcance funcional

El sistema deberá contemplar inicialmente los siguientes módulos:

1. Estudiantes
2. Docentes
3. Cursos
4. Materias
5. Inscripciones
6. Calificaciones
7. Períodos académicos

## 3.1 Entidades principales

### Entidades solicitadas

* `ESTUDIANTE`
* `CALIFICACION`
* `MATERIA`
* `CURSO`

### Entidades recomendadas

Se agregan las siguientes entidades:

* `DOCENTE`
* `INSCRIPCION`
* `PERIODO_ACADEMICO`

### Justificación

`CALIFICACION` no debería relacionarse únicamente con `ESTUDIANTE` y `MATERIA`.

Un estudiante puede cursar la misma materia en diferentes períodos académicos y un curso puede tener diferentes estudiantes.

Por esta razón se propone:

```text
ESTUDIANTE 1 ─────── N INSCRIPCION N ─────── 1 CURSO
                              │
                              │
                              N
                         CALIFICACION
                              │
                              N
                           MATERIA
```

Esto permite conservar correctamente el contexto académico de cada calificación.

---

# 4. Modelo conceptual

## 4.1 Estudiante

Representa a una persona matriculada en la institución.

### Atributos

| Campo           | Tipo     | Obligatorio | Descripción                 |
| --------------- | -------- | ----------: | --------------------------- |
| id              | Int      |          Sí | Identificador único         |
| codigo          | String   |          Sí | Código único del estudiante |
| nombres         | String   |          Sí | Nombres                     |
| apellidos       | String   |          Sí | Apellidos                   |
| documento       | String   |          Sí | Documento de identidad      |
| email           | String   |          No | Correo electrónico          |
| telefono        | String   |          No | Teléfono                    |
| fechaNacimiento | DateTime |          No | Fecha de nacimiento         |
| estado          | Enum     |          Sí | Estado del estudiante       |
| createdAt       | DateTime |          Sí | Fecha de creación           |
| updatedAt       | DateTime |          Sí | Fecha de actualización      |

### Estados

```text
ACTIVO
INACTIVO
EGRESADO
RETIRADO
```

### Reglas

* `codigo` debe ser único.
* `documento` debe ser único.
* No se debe eliminar físicamente un estudiante que tenga historial académico.
* Para estos casos se deberá utilizar el cambio de estado.
* `email`, si existe, debe tener un formato válido.
* Los nombres y apellidos son obligatorios.

---

# 5. Curso

Representa un grupo académico al que pertenecen uno o varios estudiantes.

Ejemplo:

```text
1ro Secundaria A
1ro Secundaria B
2do Secundaria A
```

### Atributos

| Campo     | Tipo     | Obligatorio | Descripción                    |
| --------- | -------- | ----------: | ------------------------------ |
| id        | Int      |          Sí | Identificador                  |
| nombre    | String   |          Sí | Nombre del curso               |
| nivel     | String   |          Sí | Nivel académico                |
| paralelo  | String   |          No | Paralelo                       |
| capacidad | Int      |          No | Cantidad máxima de estudiantes |
| estado    | Enum     |          Sí | Estado del curso               |
| createdAt | DateTime |          Sí | Fecha de creación              |
| updatedAt | DateTime |          Sí | Fecha de actualización         |

### Estados

```text
ACTIVO
INACTIVO
```

### Reglas

* El nombre del curso es obligatorio.
* La capacidad, si existe, debe ser mayor que cero.
* No se debe permitir una inscripción que supere la capacidad máxima.
* Un curso puede tener múltiples estudiantes mediante `INSCRIPCION`.

---

# 6. Materia

Representa una asignatura académica.

Ejemplos:

```text
Matemática
Física
Programación
Historia
Inglés
```

### Atributos

| Campo          | Tipo     | Obligatorio | Descripción                 |
| -------------- | -------- | ----------: | --------------------------- |
| id             | Int      |          Sí | Identificador               |
| codigo         | String   |          Sí | Código único                |
| nombre         | String   |          Sí | Nombre de la materia        |
| descripcion    | String   |          No | Descripción                 |
| horasSemanales | Int      |          No | Cantidad de horas semanales |
| estado         | Enum     |          Sí | Estado                      |
| createdAt      | DateTime |          Sí | Fecha de creación           |
| updatedAt      | DateTime |          Sí | Fecha de actualización      |

### Estados

```text
ACTIVA
INACTIVA
```

### Reglas

* El código debe ser único.
* El nombre es obligatorio.
* Una materia puede estar asociada a múltiples cursos.
* Una materia puede ser impartida por diferentes docentes en diferentes períodos.

---

# 7. Docente

Representa al profesor encargado de impartir una materia.

### Atributos

| Campo     | Tipo     | Obligatorio | Descripción            |
| --------- | -------- | ----------: | ---------------------- |
| id        | Int      |          Sí | Identificador          |
| codigo    | String   |          Sí | Código del docente     |
| nombres   | String   |          Sí | Nombres                |
| apellidos | String   |          Sí | Apellidos              |
| email     | String   |          No | Correo                 |
| telefono  | String   |          No | Teléfono               |
| estado    | Enum     |          Sí | Estado                 |
| createdAt | DateTime |          Sí | Fecha de creación      |
| updatedAt | DateTime |          Sí | Fecha de actualización |

### Estados

```text
ACTIVO
INACTIVO
```

---

# 8. Período académico

Representa el período en el que se desarrollan las actividades académicas.

Ejemplos:

```text
Gestión 2026
Primer Semestre 2026
Segundo Semestre 2026
```

### Atributos

| Campo       | Tipo     | Obligatorio | Descripción            |
| ----------- | -------- | ----------: | ---------------------- |
| id          | Int      |          Sí | Identificador          |
| nombre      | String   |          Sí | Nombre del período     |
| fechaInicio | DateTime |          Sí | Inicio                 |
| fechaFin    | DateTime |          Sí | Fin                    |
| estado      | Enum     |          Sí | Estado                 |
| createdAt   | DateTime |          Sí | Fecha de creación      |
| updatedAt   | DateTime |          Sí | Fecha de actualización |

### Estados

```text
PLANIFICADO
ACTIVO
FINALIZADO
```

### Reglas

* `fechaInicio` debe ser menor que `fechaFin`.
* No deben existir períodos con información inconsistente.
* Un período puede tener múltiples inscripciones.

---

# 9. Inscripción

Esta entidad representa la relación entre un estudiante y un curso durante un período académico.

Es una entidad fundamental del modelo.

### Atributos

| Campo              | Tipo     | Obligatorio | Descripción            |
| ------------------ | -------- | ----------: | ---------------------- |
| id                 | Int      |          Sí | Identificador          |
| estudianteId       | Int      |          Sí | Estudiante             |
| cursoId            | Int      |          Sí | Curso                  |
| periodoAcademicoId | Int      |          Sí | Período académico      |
| fechaInscripcion   | DateTime |          Sí | Fecha de inscripción   |
| estado             | Enum     |          Sí | Estado                 |
| createdAt          | DateTime |          Sí | Fecha de creación      |
| updatedAt          | DateTime |          Sí | Fecha de actualización |

### Estados

```text
ACTIVA
RETIRADA
FINALIZADA
```

### Reglas

* Un estudiante no puede tener dos inscripciones activas en el mismo curso y período.
* No se debe eliminar una inscripción que tenga calificaciones.
* Una inscripción pertenece exactamente a un estudiante.
* Una inscripción pertenece exactamente a un curso.
* Una inscripción pertenece exactamente a un período académico.

### Restricción recomendada

```text
UNIQUE(
    estudianteId,
    cursoId,
    periodoAcademicoId
)
```

---

# 10. Calificación

Representa una calificación obtenida por un estudiante en una materia.

La calificación debe estar relacionada con una inscripción, no directamente únicamente con el estudiante.

### Atributos

| Campo         | Tipo     | Obligatorio | Descripción            |
| ------------- | -------- | ----------: | ---------------------- |
| id            | Int      |          Sí | Identificador          |
| inscripcionId | Int      |          Sí | Inscripción            |
| materiaId     | Int      |          Sí | Materia                |
| docenteId     | Int      |          No | Docente                |
| nota          | Decimal  |          Sí | Calificación           |
| tipo          | Enum     |          Sí | Tipo de evaluación     |
| fecha         | DateTime |          Sí | Fecha                  |
| observacion   | String   |          No | Observación            |
| createdAt     | DateTime |          Sí | Fecha de creación      |
| updatedAt     | DateTime |          Sí | Fecha de actualización |

### Tipos de evaluación

Inicialmente:

```text
PARCIAL
FINAL
PRACTICA
TAREA
PROYECTO
PARTICIPACION
OTRA
```

### Reglas

* La nota debe encontrarse dentro del rango definido por el sistema.
* La materia debe pertenecer al contexto académico correspondiente.
* El estudiante debe tener una inscripción válida.
* El docente debe estar activo cuando se registre una nueva calificación.
* No se debe eliminar físicamente una calificación que forme parte del historial académico.

---

# 11. Relaciones

## 11.1 Estudiante → Inscripción

```text
ESTUDIANTE 1 ───── N INSCRIPCION
```

Un estudiante puede tener múltiples inscripciones a lo largo de diferentes períodos.

---

## 11.2 Curso → Inscripción

```text
CURSO 1 ───── N INSCRIPCION
```

Un curso puede tener múltiples estudiantes.

---

## 11.3 Período → Inscripción

```text
PERIODO_ACADEMICO 1 ───── N INSCRIPCION
```

Un período académico puede contener múltiples inscripciones.

---

## 11.4 Inscripción → Calificación

```text
INSCRIPCION 1 ───── N CALIFICACION
```

Una inscripción puede generar múltiples calificaciones.

---

## 11.5 Materia → Calificación

```text
MATERIA 1 ───── N CALIFICACION
```

Una materia puede tener múltiples calificaciones.

---

## 11.6 Docente → Calificación

```text
DOCENTE 1 ───── N CALIFICACION
```

Un docente puede registrar múltiples calificaciones.

---

# 12. Modelo relacional propuesto

```text
┌─────────────────────┐
│     ESTUDIANTE      │
├─────────────────────┤
│ PK id               │
│ UQ codigo           │
│ UQ documento        │
│ nombres             │
│ apellidos           │
│ email               │
│ telefono            │
│ fechaNacimiento     │
│ estado              │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│     INSCRIPCION     │
├─────────────────────┤
│ PK id               │
│ FK estudianteId     │
│ FK cursoId          │
│ FK periodoId        │
│ fechaInscripcion    │
│ estado              │
└──────┬─────────┬────┘
       │         │
       │         │ N:1
       │         ▼
       │   ┌───────────────┐
       │   │     CURSO     │
       │   ├───────────────┤
       │   │ PK id         │
       │   │ nombre        │
       │   │ nivel         │
       │   │ paralelo      │
       │   │ capacidad     │
       │   │ estado        │
       │   └───────────────┘
       │
       │ 1:N
       ▼
┌─────────────────────┐
│    CALIFICACION     │
├─────────────────────┤
│ PK id               │
│ FK inscripcionId    │
│ FK materiaId        │
│ FK docenteId        │
│ nota                │
│ tipo                │
│ fecha               │
│ observacion         │
└──────┬──────────────┘
       │
       │ N:1
       ▼
┌─────────────────────┐
│       MATERIA       │
├─────────────────────┤
│ PK id               │
│ UQ codigo           │
│ nombre              │
│ descripcion         │
│ horasSemanales      │
│ estado              │
└─────────────────────┘

┌─────────────────────┐
│      DOCENTE        │
├─────────────────────┤
│ PK id               │
│ UQ codigo           │
│ nombres             │
│ apellidos           │
│ email               │
│ telefono            │
│ estado              │
└─────────────────────┘

┌─────────────────────────┐
│   PERIODO_ACADEMICO     │
├─────────────────────────┤
│ PK id                   │
│ nombre                  │
│ fechaInicio             │
│ fechaFin                │
│ estado                  │
└─────────────────────────┘
```

---

# 13. Arquitectura

Se utilizará una arquitectura **MVC**, adaptada a la estructura modular de NestJS.

```text
HTTP Request
     │
     ▼
┌──────────────┐
│  Controller  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Prisma    │
│    Service   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    SQLite    │
└──────────────┘
```

## Responsabilidades

### Controller

Responsable de:

* Recibir solicitudes HTTP.
* Validar parámetros mediante DTOs/pipes.
* Invocar los servicios correspondientes.
* Devolver respuestas HTTP.
* Definir rutas REST.

El controller no deberá contener lógica de negocio ni consultas directas a Prisma.

### Service

Responsable de:

* Implementar reglas de negocio.
* Coordinar operaciones.
* Consultar y modificar información mediante `PrismaService`.
* Validar relaciones entre entidades.
* Manejar excepciones de negocio.

### PrismaService

Responsable de:

* Conectar con Prisma.
* Exponer Prisma Client mediante inyección de dependencias.
* Ejecutar operaciones contra SQLite.
* Gestionar transacciones cuando sean necesarias.

### DTO

Responsable de:

* Definir los datos de entrada.
* Validar tipos.
* Validar campos obligatorios.
* Evitar recibir propiedades no permitidas.

---

# 14. Estructura del proyecto

Se propone una arquitectura modular:

```text
src/
│
├── app.module.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── estudiante/
│   ├── estudiante.module.ts
│   ├── estudiante.controller.ts
│   ├── estudiante.service.ts
│   └── dto/
│       ├── create-estudiante.dto.ts
│       └── update-estudiante.dto.ts
│
├── docente/
│   ├── docente.module.ts
│   ├── docente.controller.ts
│   ├── docente.service.ts
│   └── dto/
│
├── curso/
│   ├── curso.module.ts
│   ├── curso.controller.ts
│   ├── curso.service.ts
│   └── dto/
│
├── materia/
│   ├── materia.module.ts
│   ├── materia.controller.ts
│   ├── materia.service.ts
│   └── dto/
│
├── inscripcion/
│   ├── inscripcion.module.ts
│   ├── inscripcion.controller.ts
│   ├── inscripcion.service.ts
│   └── dto/
│
├── calificacion/
│   ├── calificacion.module.ts
│   ├── calificacion.controller.ts
│   ├── calificacion.service.ts
│   └── dto/
│
└── periodo-academico/
    ├── periodo-academico.module.ts
    ├── periodo-academico.controller.ts
    ├── periodo-academico.service.ts
    └── dto/
```

---

# 15. Configuración de base de datos

La primera versión utilizará SQLite.

La configuración deberá utilizar una variable de entorno:

```env
DATABASE_URL="file:./dev.db"
```

El esquema será administrado mediante Prisma.

Ejemplo conceptual:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

La documentación oficial de NestJS utiliza precisamente SQLite para una configuración local de Prisma y una URL `file:./dev.db`.

Las migraciones deberán gestionarse mediante Prisma Migrate.

---

# 16. API REST

La API deberá utilizar como prefijo:

```text
/api/v1
```

## Estudiantes

```http
GET    /api/v1/estudiantes
GET    /api/v1/estudiantes/:id
POST   /api/v1/estudiantes
PATCH  /api/v1/estudiantes/:id
DELETE /api/v1/estudiantes/:id
```

### Consultas adicionales

```http
GET /api/v1/estudiantes/:id/inscripciones
GET /api/v1/estudiantes/:id/calificaciones
GET /api/v1/estudiantes/:id/historial-academico
```

---

# 17. API de cursos

```http
GET    /api/v1/cursos
GET    /api/v1/cursos/:id
POST   /api/v1/cursos
PATCH  /api/v1/cursos/:id
DELETE /api/v1/cursos/:id
```

### Consultas

```http
GET /api/v1/cursos/:id/estudiantes
GET /api/v1/cursos/:id/materias
```

---

# 18. API de materias

```http
GET    /api/v1/materias
GET    /api/v1/materias/:id
POST   /api/v1/materias
PATCH  /api/v1/materias/:id
DELETE /api/v1/materias/:id
```

---

# 19. API de docentes

```http
GET    /api/v1/docentes
GET    /api/v1/docentes/:id
POST   /api/v1/docentes
PATCH  /api/v1/docentes/:id
DELETE /api/v1/docentes/:id
```

---

# 20. API de inscripciones

```http
GET    /api/v1/inscripciones
GET    /api/v1/inscripciones/:id
POST   /api/v1/inscripciones
PATCH  /api/v1/inscripciones/:id
DELETE /api/v1/inscripciones/:id
```

El endpoint `POST` deberá verificar:

1. Que el estudiante exista.
2. Que el estudiante esté activo.
3. Que el curso exista.
4. Que el curso esté activo.
5. Que el período académico exista.
6. Que el período esté disponible para nuevas inscripciones.
7. Que el estudiante no tenga una inscripción duplicada.
8. Que el curso no haya alcanzado su capacidad máxima.

---

# 21. API de calificaciones

```http
GET    /api/v1/calificaciones
GET    /api/v1/calificaciones/:id
POST   /api/v1/calificaciones
PATCH  /api/v1/calificaciones/:id
DELETE /api/v1/calificaciones/:id
```

### Consultas específicas

```http
GET /api/v1/estudiantes/:id/calificaciones
GET /api/v1/materias/:id/calificaciones
GET /api/v1/docentes/:id/calificaciones
```

---

# 22. Historial académico

El sistema deberá permitir obtener el historial académico de un estudiante.

Ejemplo:

```http
GET /api/v1/estudiantes/15/historial-academico
```

La respuesta deberá agrupar información relacionada:

```json
{
  "estudiante": {
    "id": 15,
    "codigo": "EST-0015",
    "nombre": "Juan Pérez"
  },
  "periodos": [
    {
      "periodo": "Gestión 2026",
      "curso": "3ro Secundaria A",
      "materias": [
        {
          "materia": "Matemática",
          "calificaciones": [
            {
              "tipo": "PARCIAL",
              "nota": 85
            },
            {
              "tipo": "FINAL",
              "nota": 90
            }
          ]
        }
      ]
    }
  ]
}
```

---

# 23. Validaciones

Se deberá utilizar validación mediante DTOs.

Las validaciones mínimas incluyen:

* Campos obligatorios.
* Tipos de datos.
* Longitud mínima y máxima.
* Formato de correo electrónico.
* Valores permitidos para enumeraciones.
* Valores numéricos válidos.
* Fechas válidas.
* Relaciones existentes.
* Restricciones de unicidad.

---

# 24. Manejo de errores

La API deberá utilizar códigos HTTP apropiados.

| Código | Uso                                    |
| ------ | -------------------------------------- |
| 200    | Operación exitosa                      |
| 201    | Registro creado                        |
| 204    | Eliminación/modificación sin contenido |
| 400    | Datos inválidos                        |
| 404    | Recurso no encontrado                  |
| 409    | Conflicto de datos                     |
| 500    | Error interno                          |

Ejemplo:

```json
{
  "statusCode": 404,
  "message": "Estudiante no encontrado",
  "error": "Not Found"
}
```

---

# 25. Reglas de integridad

El sistema deberá garantizar:

* No registrar calificaciones para estudiantes inexistentes.
* No registrar calificaciones para inscripciones inexistentes.
* No registrar inscripciones para estudiantes inactivos.
* No registrar inscripciones en cursos inactivos.
* No permitir duplicidad de inscripciones.
* No permitir materias duplicadas por código.
* No permitir estudiantes duplicados por código.
* No permitir docentes duplicados por código.
* Mantener las relaciones mediante claves foráneas.
* Evitar eliminación física de información que forme parte del historial académico.

---

# 26. Eliminación de información

Se deberá diferenciar entre:

### Eliminación lógica

Aplicable principalmente a:

* Estudiantes
* Docentes
* Cursos
* Materias

Se cambiará:

```text
ACTIVO → INACTIVO
```

### Eliminación física

Podrá utilizarse únicamente cuando:

* No existan relaciones dependientes.
* El registro sea de prueba.
* La eliminación no comprometa el historial académico.

---

# 27. Paginación

Los endpoints que devuelvan colecciones deberán soportar paginación.

Ejemplo:

```http
GET /api/v1/estudiantes?page=1&limit=20
```

Respuesta esperada:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

# 28. Filtros

Los endpoints de consulta deberán permitir filtros.

Ejemplo:

```http
GET /api/v1/estudiantes?estado=ACTIVO
```

```http
GET /api/v1/estudiantes?nombre=Juan
```

```http
GET /api/v1/cursos?nivel=SECUNDARIA
```

```http
GET /api/v1/calificaciones?materiaId=5
```

También deberá contemplarse ordenamiento:

```http
GET /api/v1/estudiantes?sortBy=apellidos&order=asc
```

---

# 29. Transacciones

Las operaciones que involucren múltiples modificaciones deberán utilizar transacciones de Prisma.

Ejemplo:

Crear una inscripción podría requerir:

```text
1. Validar estudiante
2. Validar curso
3. Validar período
4. Verificar capacidad
5. Crear inscripción
```

La operación deberá garantizar consistencia de datos.

---

# 30. Seed inicial

El proyecto deberá incluir datos iniciales para facilitar pruebas.

El seed deberá crear:

### Períodos

```text
Gestión 2026
```

### Cursos

```text
1ro Secundaria A
1ro Secundaria B
2do Secundaria A
```

### Materias

```text
Matemática
Lenguaje
Historia
Inglés
Programación
```

### Docentes

Al menos 3 docentes.

### Estudiantes

Al menos 10 estudiantes.

### Inscripciones

Crear varias inscripciones relacionadas.

### Calificaciones

Crear calificaciones asociadas a las inscripciones.

---

# 31. Documentación de API

La API deberá documentarse utilizando Swagger/OpenAPI.

La documentación deberá permitir:

* Visualizar endpoints.
* Visualizar parámetros.
* Visualizar DTOs.
* Probar endpoints.
* Visualizar respuestas.
* Visualizar códigos HTTP.

La documentación estará disponible inicialmente en:

```text
/api/docs
```

---

# 32. Pruebas

El proyecto deberá contemplar pruebas automatizadas.

## Unitarias

Como mínimo:

* `EstudianteService`
* `CursoService`
* `MateriaService`
* `InscripcionService`
* `CalificacionService`

## Integración

Se deberán probar:

* Creación de estudiante.
* Creación de curso.
* Creación de materia.
* Creación de inscripción.
* Registro de calificación.
* Consulta del historial académico.

## Casos de error

Se deberán probar:

* Estudiante inexistente.
* Curso inexistente.
* Materia inexistente.
* Inscripción duplicada.
* Calificación con nota inválida.
* Inscripción en curso lleno.
* Inscripción de estudiante inactivo.

---

# 33. Seguridad

Aunque la primera versión no requiere autenticación, la arquitectura deberá permitir agregar posteriormente:

```text
JWT
RBAC
Usuarios
Roles
Permisos
```

No se deberá acoplar la lógica académica directamente con un mecanismo específico de autenticación.

---

# 34. Requerimientos no funcionales

## RNF-01 — Arquitectura

El sistema deberá utilizar una arquitectura modular basada en NestJS y MVC.

## RNF-02 — Tipado

Todo el código deberá desarrollarse utilizando TypeScript con tipado estricto.

## RNF-03 — Persistencia

La persistencia deberá realizarse exclusivamente mediante Prisma ORM.

No se deberán realizar consultas SQL directamente desde controllers o services.

## RNF-04 — Base de datos

La primera versión utilizará SQLite.

## RNF-05 — Migraciones

Todos los cambios estructurales de la base de datos deberán gestionarse mediante migraciones de Prisma.

## RNF-06 — Validación

Las entradas HTTP deberán validarse antes de llegar a la lógica de negocio.

## RNF-07 — Mantenibilidad

Cada módulo deberá tener responsabilidades claramente separadas.

## RNF-08 — Escalabilidad

La estructura deberá permitir migrar posteriormente:

```text
SQLite
   ↓
PostgreSQL
```

sin modificar significativamente la lógica de negocio.

---

# 35. Criterios de aceptación generales

El proyecto se considerará funcional cuando:

* [ ] La aplicación NestJS pueda iniciarse correctamente.
* [ ] Prisma esté correctamente integrado.
* [ ] SQLite funcione como base de datos.
* [ ] Existan migraciones funcionales.
* [ ] Exista un seed de datos.
* [ ] Exista módulo de estudiantes.
* [ ] Exista módulo de docentes.
* [ ] Exista módulo de cursos.
* [ ] Exista módulo de materias.
* [ ] Exista módulo de períodos académicos.
* [ ] Exista módulo de inscripciones.
* [ ] Exista módulo de calificaciones.
* [ ] Las relaciones entre entidades funcionen correctamente.
* [ ] Existan DTOs de creación y actualización.
* [ ] Existan validaciones.
* [ ] Existan respuestas HTTP apropiadas.
* [ ] Exista paginación.
* [ ] Existan filtros básicos.
* [ ] Exista documentación Swagger.
* [ ] Existan pruebas unitarias.
* [ ] Existan pruebas de integración.
* [ ] El historial académico pueda consultarse correctamente.
* [ ] No sea posible generar registros académicos inconsistentes.

---

# 36. Decisiones de diseño

## Decisión 1 — No relacionar directamente ESTUDIANTE con CALIFICACION

Se utilizará:

```text
ESTUDIANTE
     ↓
INSCRIPCION
     ↓
CALIFICACION
```

Esto permite conservar el contexto académico.

## Decisión 2 — Separar CURSO y MATERIA

Un curso representa el grupo académico.

Una materia representa la asignatura.

Por lo tanto:

```text
Curso ≠ Materia
```

Ejemplo:

```text
Curso:
3ro Secundaria A

Materias:
- Matemática
- Física
- Historia
- Inglés
```

## Decisión 3 — Incorporar PERIODO_ACADEMICO

Esta entidad permite conservar el historial de diferentes gestiones.

Ejemplo:

```text
Gestión 2025
Gestión 2026
Gestión 2027
```

## Decisión 4 — Incorporar DOCENTE

Permite determinar quién imparte la materia y quién registra una calificación.

## Decisión 5 — Utilizar estados

Se evita eliminar información académica importante y se conserva el historial.

---

# 37. Evolución futura

La primera versión deberá mantenerse deliberadamente sencilla.

En futuras versiones podrían incorporarse:

```text
USUARIO
ROL
PERMISO

AULA
HORARIO

ASISTENCIA

EVALUACION
TIPO_EVALUACION

MALLA_CURRICULAR

PERIODO_ACADEMICO

MATRICULA

PAGO
```

Sin embargo, estas entidades **no deben implementarse en la primera versión** salvo que aparezca un requerimiento funcional que las justifique.

---

# 38. Flujo académico principal

El flujo esperado será:

```text
Crear período
      │
      ▼
Crear curso
      │
      ▼
Crear materias
      │
      ▼
Registrar estudiantes
      │
      ▼
Crear inscripción
      │
      ▼
Asignar materias
      │
      ▼
Registrar calificaciones
      │
      ▼
Consultar historial académico
```

---

# 39. Definition of Done

Una funcionalidad se considerará terminada cuando:

* El endpoint esté implementado.
* El DTO esté definido.
* Las validaciones estén implementadas.
* La lógica de negocio esté ubicada en el Service.
* El acceso a datos utilice Prisma.
* Los errores estén controlados.
* Las relaciones de base de datos estén verificadas.
* Existan pruebas.
* Swagger esté actualizado.
* El código compile sin errores.
* Las migraciones estén actualizadas.
* El comportamiento haya sido probado mediante HTTP.

---

# 40. Resultado esperado

Al finalizar esta primera versión se deberá disponer de una API REST capaz de gestionar:

```text
┌─────────────────────────────────────┐
│       SISTEMA ACADÉMICO API        │
├─────────────────────────────────────┤
│                                     │
│  Estudiantes                        │
│  Docentes                           │
│  Cursos                             │
│  Materias                           │
│  Períodos académicos                │
│  Inscripciones                      │
│  Calificaciones                     │
│                                     │
│  Historial académico                │
│  Filtros                            │
│  Paginación                         │
│  Validaciones                       │
│  Swagger                            │
│  Tests                              │
│                                     │
└─────────────────────────────────────┘
```

La solución deberá estar preparada para evolucionar posteriormente hacia una aplicación académica de mayor escala y para migrar de SQLite a PostgreSQL.

# Importante
- Debes hacer preguntas antes de planificar para tener un mayor contexto del objectivo del proyecto.
