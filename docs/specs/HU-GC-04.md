# HU-GC-04 â€“ Gestionar grupos de competencia

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar los grupos pertenecientes a una fase de un torneo, para organizar los equipos que competirÃ¡n durante esta etapa.

**Criterios de aceptaciÃ³n:**

- Debe existir previamente un torneo y una fase correspondiente.
- El sistema debe permitir registrar los grupos necesarios para la fase.
- Se debe poder consultar la informaciÃ³n de los grupos registrados.
- Se debe permitir modificar la informaciÃ³n de un grupo.
- Se debe permitir eliminar un grupo cuando las reglas de la competencia lo permitan.
- El sistema debe permitir asignar varios equipos a un grupo.
- Un grupo debe poder contener varios equipos.
- No se debe permitir registrar dos veces el mismo equipo dentro del mismo grupo.
- Un equipo no debe quedar asignado simultÃ¡neamente a diferentes grupos de la misma fase.
- Se deben poder consultar los equipos que conforman cada grupo.
- La eliminaciÃ³n de un grupo no debe eliminar los equipos registrados en la plataforma.

## Dependencias

- **Historias o mÃ³dulos que deben existir antes:**
  - `HU-GC-03` (`src/phases/`, ya en `main`): `Phase`, `Group`, `Final` y la relaciÃ³n faseâ€“torneo.
  - `HU-GD-02` (`src/teams/`, ya en `main`): `Team`.
- **Diferido:**
  - La validaciÃ³n de que el equipo estÃ© inscrito en el torneo del grupo requiere `Registration` (`HU-GC-02`). Por ahora solo se valida que el equipo exista y estÃ© activo.
- **Archivos compartidos que se tocan:**
  - `src/teams/entities/team.entity.ts`: relaciÃ³n `group` y FK `group_id`.
  - `src/tournaments/entities/tournament.entity.ts`: lado inverso `phases`.
  - Nueva migraciÃ³n en `src/migrations/` para `teams.group_id`.

## Modelo

Referencia: `docs/guia-relaciones.md` (secciÃ³n 1) y skill `modelo-relacional`.

- **Group 1:N Team** con la FK en el lado â€œmuchosâ€:
  - `teams.group_id` (columna), nullable, FK â†’ `phases.id` con `ON DELETE SET NULL`, indexada.
  - `Team.group: Group | null` (`@ManyToOne`) y `Group.teams: Team[]` (`@OneToMany`).
- `Group` es una fila de `phases` con `phase_type = 'GROUP'` (herencia de tabla Ãºnica).
- `Phase.tournament` (`tournament_id`) es obligatoria en la API; en la base de datos queda nullable para no romper filas antiguas sin torneo.

## Endpoints

| MÃ©todo | Ruta | Body / Params | Ã‰xito | Errores |
|---|---|---|---|---|
| `POST` | `/groups` | `{ name, order, tournamentId }` | `201 Created` (`GroupResponseDto`) | `400` body invÃ¡lido; `404` torneo inexistente (`NOT_FOUND`); `409` nombre repetido en el torneo (`ALREADY_EXISTS`) |
| `GET` | `/groups` | query opcional `?tournamentId=` | `200 OK` (`GroupResponseDto[]`) | `400` query invÃ¡lido |
| `GET` | `/groups/:id` | â€” | `200 OK` (`GroupResponseDto`) | `400` id no numÃ©rico; `404` grupo inexistente (`NOT_FOUND`) |
| `PATCH` | `/groups/:id` | `{ name?, order? }` | `200 OK` (`GroupResponseDto`) | `400` body invÃ¡lido; `404` grupo inexistente; `409` nombre repetido (`ALREADY_EXISTS`) |
| `DELETE` | `/groups/:id` | â€” | `200 OK` (`{ message }`) | `404` grupo inexistente; `409` tiene partidos (`INVALID_STATE`) |
| `POST` | `/groups/:groupId/teams/:teamId` | â€” | `201 Created` (`GroupResponseDto`) | `404` grupo o equipo inexistente; `409` equipo inactivo, ya en ese grupo (`ALREADY_EXISTS`) o en otro grupo (`INVALID_STATE`) |
| `DELETE` | `/groups/:groupId/teams/:teamId` | â€” | `204 No Content` | `404` grupo o equipo inexistente; `409` el equipo no pertenece al grupo (`INVALID_STATE`) |
| `GET` | `/groups/:id/teams` | â€” | `200 OK` (`{ id, name }[]`) | `400` id no numÃ©rico; `404` grupo inexistente |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | El `tournamentId` debe existir al crear un grupo. | Criterio 1 | `404 Not Found` (`NOT_FOUND`) |
| R2 | El `name` es Ãºnico dentro del torneo, sin distinguir mayÃºsculas y tras recortar espacios. | Criterios 2 y 3 (`reglas-dominio`: Fases) | `409 Conflict` (`ALREADY_EXISTS`) |
| R3 | Actualizar un grupo solo permite cambiar `name` y `order`; el torneo y el tipo no se modifican. | Criterio 4 | `400`/`409` segÃºn validaciÃ³n |
| R4 | Se elimina un grupo solo si no tiene partidos. | Criterio 5 (`reglas-dominio`: Grupos) | `409 Conflict` (`INVALID_STATE`); éxito `204 No Content` |
| R5 | Al eliminar un grupo, sus equipos quedan con `group_id = NULL`; nunca se eliminan equipos. | Criterios 5 y 11 | â€” |
| R6 | Un grupo puede contener varios equipos. | Criterios 6 y 7 | â€” |
| R7 | Un equipo no puede registrarse dos veces en el mismo grupo. | Criterio 8 | `409 Conflict` (`ALREADY_EXISTS`) |
| R8 | Un equipo solo puede pertenecer a un grupo a la vez (`teams.group_id`). Si ya tiene grupo, no se sobrescribe: primero se le quita. | Criterio 9 (`guia-relaciones`: 1:N) | `409 Conflict` (`INVALID_STATE`) |
| R9 | El equipo debe existir y estar activo para asignarlo. | `reglas-dominio`: Reglas transversales | `404` / `409 Conflict` (`INVALID_STATE`) |
| R10 | Consultar los equipos de un grupo devuelve resÃºmenes `{ id, name }` ordenados por nombre. | Criterio 10 | `404` si el grupo no existe |
| R11 | El equipo debe estar inscrito en el torneo del grupo. | `reglas-dominio`: Grupos / HU-GC-02 | `409 Conflict` (`INVALID_STATE`) |

## Trazabilidad de criterios

| Criterio de aceptaciÃ³n (textual) | CÃ³mo se cumple |
|---|---|
| Debe existir previamente un torneo y una fase correspondiente. | `POST /groups` exige `tournamentId` y valida su existencia (R1). El grupo es la fase de tipo `GROUP`. |
| El sistema debe permitir registrar los grupos necesarios para la fase. | `POST /groups` con `name`, `order` y `tournamentId`. |
| Se debe poder consultar la informaciÃ³n de los grupos registrados. | `GET /groups` y `GET /groups/:id`. |
| Se debe permitir modificar la informaciÃ³n de un grupo. | `PATCH /groups/:id` con `name`/`order` (R3). |
| Se debe permitir eliminar un grupo cuando las reglas de la competencia lo permitan. | `DELETE /groups/:id` bloquea si tiene partidos (R4). |
| El sistema debe permitir asignar varios equipos a un grupo. | `POST /groups/:groupId/teams/:teamId` (R6). |
| Un grupo debe poder contener varios equipos. | RelaciÃ³n 1:N `Group.teams` (R6). |
| No se debe permitir registrar dos veces el mismo equipo dentro del mismo grupo. | `teams.group_id` solo admite un grupo; si coincide â†’ `ALREADY_EXISTS` (R7). |
| Un equipo no debe quedar asignado simultÃ¡neamente a diferentes grupos de la misma fase. | Un solo `group_id` por equipo; si ya tiene otro grupo â†’ `INVALID_STATE` (R8). |
| Se deben poder consultar los equipos que conforman cada grupo. | `GET /groups/:id/teams` (R10). |
| La eliminaciÃ³n de un grupo no debe eliminar los equipos registrados en la plataforma. | FK `ON DELETE SET NULL` y limpieza explÃ­cita en la transacciÃ³n de borrado (R5). |

## Casos lÃ­mite

- Crear grupo con torneo inexistente â†’ `404 Not Found` (`NOT_FOUND`).
- Crear grupo con nombre repetido en el mismo torneo (incluida una fase final con el mismo nombre) â†’ `409 Conflict` (`ALREADY_EXISTS`).
- Asignar un equipo inexistente â†’ `404 Not Found` (`NOT_FOUND`).
- Asignar un equipo inactivo â†’ `409 Conflict` (`INVALID_STATE`).
- Asignar un equipo que ya estÃ¡ en el mismo grupo â†’ `409 Conflict` (`ALREADY_EXISTS`).
- Asignar un equipo que ya estÃ¡ en otro grupo â†’ `409 Conflict` (`INVALID_STATE`).
- Quitar un equipo que no pertenece al grupo â†’ `409 Conflict` (`INVALID_STATE`).
- Eliminar un grupo con partidos â†’ `409 Conflict` (`INVALID_STATE`).
- Eliminar un grupo con equipos â†’ los equipos siguen existiendo con `group_id = NULL`.
- Consultar los equipos de un grupo vacÃ­o â†’ `200 OK` con `[]`.

## Frontend

- **Â¿Tiene pantalla?** **No (S.I)** segÃºn `docs/alcance-integrante-3.md` y `AGENTS.md`. Solo se prueba con Postman.

## Preguntas abiertas

Ninguna pendiente para iniciar la implementaciÃ³n.

*Decisiones cerradas:*
- La relaciÃ³n Grupoâ€“Equipo se mantiene **1:N** con `teams.group_id`, como el diagrama y `docs/guia-relaciones.md`.
- La validaciÃ³n de inscripciÃ³n en el torneo se difiere a `HU-GC-02`. Por ahora se valida existencia y estado activo del equipo.
- `DELETE /groups/:groupId/teams/:teamId` y `DELETE /groups/:id` responden `204 No Content` (alineado a api-rest).

