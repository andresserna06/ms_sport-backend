# HU-GD-05 – Asignar jugadores a equipos

## Historia

**Historia de usuario:** Como administrador deportivo, quiero asignar jugadores a los equipos, para establecer la composición de cada plantilla deportiva.

**Criterios de aceptación:**

- Tanto el jugador como el equipo deben existir previamente.
- Se debe permitir asociar un jugador con un equipo definiendo la fecha de inicio y fin del contrato.
- Un equipo puede estar conformado por varios jugadores.
- El sistema debe evitar registrar dos veces la misma asociación.
- Se deben poder consultar los jugadores pertenecientes a un equipo.
- Se deben poder consultar los equipos asociados a un jugador.
- Se debe permitir retirar un jugador de un equipo sin eliminar su información del sistema.
- Al retirar la asociación, el jugador debe continuar disponible para ser asignado a otros equipos para que sirva como historial de traspasos.

## Dependencias

- **Historias o módulos que deben existir antes:**
  - `HU-GD-04` (`src/players/`, ya en `main`).
  - `HU-GD-02` (`src/teams/`, ya en `main`).
- **Archivos compartidos que se tocarán durante la implementación (en commits separados según `flujo-git`):**
  - `src/app.module.ts` (registrar `PlayerContractsModule`).
  - `src/players/players.module.ts` (componer `PLAYER_DEPENDENCIES_CHECKER` para que verifique tanto `player_skills` como `player_contracts`, impidiendo borrar jugadores con contratos vigentes o históricos).
  - `src/teams/repositories/teams.repository.ts` *(opcional, ver Pregunta abierta 2: registrar `{ table: 'player_contracts', column: 'team_id' }` en `TEAM_ASSOCIATIONS` para que `DELETE /teams/:id` también valide contratos)*.
  - Nueva migración en `src/migrations/` para crear la tabla `player_contracts` con FKs `ON DELETE RESTRICT` e índices.

## Modelo

Referencia: `modelo-relacional` (`PlayerContract`) + regla explícita de `docs/alcance-integrante2.md` (*"modelarse como entidad intermedia explícita, clase de asociación con sus propios atributos, no como `@ManyToMany` simple"*).

- **Entidad nueva:** `PlayerContract` (tabla `player_contracts`).
  - `id`: entero autoincremental, PK.
  - `playerId` (columna `player_id`): entero, obligatorio, FK → `players.id` (`ON DELETE RESTRICT`), indexado.
  - `teamId` (columna `team_id`): entero, obligatorio, FK → `teams.id` (`ON DELETE RESTRICT`), indexado.
  - `startDate` (columna `start_date`): `DATE` (`YYYY-MM-DD`), obligatoria.
  - `endDate` (columna `end_date`): `DATE` (`YYYY-MM-DD`), opcional (`nullable: true`; `null` = contrato vigente sin fecha de fin definida).
- **Restricciones e integridad:**
  - Restricción `CHECK (end_date IS NULL OR end_date >= start_date)` en base de datos + validación en el servicio (`400 INVALID_OPERATION`).
  - **Borrado en cascada prohibido:** ambas FKs (`player_id` y `team_id`) deben ser `ON DELETE RESTRICT`.
  - No lleva `UNIQUE (player_id, team_id)` porque un mismo jugador puede volver al mismo equipo en un periodo distinto (historial de traspasos); la no duplicidad se garantiza validando que los periodos no se solapen.
- **DTOs de respuesta:** nunca exponer entidades ORM directamente; devolver DTOs explícitos (`PlayerContractResponseDto`, `TeamPlayerContractResponseDto`, `PlayerTeamContractResponseDto`) incluyendo el campo calculado `current: boolean` (indica si el contrato está vigente a la fecha actual) y fechas en ISO 8601 (`YYYY-MM-DD`).

## Endpoints

Rutas alineadas exactamente con el mapa de `api-rest` para `GD-05 Contratos`:

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/teams/:teamId/contracts` | `{ playerId, startDate, endDate? }` | `201 Created` (`PlayerContractResponseDto`) | `400 Bad Request` (IDs/fechas inválidas o `endDate < startDate` → `INVALID_OPERATION`), `404 Not Found` (`NOT_FOUND`, equipo o jugador no existe), `409 Conflict` (`INVALID_STATE` si equipo o jugador está inactivo; `ALREADY_EXISTS` si se cruza con otro contrato del mismo jugador y equipo) |
| `PATCH` | `/contracts/:id/end` | — | `200 OK` (`PlayerContractResponseDto` con `endDate = hoy` y `current = false`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`, contrato no existe), `409 Conflict` (`INVALID_STATE` si el contrato ya estaba finalizado) |
| `GET` | `/teams/:id/players` | — *(query opcional validado con DTO: `?current=true|false`)* | `200 OK` (`TeamPlayerContractResponseDto[]`, ordenados por `id ASC`) | `400 Bad Request` (`id` no numérico o query inválido), `404 Not Found` (`NOT_FOUND`, equipo no existe) |
| `GET` | `/players/:id/teams` | — *(query opcional validado con DTO: `?current=true|false`)* | `200 OK` (`PlayerTeamContractResponseDto[]`, historial completo por defecto, ordenados por `id ASC`) | `400 Bad Request` (`id` no numérico o query inválido), `404 Not Found` (`NOT_FOUND`, jugador no existe) |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | Tanto el equipo (`teamId`) como el jugador (`playerId`) deben existir previamente. | Criterio 1 (`reglas-dominio`: Referencias) | `404 Not Found` (`NOT_FOUND`) |
| R2 | Tanto el equipo como el jugador deben estar activos (`active === true`) para crear un nuevo contrato. | `reglas-dominio` (Reglas transversales: Borrado y desactivación) | `409 Conflict` (`INVALID_STATE`) |
| R3 | `startDate` es obligatoria (`YYYY-MM-DD` calendario válido); `endDate` es opcional (`null` = vigente). Si `endDate` se proporciona, debe cumplirse `endDate >= startDate`. | Criterio 2 (`reglas-dominio`: Contratos jugador–equipo) | `400 Bad Request` (`INVALID_OPERATION`) |
| R4 | No pueden existir dos contratos del mismo jugador con el mismo equipo cuyos periodos se solapen (`(e1 === null \|\| e1 >= s2) && (e2 === null \|\| e2 >= s1)`). Sí se permite volver al mismo equipo en un periodo que no se cruce (historial de traspasos). | Criterios 4 y 8 (`reglas-dominio`: Contratos jugador–equipo) | `409 Conflict` (`ALREADY_EXISTS`) |
| R5 | Un equipo puede tener múltiples jugadores contratados simultáneamente. | Criterio 3 | — |
| R6 | Retirar un jugador de un equipo (`PATCH /contracts/:id/end`) finaliza el contrato asignando `endDate = hoy` (nunca borra el registro ni al jugador ni al equipo). Si el contrato ya finalizó, se rechaza. | Criterios 7 y 8 (`reglas-dominio`: Contratos jugador–equipo) | `404 Not Found` si no existe; `409 Conflict` (`INVALID_STATE`) si ya finalizó |
| R7 | Un contrato se considera **vigente** (`current: true`) cuando `startDate <= hoy` y (`endDate === null` o `endDate > hoy`). Así, al finalizarlo con `endDate = hoy`, pasa inmediatamente a `current: false`. | Criterios 5, 6 y `api-rest` (`?current=true`) | — |
| R8 | Los parámetros de ruta `:id`, `:teamId` deben ser numéricos válidos y los query params (`?current=`) validados por DTO. | Criterios 1, 5, 6, 7 (`api-rest`) | `400 Bad Request` |
| R9 | *(Integración de dependencias)* Mientras un jugador tenga contratos (vigentes o históricos), `DELETE /players/:id` debe rechazar el borrado sin eliminar nada. | `reglas-dominio` (Jugadores GD-04) | `409 Conflict` (`INVALID_STATE`) |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| Tanto el jugador como el equipo deben existir previamente. | `POST /teams/:teamId/contracts` valida existencia de ambos vía `TeamsService` y `PlayerService` (regla **R1**, `404 NOT_FOUND`). |
| Se debe permitir asociar un jugador con un equipo definiendo la fecha de inicio y fin del contrato. | `POST /teams/:teamId/contracts` recibe `{ playerId, startDate, endDate? }` y persiste `PlayerContract` (regla **R3**, `201 Created`). |
| Un equipo puede estar conformado por varios jugadores. | `POST /teams/:teamId/contracts` permite registrar múltiples jugadores distintos en el mismo equipo (**R5**). |
| El sistema debe evitar registrar dos veces la misma asociación. | Regla **R4** impide contratos solapados del mismo jugador con el mismo equipo (`409 ALREADY_EXISTS`). |
| Se deben poder consultar los jugadores pertenecientes a un equipo. | `GET /teams/:id/players` (con filtro opcional `?current=true`) devuelve `200 OK` con los jugadores del equipo y datos del contrato. |
| Se deben poder consultar los equipos asociados a un jugador. | `GET /players/:id/teams` (con filtro opcional `?current=true`) devuelve `200 OK` con el historial de equipos y contratos del jugador. |
| Se debe permitir retirar un jugador de un equipo sin eliminar su información del sistema. | `PATCH /contracts/:id/end` asigna `endDate = hoy` sin borrar el contrato, el jugador ni el equipo (regla **R6**, `200 OK`). |
| Al retirar la asociación, el jugador debe continuar disponible para ser asignado a otros equipos para que sirva como historial de traspasos. | Al finalizar un contrato (`endDate = hoy`), el jugador conserva su historial en `GET /players/:id/teams` y puede ser contratado por otro equipo (o por el mismo en un periodo posterior sin solape). |

## Casos límite

- Crear contrato con equipo inexistente o jugador inexistente → `404 Not Found` (`NOT_FOUND`).
- Crear contrato con equipo inactivo o jugador inactivo → `409 Conflict` (`INVALID_STATE`).
- Crear contrato con `endDate < startDate` (ej. `startDate: "2026-06-01"`, `endDate: "2026-05-01"`) → `400 Bad Request` (`INVALID_OPERATION`).
- Crear contrato con fechas inválidas (ej. `"2026-02-30"` o `"01/01/2026"`) → `400 Bad Request`.
- Crear dos contratos solapados del mismo jugador en el mismo equipo (p. ej. uno abierto con `endDate: null` y otro nuevo, o rangos que se cruzan) → `409 Conflict` (`ALREADY_EXISTS`).
- Crear un segundo contrato del mismo jugador en el mismo equipo en un periodo **no solapado** (después de finalizar el anterior) → permitido (`201 Created`, historial de traspasos).
- Finalizar un contrato con `PATCH /contracts/:id/end` cuando `startDate > hoy` (contrato futuro) → `endDate` no puede quedar menor que `startDate` *(ver Pregunta abierta 3)*.
- Intentar finalizar un contrato que ya estaba finalizado → `409 Conflict` (`INVALID_STATE`).
- Consultar `GET /teams/:id/players?current=true` → devuelve solo contratos vigentes; sin `?current` devuelve todos (vigentes e históricos).
- Intentar `DELETE /players/:id` sobre un jugador que tiene al menos un contrato (vigente o histórico) → `409 Conflict` (`INVALID_STATE`).

## Frontend

- **¿Tiene pantalla?** **Sí (Interfaz Requerida – I.R)** según `AGENTS.md` y `docs/alcance-integrante2.md`.
- Consumirá: `POST /teams/:teamId/contracts`, `PATCH /contracts/:id/end`, `GET /teams/:id/players?current=true` y `GET /players/:id/teams`.

## Preguntas abiertas

Ninguna pendiente para iniciar la implementación de `HU-GD-05`.

*Decisiones cerradas:*
- Se valida no solapamiento entre contratos del mismo `(playerId, teamId)` (la validación por deporte compartido queda diferida hasta que exista `HU-GD-03`).
- Se registra `{ table: 'player_contracts', column: 'team_id' }` en `TEAM_ASSOCIATIONS` de `TeamsRepository` para proteger también `DELETE /teams/:id`.
- Finalizar un contrato con `startDate > hoy` responde `409 Conflict` (`INVALID_STATE`).
