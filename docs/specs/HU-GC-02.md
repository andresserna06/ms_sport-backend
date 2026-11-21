# HU-GC-02 – Gestionar inscripciones de equipos en torneos

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar la inscripción de equipos en los diferentes torneos, para definir cuáles equipos participarán en cada competencia.

**Criterios de aceptación:**

- El torneo debe estar previamente registrado en el sistema.
- El equipo debe estar previamente registrado en el sistema.
- El equipo debe estar asociado con el deporte correspondiente al torneo.
- El sistema debe permitir inscribir uno o varios equipos en un torneo.
- Un mismo equipo puede estar inscrito en diferentes torneos.
- Un torneo puede contar con varios equipos inscritos.
- No se debe permitir registrar dos veces al mismo equipo en el mismo torneo.
- El sistema debe permitir consultar los equipos inscritos en un torneo.
- El sistema debe permitir consultar los torneos en los que se encuentra inscrito un equipo.
- Se debe permitir retirar la inscripción de un equipo mientras las reglas o el estado del torneo lo permitan.
- Retirar una inscripción no debe eliminar el equipo ni el torneo del sistema.
- La información de la inscripción debe quedar asociada al equipo y al torneo correspondientes.
- Si el torneo ya inició o el periodo de inscripciones se encuentra cerrado, el sistema debe impedir nuevas inscripciones o retiros cuando corresponda.
- El sistema debe informar al usuario cuando una inscripción se haya realizado o retirado correctamente.

## Dependencias

- **Historias o módulos que deben existir antes:**
  - `HU-GC-01` (`src/tournaments/`, ya en `main`): `Tournament` (incluyendo `sportId`, `startDate`, `registrationDeadline`, `status`).
  - `HU-GD-02` (`src/teams/`, ya en `main`): `Team`.
  - `HU-GD-03` (`src/team-sports/`): `TeamSport` (asociación equipo–deporte), necesaria para validar que el equipo está asociado al deporte del torneo.
- **Archivos compartidos que se tocarán:**
  - `src/tournaments/entities/tournament.entity.ts`: lado inverso `registrations`.
  - `src/teams/entities/team.entity.ts`: lado inverso `registrations`.
  - Nueva migración en `src/migrations/` para la tabla `registrations`.
- **Diferido / desbloquea:**
  - `HU-GC-04` (`GroupService`): la validación de que el equipo esté inscrito en el torneo al asignarlo a un grupo se habilita con esta historia (hoy está diferida).

## Modelo

Referencia: skill `modelo-relacional` (entidad `Registration`) y `docs/alcance-integrante-3.md`.

- Entidad `Registration` (`registrations`): `id`, `tournamentId` (FK a `tournaments.id`), `teamId` (FK a `teams.id`), `registeredAt`.
- Restricción: `UNIQUE (tournamentId, teamId)`.
- Relaciones:
  - `Registration.tournament` (`@ManyToOne` → `Tournament`), `Tournament.registrations` (`@OneToMany`).
  - `Registration.team` (`@ManyToOne` → `Team`), `Team.registrations` (`@OneToMany`).
- (Propuesta) Atributos adicionales sugeridos en `docs/alcance-integrante-3.md` (`status` activa/retirada, `withdrawnAt`) **no** se incluyen en esta especificación porque la historia y `reglas-dominio` GC-02 definen el retiro como eliminación de la inscripción; la `registeredAt` es la única fecha registrada. Si el grupo decide conservar historial de retiros, es una pregunta abierta.
- Borrados en cascada prohibidos: FK `RESTRICT` hacia `Tournament` y `Team`.

## Endpoints

| Método | Ruta | Body / Params | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/tournaments/:tournamentId/registrations` | `{ teamId }` | `201 Created` (`RegistrationResponseDto`) | `400` body inválido o id no numérico; `404` torneo o equipo inexistente (`NOT_FOUND`); `409` torneo inactivo / equipo inactivo / equipo no asociado al deporte del torneo / inscripción duplicada / torneo iniciado o inscripciones cerradas (`ALREADY_EXISTS` / `INVALID_STATE`) |
| `DELETE` | `/tournaments/:tournamentId/registrations/:teamId` | — | `204 No Content` | `400` id no numérico; `404` inscripción inexistente (`NOT_FOUND`); `409` torneo iniciado o inscripciones cerradas / equipo asignado a un grupo o con partidos (`INVALID_STATE`) |
| `GET` | `/tournaments/:id/registrations` | — | `200 OK` (`{ id, name }[]` o `RegistrationResponseDto[]`) | `400` id no numérico; `404` torneo inexistente |
| `GET` | `/teams/:id/tournaments` | — | `200 OK` (`{ id, name }[]`) | `400` id no numérico; `404` equipo inexistente |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | El `tournamentId` de la ruta debe existir → `404`. | Criterio 1 | `404 Not Found` (`NOT_FOUND`) |
| R2 | El torneo debe estar activo. | `reglas-dominio` (transversal) + GC-02 | `409 Conflict` (`INVALID_STATE`) |
| R3 | El equipo (`teamId` del body) debe existir → `404`. | Criterio 2 | `404 Not Found` (`NOT_FOUND`) |
| R4 | El equipo debe estar activo. | `reglas-dominio` (transversal) + GC-02 | `409 Conflict` (`INVALID_STATE`) |
| R5 | El equipo debe estar asociado al deporte del torneo vía `TeamSport`. | Criterio 3 | `409 Conflict` (`INVALID_STATE`) |
| R6 | No puede haber dos inscripciones del mismo equipo en el mismo torneo (`UNIQUE`). | Criterio 7 | `409 Conflict` (`ALREADY_EXISTS`) |
| R7 | No se permiten inscripciones si el torneo ya inició (`status IN_PROGRESS` o posterior) o si hoy es posterior a `registrationDeadline`. | Criterio 13 | `409 Conflict` (`INVALID_STATE`) |
| R8 | El retiro solo se permite si el torneo no ha iniciado y hoy no es posterior a `registrationDeadline`. | Criterio 10, 13 | `409 Conflict` (`INVALID_STATE`) |
| R9 | No se puede retirar un equipo asignado a un grupo o con partidos en el torneo. | `reglas-dominio` GC-02 | `409 Conflict` (`INVALID_STATE`) |
| R10 | Retirar una inscripción no elimina el equipo ni el torneo (la fila de `registrations` se elimina; `Team` y `Tournament` intactos). | Criterio 11 | — |
| R11 | La inscripción queda asociada a `tournamentId` y `teamId` (FK). | Criterio 12 | — |
| R12 | `registeredAt` se asigna automáticamente al crear la inscripción (ISO 8601). | Implícito | — |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El torneo debe estar previamente registrado en el sistema. | `POST /tournaments/:tournamentId/registrations` → R1 (404 si no existe) |
| El equipo debe estar previamente registrado en el sistema. | `POST ...` → R3 (404 si no existe) |
| El equipo debe estar asociado con el deporte correspondiente al torneo. | `POST ...` → R5 (409) |
| El sistema debe permitir inscribir uno o varios equipos en un torneo. | `POST ...` (un equipo por llamada; el cliente repite para varios) |
| Un mismo equipo puede estar inscrito en diferentes torneos. | `UNIQUE (tournamentId, teamId)` permite el mismo `teamId` con distinto `tournamentId` |
| Un torneo puede contar con varios equipos inscritos. | `GET /tournaments/:id/registrations` lista N |
| No se debe permitir registrar dos veces al mismo equipo en el mismo torneo. | R6 (409 `ALREADY_EXISTS`) |
| El sistema debe permitir consultar los equipos inscritos en un torneo. | `GET /tournaments/:id/registrations` |
| El sistema debe permitir consultar los torneos en los que se encuentra inscrito un equipo. | `GET /teams/:id/tournaments` |
| Se debe permitir retirar la inscripción de un equipo mientras las reglas o el estado del torneo lo permitan. | `DELETE .../registrations/:teamId` con R8, R9 |
| Retirar una inscripción no debe eliminar el equipo ni el torneo del sistema. | R10 |
| La información de la inscripción debe quedar asociada al equipo y al torneo correspondientes. | R11 (FKs) |
| Si el torneo ya inició o el periodo de inscripciones se encuentra cerrado, el sistema debe impedir nuevas inscripciones o retiros cuando corresponda. | R7, R8 |
| El sistema debe informar al usuario cuando una inscripción se haya realizado o retirado correctamente. | `201 Created` / `204 No Content` (mensajes en español en el body cuando aplique) |

## Casos límite

- Inscribir un equipo en un torneo cuyo deporte difiere del del equipo → 409 `INVALID_STATE`.
- Inscribir el mismo equipo dos veces → segunda llamada 409 `ALREADY_EXISTS`.
- Retirar una inscripción de un equipo que ya está en un grupo → 409 `INVALID_STATE` (el cliente debe quitarlo del grupo primero).
- Retirar una inscripción después del `registrationDeadline` → 409 `INVALID_STATE`.
- Torneo inexistente en la ruta → 404 `NOT_FOUND`.
- Equipo inexistente en el body → 404 `NOT_FOUND`.
- Consultar inscripciones de un torneo sin equipos → 200 con lista vacía.

## Frontend

- Tiene pantalla: gestión de inscripciones dentro del detalle del torneo (administrador deportivo).
- Consume: `POST/DELETE/GET /tournaments/:tournamentId/registrations` y `GET /teams/:id/tournaments`.
- No es entidad backend-only (a diferencia de `Sport`, `Skill`, `Phase`, `Group`).

## Preguntas abiertas

- **(Propuesta)** ¿El retiro elimina la fila de `registrations` o se marca como retirada (`status = RETIRED`, `withdrawnAt`)? La historia dice "retirar la inscripción" y `reglas-dominio` no define un estado; se propone eliminación física (204). Confirmar con el grupo.
- **(Propuesta)** ¿`registeredAt` se expone en el DTO de respuesta o solo se usa internamente? Se propone exponerlo en `RegistrationResponseDto`.
- **(Propuesta)** ¿Los `GET` de listado devuelven solo `{ id, name }` del equipo/torneo (resumido) o incluyen `registeredAt`? Se propone resumido `{ id, name }` para los listados de equipos por torneo y torneos por equipo, y `RegistrationResponseDto` con `registeredAt` para el `POST`.
- **(Propuesta)** ¿La validación de "equipo asignado a un grupo o con partidos" en el retiro (R9) consulta `teams.group_id` y `matches` directamente, o se delega a `GroupService`/`MatchService`? Se propone que `RegistrationService` consulte las tablas directamente con repositorios inyectados, manteniendo `GroupService` como dueño de la relación Group–Team para escritura.
- **(Propuesta)** ¿El torneo "iniciado" se determina por `status IN_PROGRESS` o por `startDate <= hoy`? `reglas-dominio` define "iniciado" como `status IN_PROGRESS` o posterior. Se propone usar `status`, no la fecha.
- **(Propuesta)** ¿Se requiere paginación en los listados? Se propone no paginar en esta entrega (consistente con el resto del proyecto).
- **[PENDIENTE]** Confirmar con el docente el alcance de notificaciones: ¿se envía correo al inscribir/retirar un equipo? La skill `notificaciones` solo define correo al crear/finalizar partido y al registrar anotación; no se define notificación para inscripciones. Se propone no enviar correo en esta historia.
