# HU-GD-06 – Gestionar habilidades

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar las habilidades deportivas disponibles en el sistema, para disponer de un catálogo de capacidades que puedan ser asignadas a los jugadores.

**Criterios de aceptación:**

- El sistema debe permitir registrar nuevas habilidades.
- Los campos requeridos deben ser validados.
- No se deben permitir habilidades duplicadas.
- El sistema debe permitir consultar las habilidades registradas.
- Se debe poder consultar el detalle de una habilidad.
- Se debe permitir actualizar la información de una habilidad.
- Se debe permitir eliminar una habilidad cuando no existan restricciones que lo impidan.
- Si la habilidad se encuentra asociada con jugadores, el sistema debe validar si puede ser eliminada.

## Dependencias

- **Historias o módulos que deben existir antes:** Ninguna. Es la primera historia del alcance del Integrante 2 y no depende de otros módulos para su CRUD base.
  - *Convención de nomenclatura del equipo:* Directorios, archivos, clases, variables, tabla, columnas, rutas y commits en **inglés** (`skills`, `Skill`, `name`, `description`, `/skills`), alineado con los módulos existentes (`teams`, `tournaments`, `phases`, `matches`).
  - *Integración con HU-GD-07:* La validación real de jugadores asociados al eliminar (criterio 8) se desacopla en `HU-GD-06` mediante el puerto `SkillDependenciesChecker` (`SKILL_DEPENDENCIES_CHECKER`, principio D de SOLID), que inicialmente retorna `false` y se conectará a la tabla intermedia de `HU-GD-07`.
- **Archivos compartidos que se tocarán durante la implementación (en commits separados, avisando al grupo según `flujo-git`):**
  - `src/app.module.ts` (registrar `SkillsModule`).
  - `src/exception/error-case.enum.ts` y `src/exception/global-exception.filter.ts` (agregar `ErrorCase.INVALID_STATE` mapeado a HTTP `409 Conflict`).
  - `jest.config.ts` (configurar `rootDir: '.'` en `ts-jest` para compatibilidad con TypeScript 6).
  - Nueva migración en `src/migrations/1763672400000-CreateSkillsTable.ts` para crear la tabla `skills`.

## Modelo

Referencia: skill `modelo-relacional` (nomenclatura en inglés adoptada por el equipo).

- **Entidad nueva:** `Skill` (tabla `skills`).
  - `id`: entero autoincremental, PK.
  - `name`: `VARCHAR(100)`, obligatorio, no solo espacios, **único** (comparación insensible a mayúsculas/minúsculas y tras `trim`).
  - `description`: `VARCHAR(255)`, obligatoria, no solo espacios (necesaria para la consulta de detalle de la habilidad).
- **Decisión de alcance sobre borrado lógico:** Se mantiene el modelo definido en `HU-GD-06`, `modelo-relacional` y `api-rest`: `Skill` **no** lleva campo `active` ni endpoint de desactivación (`DELETE` físico cuando no existan restricciones).
- **Restricciones e integridad:**
  - Restricción `UNIQUE` sobre `name` en base de datos (respaldada por validación normalizada en el servicio).
  - **Borrado en cascada prohibido:** cuando exista la tabla intermedia en `HU-GD-07`, la FK hacia `skills.id` deberá ser `RESTRICT` y la validación se hará en el servicio.
- **DTOs de respuesta:** nunca exponer la entidad ORM directamente; devolver `SkillResponseDto` (`{ id, name, description }`).

## Endpoints

Rutas basadas en `api-rest` con nomenclatura en inglés adoptada por el equipo (`teams`, `tournaments`, `phases`, `matches`):

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/skills` | `{ name, description }` | `201 Created` (`SkillResponseDto`) | `400 Bad Request` (campos faltantes, solo espacios o exceden longitud), `409 Conflict` (`ALREADY_EXISTS`, nombre duplicado) |
| `GET` | `/skills` | — *(query opcional: `?name=`)* | `200 OK` (`SkillResponseDto[]`) | `400 Bad Request` (parámetros de query inválidos) |
| `GET` | `/skills/:id` | — | `200 OK` (`SkillResponseDto`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`, habilidad no existe) |
| `PUT` | `/skills/:id` | `{ name, description }` | `200 OK` (`SkillResponseDto`) | `400 Bad Request` (`id` no numérico o body inválido), `404 Not Found` (`NOT_FOUND`), `409 Conflict` (`ALREADY_EXISTS`, nombre duplicado con otra habilidad) |
| `DELETE` | `/skills/:id` | — | `204 No Content` | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`), `409 Conflict` (`INVALID_STATE`, habilidad asociada a uno o más jugadores) |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | `name` (máx. 100 caracteres) y `description` (máx. 255 caracteres) son obligatorios, deben ser texto no vacío y no pueden estar compuestos únicamente por espacios en blanco (se recortan con `trim`). | Criterios 2 y 5 (`reglas-dominio`: Duplicados) | `400 Bad Request` |
| R2 | No se permiten habilidades con `name` duplicado. La comparación se realiza sin distinguir mayúsculas/minúsculas y tras recortar espacios (tanto al crear como al actualizar respecto a otro registro). | Criterio 3 (`reglas-dominio`: Duplicados) | `409 Conflict` (`ALREADY_EXISTS`) |
| R3 | El parámetro `:id` en la ruta debe ser numérico válido. | Criterios 5, 6, 7 (`api-rest`: Convenciones de rutas) | `400 Bad Request` |
| R4 | Toda operación sobre `/skills/:id` requiere que la habilidad exista previamente. | Criterios 5, 6, 7 (`reglas-dominio`: Referencias) | `404 Not Found` (`NOT_FOUND`) |
| R5 | No se puede eliminar una habilidad si está asociada a uno o más jugadores (verificado mediante `SkillDependenciesChecker`). Nunca se borra en cascada. | Criterios 7 y 8 (`reglas-dominio`: Habilidades y Borrado; `modelo-relacional`) | `409 Conflict` (`INVALID_STATE`, informando que tiene jugadores asociados) |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El sistema debe permitir registrar nuevas habilidades. | `POST /skills` devuelve `201 Created` y persiste la entidad `Skill` en base de datos. |
| Los campos requeridos deben ser validados. | Validación de `CreateSkillDto` / `UpdateSkillDto` + regla **R1** (`name` y `description` obligatorios, no solo espacios y dentro de longitud máxima → `400 Bad Request`). |
| No se deben permitir habilidades duplicadas. | Regla **R2** en `POST /skills` y `PUT /skills/:id` + restricción `UNIQUE` en BD (`409 Conflict` / `ALREADY_EXISTS`). |
| El sistema debe permitir consultar las habilidades registradas. | `GET /skills` devuelve `200 OK` con el listado de habilidades en formato `SkillResponseDto[]` (opcionalmente filtrable por `?name=`). |
| Se debe poder consultar el detalle de una habilidad. | `GET /skills/:id` con reglas **R3** y **R4** devuelve `200 OK` con `{ id, name, description }` (o `404` si no existe). |
| Se debe permitir actualizar la información de una habilidad. | `PUT /skills/:id` con reglas **R1**, **R2**, **R3** y **R4** actualiza y devuelve `200 OK` con el `SkillResponseDto` actualizado. |
| Se debe permitir eliminar una habilidad cuando no existan restricciones que lo impidan. | `DELETE /skills/:id` con reglas **R3**, **R4** y **R5** elimina la habilidad si no tiene jugadores asociados y devuelve `204 No Content`. |
| Si la habilidad se encuentra asociada con jugadores, el sistema debe validar si puede ser eliminada. | `DELETE /skills/:id` invoca `SkillDependenciesChecker` (regla **R5**) y rechaza el borrado con `409 Conflict` (`INVALID_STATE`) si existen jugadores asociados. |

## Casos límite

- Crear o actualizar una habilidad sin `name`, sin `description`, o con cualquiera de ellos compuesto solo de espacios (`"   "`) → `400 Bad Request`.
- Crear o actualizar con `name` > 100 caracteres o `description` > 255 caracteres → `400 Bad Request`.
- Crear `"Speed"` cuando ya existe `"speed"` o `"  SPEED  "` → `409 Conflict` (`ALREADY_EXISTS`).
- Actualizar una habilidad conservando su mismo `name` (p. ej. cambiando solo `description` o capitalización) → permitido (`200 OK`), no debe marcarse como duplicado contra sí misma.
- Actualizar una habilidad cambiándole el `name` al de otra habilidad existente (sin distinguir mayúsculas/espacios) → `409 Conflict` (`ALREADY_EXISTS`).
- Consultar, actualizar o eliminar con `:id` no numérico (p. ej. `/skills/abc`) → `400 Bad Request`.
- Consultar, actualizar o eliminar un `:id` inexistente → `404 Not Found` (`NOT_FOUND`).
- Enviar campos no permitidos en el body → `400 Bad Request` (`ValidationPipe` global con `forbidNonWhitelisted: true`).
- Intentar eliminar una habilidad que tiene al menos un jugador asociado → `409 Conflict` (`INVALID_STATE`) sin borrar la habilidad ni las asociaciones.
- Consultar `GET /skills` cuando no hay registros → `200 OK` con arreglo vacío `[]`.

## Frontend

- **¿Tiene pantalla?** **No.** Según `AGENTS.md` y `docs/alcance-integrante2.md`, `Skill` (`HU-GD-06`) es **Sin Interfaz (S.I)** — solo backend. Se prueba únicamente con Postman/Newman y pruebas unitarias en Jest. No se deben planificar ni crear vistas en React para esta historia.

## Preguntas abiertas

Ninguna pendiente para iniciar la implementación de `HU-GD-06`.

*Notas coordinadas a nivel de equipo (no bloquean `HU-GD-06`):*
- `src/app.module.ts` conserva temporalmente `synchronize: true` hasta que todo el equipo tenga sus migraciones; esta historia incluye su propia migración en `src/migrations/1763672400000-CreateSkillsTable.ts`.
- Verificar con el grupo si el formato de errores de validación de DTO en `GlobalExceptionFilter` se mantendrá como `{ errorCase: "VALIDATION_ERROR", message: [...] }` o se ajustará al objeto plano `{ "campo": "mensaje" }` indicado en `api-rest`.
