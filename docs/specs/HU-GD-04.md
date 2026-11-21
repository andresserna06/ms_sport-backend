# HU-GD-04 – Gestionar jugadores

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar la información de los jugadores, para mantener actualizado el registro de las personas que pueden integrar los diferentes equipos.

**Criterios de aceptación:**

- El sistema debe permitir registrar un jugador con su información requerida.
- Los campos obligatorios deben ser validados.
- No se deben permitir jugadores duplicados cuando exista un identificador único.
- El sistema debe permitir consultar los jugadores registrados.
- Se debe poder consultar el detalle de un jugador.
- Se debe permitir actualizar la información de un jugador.
- Se debe permitir eliminar o desactivar un jugador cuando las reglas del sistema lo permitan.
- La eliminación de un jugador debe validar previamente si tiene información asociada.
- Los cambios deben quedar almacenados correctamente.

## Dependencias

- **Historias o módulos que deben existir antes:** Ninguna dentro de `ms_sports`.
  - *Relación con `ms_seguridad` (criterio del docente):* `Player` hereda conceptualmente de `User` en `ms_seguridad` mediante `userId` (`user_id`, entero positivo compatible con `Long` de `ms_seguridad`, obligatorio y `UNIQUE`, sin FK entre bases de datos). **No** se duplican campos que ya pertenecen a `User`/`Profile` en `ms_seguridad` (`name`, `email`, `password`, `birthDate`, `phone`, `photo`, `city`, `bio`, `role`).
  - *Convención de nomenclatura del equipo:* Directorios, archivos, clases, variables, tabla, columnas, rutas y commits en **inglés** (`players`, `Player`, `userId`, `document`, `position`, `jerseyNumber`, `active`, `/players`), manteniendo mensajes de error y datos de prueba de usuario en español.
  - *Integración futura (HU-GD-05, HU-GD-07, HU-GC-07):* La validación real de dependencias al eliminar un jugador (contratos históricos o vigentes, habilidades asignadas, anotaciones) se desacopla mediante el puerto `PlayerDependenciesChecker` (`PLAYER_DEPENDENCIES_CHECKER`, principio D de SOLID), que inicialmente retorna `false` y se conectará al implementar esas historias.
- **Archivos compartidos que se tocarán durante la implementación (en commits separados, avisando al grupo según `flujo-git`):**
  - `src/app.module.ts` (registrar `PlayersModule`).
  - `src/exception/error-case.enum.ts` y `src/exception/global-exception.filter.ts` (agregar `ErrorCase.INVALID_STATE` mapeado a HTTP `409 Conflict`, si aún no está en `main`).
  - `src/main.ts` (agregar `PUT` a los métodos permitidos de CORS, ya que `HU-GD-04` es **Interfaz Requerida**).
  - `jest.config.ts` (configurar `rootDir: '.'` en `ts-jest` para compatibilidad con TypeScript 6, si aún no está en `main`).
  - Nueva migración en `src/migrations/1763676000000-CreatePlayersTable.ts` para crear la tabla `players`.

## Modelo

Referencia: principio de no duplicación con `ms_seguridad` (criterio del docente) + reglas de integridad de `modelo-relacional`.

- **Entidad nueva:** `Player` (tabla `players`).
  - `id`: entero autoincremental, PK.
  - `userId` (columna `user_id`): entero positivo (`>= 1`), obligatorio, **único** (enlaza con `users.id` en `ms_seguridad`, sin FK entre BDs).
  - `document`: `VARCHAR(30)`, obligatorio, no solo espacios, **único** (identificador único del jugador; comparado sin distinguir mayúsculas/minúsculas y tras `trim`).
  - `position`: `VARCHAR(60)`, opcional (`nullable: true`, posición deportiva, p. ej. `"Delantero"`, `"Base"`, `"Portero"`).
  - `jerseyNumber` (columna `jersey_number`): entero (`0` a `99`), opcional (`nullable: true`, número de camiseta/dorsal).
  - `active`: `BOOLEAN`, valor por defecto `true`.
- **Restricciones e integridad:**
  - Restricciones `UNIQUE` sobre `user_id` y sobre `document` en base de datos (respaldadas por validación en el servicio).
  - **Borrado en cascada prohibido:** las futuras FKs desde contratos (`HU-GD-05`), habilidades del jugador (`HU-GD-07`) y anotaciones (`HU-GC-07`) hacia `players.id` deberán ser `RESTRICT` y validarse en el servicio.
- **DTOs de respuesta:** nunca exponer la entidad ORM directamente; devolver `PlayerResponseDto` (`{ id, userId, document, position, jerseyNumber, active }`).

## Endpoints

Rutas basadas en `api-rest` con nomenclatura en inglés adoptada por el equipo:

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/players` | `{ userId, document, position?, jerseyNumber? }` | `201 Created` (`PlayerResponseDto`) | `400 Bad Request` (campos inválidos/faltantes/solo espacios), `409 Conflict` (`ALREADY_EXISTS`, `document` o `userId` duplicado) |
| `GET` | `/players` | — *(query opcionales validados con DTO: `?active=`, `?all=`, `?document=`, `?position=`)* | `200 OK` (`PlayerResponseDto[]`, por defecto solo activos, ordenados por `id ASC`) | `400 Bad Request` (parámetros de query inválidos) |
| `GET` | `/players/:id` | — | `200 OK` (`PlayerResponseDto`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`, jugador no existe) |
| `PUT` | `/players/:id` | `{ userId, document, position?, jerseyNumber? }` | `200 OK` (`PlayerResponseDto`) | `400 Bad Request` (`id` no numérico o body inválido), `404 Not Found` (`NOT_FOUND`), `409 Conflict` (`ALREADY_EXISTS`, `document` o `userId` duplicado con otro jugador) |
| `DELETE` | `/players/:id` | — | `204 No Content` | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`), `409 Conflict` (`INVALID_STATE`, jugador tiene contratos, habilidades o anotaciones asociadas) |
| `PATCH` | `/players/:id/deactivate` | — | `200 OK` (`PlayerResponseDto` con `active: false`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`) |
| `PATCH` | `/players/:id/activate` | — | `200 OK` (`PlayerResponseDto` con `active: true`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`) |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | `userId` (entero ≥ 1) y `document` (texto no vacío ni solo espacios, máx. 30 caracteres) son obligatorios. `position` (opcional, máx. 60, no solo espacios si se envía) y `jerseyNumber` (opcional, entero entre 0 y 99) se validan si se proporcionan. | Criterios 1 y 2 (`reglas-dominio`: Duplicados) | `400 Bad Request` |
| R2 | No se permiten jugadores con `document` duplicado (comparación sin distinguir mayúsculas/minúsculas y tras `trim`) ni con `userId` duplicado (tanto al crear como al actualizar respecto a otro jugador). | Criterio 3 (`reglas-dominio`: Jugadores y Duplicados) | `409 Conflict` (`ALREADY_EXISTS`) |
| R3 | El parámetro `:id` en la ruta debe ser numérico válido. | Criterios 5, 6, 7 (`api-rest`: Convenciones de rutas) | `400 Bad Request` |
| R4 | Toda operación sobre `/players/:id` requiere que el jugador exista previamente. | Criterios 5, 6, 7 (`reglas-dominio`: Referencias) | `404 Not Found` (`NOT_FOUND`) |
| R5 | `GET /players` devuelve solo activos (`active = true`) por defecto, ordenados por `id ASC`. Permite `?active=false`, `?all=true`, `?document=` y `?position=`. | Criterio 4 (`reglas-dominio`: Borrado y desactivación) | `400 Bad Request` si los parámetros de query son inválidos |
| R6 | `DELETE /players/:id` valida previamente si el jugador tiene información asociada (contratos incluidos históricos, habilidades o anotaciones) vía `PlayerDependenciesChecker`. Si tiene dependencias, rechaza el borrado sin eliminar nada (nunca en cascada). | Criterios 7 y 8 (`reglas-dominio`: Jugadores y Borrado; `modelo-relacional`) | `409 Conflict` (`INVALID_STATE`, informando que tiene información asociada) |
| R7 | `PATCH /players/:id/deactivate` marca `active = false` (siempre permitido) y `PATCH /players/:id/activate` marca `active = true`. Un jugador inactivo no puede usarse en nuevas asociaciones (`HU-GD-05`/`HU-GD-07`), pero sigue apareciendo en consultas históricas. | Criterio 7 (`reglas-dominio`: Borrado y desactivación) | `404 Not Found` si no existe |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El sistema debe permitir registrar un jugador con su información requerida. | `POST /players` devuelve `201 Created` y persiste `Player` con `active = true`. |
| Los campos obligatorios deben ser validados. | Validación de `CreatePlayerDto` / `UpdatePlayerDto` + regla **R1** (`400 Bad Request`). |
| No se deben permitir jugadores duplicados cuando exista un identificador único. | Regla **R2** sobre `document` y `userId` en `POST /players` y `PUT /players/:id` + restricciones `UNIQUE` en BD (`409 Conflict` / `ALREADY_EXISTS`). |
| El sistema debe permitir consultar los jugadores registrados. | `GET /players` con regla **R5** devuelve `200 OK` con `PlayerResponseDto[]` ordenados por `id ASC`. |
| Se debe poder consultar el detalle de un jugador. | `GET /players/:id` con reglas **R3** y **R4** devuelve `200 OK` con `PlayerResponseDto`. |
| Se debe permitir actualizar la información de un jugador. | `PUT /players/:id` con reglas **R1–R4** actualiza y devuelve `200 OK` con `PlayerResponseDto`. |
| Se debe permitir eliminar o desactivar un jugador cuando las reglas del sistema lo permitan. | `DELETE /players/:id` (regla **R6**, `204 No Content`), `PATCH /players/:id/deactivate` y `PATCH /players/:id/activate` (regla **R7**, `200 OK`). |
| La eliminación de un jugador debe validar previamente si tiene información asociada. | `DELETE /players/:id` invoca `PlayerDependenciesChecker` (regla **R6**) y rechaza con `409 Conflict` (`INVALID_STATE`) si tiene dependencias. |
| Los cambios deben quedar almacenados correctamente. | Persistencia en MySQL mediante `PlayerTypeOrmRepository` verificada en consultas posteriores (`GET /players`, `GET /players/:id`). |

## Casos límite

- Crear o actualizar con `document` solo espacios (`"   "`) o `userId` faltante / `0` / negativo → `400 Bad Request`.
- Crear o actualizar con `position` solo espacios (`"   "`) o `jerseyNumber` fuera de rango (`-1`, `100`) → `400 Bad Request`.
- Crear con `document` duplicado variando mayúsculas/espacios (`"  cc-123  "` vs `"CC-123"`) → `409 Conflict` (`ALREADY_EXISTS`).
- Crear con `userId` ya asignado a otro jugador → `409 Conflict` (`ALREADY_EXISTS`).
- Actualizar conservando su propio `document` y `userId` → permitido (`200 OK`).
- Actualizar cambiando `document` o `userId` al de otro jugador existente → `409 Conflict` (`ALREADY_EXISTS`).
- Desactivar jugador (`PATCH /players/:id/deactivate`) → desaparece de `GET /players`, aparece en `?active=false` y `?all=true`; reactivarlo (`PATCH /players/:id/activate`) lo devuelve a `GET /players`.
- Enviar query params no permitidos (`GET /players?foo=bar`) o repetidos (`?document=a&document=b`) → `400 Bad Request`.
- Consultar, actualizar, activar/desactivar o eliminar con `:id` no numérico (`abc`) → `400 Bad Request`; inexistente (`999999`) → `404 Not Found`.
- Intentar eliminar un jugador con contratos, habilidades o anotaciones asociadas → `409 Conflict` (`INVALID_STATE`) sin borrar nada.

## Frontend

- **¿Tiene pantalla?** **Sí (Interfaz Requerida – I.R)** según `AGENTS.md` y `docs/alcance-integrante2.md`.
- El frontend en React consumirá `ms_seguridad` para los datos de usuario (`name`, `email`, `birthDate`) y `ms_sports` para la ficha deportiva (`POST/GET /players`, `GET/PUT/DELETE /players/:id`, `PATCH /players/:id/deactivate`, `PATCH /players/:id/activate`).
- Requiere habilitar `PUT` en la configuración de CORS de `src/main.ts`.

## Preguntas abiertas

Ninguna pendiente para iniciar la implementación de `HU-GD-04`.
