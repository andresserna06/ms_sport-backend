# HU-GD-07 – Asignar habilidades a jugadores

## Historia

**Historia de usuario:** Como administrador deportivo, quiero asignar habilidades a los jugadores, para representar las capacidades deportivas que posee cada uno.

**Criterios de aceptación:**

- Tanto el jugador como la habilidad deben existir previamente.
- Un jugador puede tener una o varias habilidades.
- Una misma habilidad puede pertenecer a diferentes jugadores.
- No se debe permitir asignar dos veces la misma habilidad al mismo jugador.
- El sistema debe permitir consultar las habilidades asociadas a un jugador.
- Se debe permitir consultar los jugadores que poseen determinada habilidad.
- Se deben poder agregar o retirar habilidades de un jugador.
- Retirar una habilidad de un jugador no debe eliminar la habilidad del sistema.

## Dependencias

- **Historias o módulos que deben existir antes:**
  - `HU-GD-06` (`src/skills/`, ya en `main`).
  - `HU-GD-04` (`src/players/`, ya en `main`).
- **Archivos compartidos que se tocarán durante la implementación (en commits separados según `flujo-git`):**
  - `src/app.module.ts` (registrar `PlayerSkillsModule` si se crea como módulo independiente, o integrar en `PlayersModule` / conectar puertos de dependencias).
  - `src/skills/skills.module.ts` y `src/players/players.module.ts` (conectar las implementaciones reales de `SKILL_DEPENDENCIES_CHECKER` y `PLAYER_DEPENDENCIES_CHECKER` consultando `player_skills`, cerrando en runtime la validación de borrado `409 INVALID_STATE` de `HU-GD-06` y `HU-GD-04`).
  - Nueva migración en `src/migrations/` para crear la tabla `player_skills` con FKs `RESTRICT` y `UNIQUE (player_id, skill_id)`.

## Modelo

Referencia: `modelo-relacional` + regla explícita de `docs/alcance-integrante2.md` (*"modelarse como entidad intermedia explícita, clase de asociación con sus propios atributos, no como `@ManyToMany` simple"*).

- **Entidad nueva:** `PlayerSkill` (tabla `player_skills`).
  - `id`: entero autoincremental, PK.
  - `playerId` (columna `player_id`): entero, obligatorio, FK → `players.id` (`ON DELETE RESTRICT`), indexado.
  - `skillId` (columna `skill_id`): entero, obligatorio, FK → `skills.id` (`ON DELETE RESTRICT`), indexado.
  - `level`: entero opcional (`1` a `5`, `nullable: true`), nivel de dominio de la habilidad.
  - `assignedAt` (columna `assigned_at`): fecha/hora automática de asignación (`DATETIME`, ISO 8601 en respuesta).
- **Restricciones e integridad:**
  - Restricción `UNIQUE (player_id, skill_id)` en base de datos + validación previa en el servicio (`409 ALREADY_EXISTS`).
  - **Borrado en cascada prohibido:** ambas FKs (`player_id` y `skill_id`) deben ser `ON DELETE RESTRICT`.
- **DTOs de respuesta:** nunca exponer entidades ORM directamente; devolver DTOs resumidos (`PlayerSkillResponseDto` con `{ id, playerId, skillId, level, assignedAt, skill?: { id, name, description }, player?: { id, userId, document, position, jerseyNumber, active } }` según el endpoint).

## Endpoints

Rutas alineadas con `api-rest` (nomenclatura en inglés del equipo):

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/players/:playerId/skills/:skillId` | `{ level? }` *(opcional, ver Pregunta abierta 1)* | `201 Created` (`PlayerSkillResponseDto`) | `400 Bad Request` (IDs no numéricos o body inválido), `404 Not Found` (`NOT_FOUND`, jugador o habilidad no existe), `409 Conflict` (`ALREADY_EXISTS` si ya está asignada, o `INVALID_STATE` si el jugador está inactivo) |
| `DELETE` | `/players/:playerId/skills/:skillId` | — | `204 No Content` | `400 Bad Request` (IDs no numéricos), `404 Not Found` (`NOT_FOUND`, jugador, habilidad o asociación no existe) |
| `GET` | `/players/:id/skills` | — | `200 OK` (lista de habilidades asignadas al jugador, ordenadas por `id ASC`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`, jugador no existe) |
| `GET` | `/skills/:id/players` | — | `200 OK` (lista de jugadores que poseen esa habilidad, ordenados por `id ASC`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`, habilidad no existe) |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | Tanto el jugador (`playerId`) como la habilidad (`skillId`) deben existir previamente en el sistema. | Criterio 1 (`reglas-dominio`: Referencias) | `404 Not Found` (`NOT_FOUND`) |
| R2 | Un jugador inactivo (`active === false`) no puede recibir nuevas asignaciones de habilidades. *(Sí sigue apareciendo en consultas históricas `GET /players/:id/skills` y `GET /skills/:id/players`).* | `reglas-dominio` (Reglas transversales: Borrado y desactivación) | `409 Conflict` (`INVALID_STATE`) |
| R3 | No se permite asignar dos veces la misma habilidad al mismo jugador (`UNIQUE (player_id, skill_id)`). | Criterio 4 (`reglas-dominio`: Duplicados) | `409 Conflict` (`ALREADY_EXISTS`) |
| R4 | Un jugador puede tener múltiples habilidades y una habilidad puede asignarse a múltiples jugadores (relación N:N vía entidad explícita `PlayerSkill`). | Criterios 2 y 3 | — |
| R5 | Retirar una habilidad de un jugador (`DELETE /players/:playerId/skills/:skillId`) elimina únicamente el registro en `player_skills`, nunca al jugador ni a la habilidad. Si la asociación no existe, responde error. | Criterios 7 y 8 (`reglas-dominio`: Habilidades) | `404 Not Found` (`NOT_FOUND`) |
| R6 | Los parámetros `:id`, `:playerId` y `:skillId` en las rutas deben ser numéricos válidos. | Criterios 1, 5, 6, 7 (`api-rest`) | `400 Bad Request` |
| R7 | *(Integración de dependencias)* Mientras existan registros en `player_skills`, ni `DELETE /skills/:id` ni `DELETE /players/:id` pueden eliminar la entidad asociada. | Criterio 8 de HU-GD-06 y Criterio 8 de HU-GD-04 (`reglas-dominio`) | `409 Conflict` (`INVALID_STATE`) |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| Tanto el jugador como la habilidad deben existir previamente. | `POST /players/:playerId/skills/:skillId` y `DELETE /players/:playerId/skills/:skillId` aplican regla **R1** (`404 NOT_FOUND`). |
| Un jugador puede tener una o varias habilidades. | `POST /players/:playerId/skills/:skillId` permite asignar varias habilidades distintas al mismo jugador (**R4**). |
| Una misma habilidad puede pertenecer a diferentes jugadores. | `POST /players/:playerId/skills/:skillId` permite asignar la misma habilidad a varios jugadores distintos (**R4**). |
| No se debe permitir asignar dos veces la misma habilidad al mismo jugador. | Regla **R3** en el servicio + `UNIQUE (player_id, skill_id)` en BD (`409 ALREADY_EXISTS`). |
| El sistema debe permitir consultar las habilidades asociadas a un jugador. | `GET /players/:id/skills` devuelve `200 OK` con las habilidades asignadas al jugador (o `[]` si no tiene; `404` si el jugador no existe). |
| Se debe permitir consultar los jugadores que poseen determinada habilidad. | `GET /skills/:id/players` devuelve `200 OK` con los jugadores que tienen esa habilidad (o `[]` si no tiene; `404` si la habilidad no existe). |
| Se deben poder agregar o retirar habilidades de un jugador. | `POST /players/:playerId/skills/:skillId` (`201`) y `DELETE /players/:playerId/skills/:skillId` (`204`). |
| Retirar una habilidad de un jugador no debe eliminar la habilidad del sistema. | Regla **R5** + FKs `RESTRICT`: tras `DELETE /players/:playerId/skills/:skillId`, `GET /skills/:skillId` y `GET /players/:playerId` siguen respondiendo `200 OK`. |

## Casos límite

- Asignar una habilidad a un jugador inexistente o una habilidad inexistente → `404 Not Found` (`NOT_FOUND`).
- Asignar una habilidad a un jugador desactivado (`active: false`) → `409 Conflict` (`INVALID_STATE`).
- Asignar dos veces la misma habilidad al mismo jugador → `409 Conflict` (`ALREADY_EXISTS`).
- Enviar `playerId` o `skillId` no numérico (`abc`) → `400 Bad Request`.
- Consultar `GET /players/:id/skills` de un jugador sin habilidades → `200 OK` con `[]`.
- Consultar `GET /skills/:id/players` de una habilidad sin jugadores → `200 OK` con `[]`.
- Intentar retirar una habilidad que el jugador no tiene asignada → `404 Not Found` (`NOT_FOUND`).
- Verificar que tras retirar la habilidad, tanto `GET /skills/:skillId` como `GET /players/:playerId` siguen existiendo (`200 OK`).
- **Caso integrado con HU-GD-06 y HU-GD-04:** intentar `DELETE /skills/:skillId` o `DELETE /players/:playerId` mientras existe una asociación en `player_skills` → `409 Conflict` (`INVALID_STATE`) sin borrar nada.

## Frontend

- **¿Tiene pantalla?** **Sí (Interfaz Requerida – I.R)** según `AGENTS.md` y `docs/alcance-integrante2.md`.
- Consumirá: `POST /players/:playerId/skills/:skillId`, `DELETE /players/:playerId/skills/:skillId`, `GET /players/:id/skills` y `GET /skills/:id/players`.

## Preguntas abiertas

Ninguna pendiente para iniciar la implementación de `HU-GD-07`.

*Decisiones cerradas:*
- `PlayerSkill` incluye `assignedAt` (automático) y `level` opcional (entero `1–5`).
- Se conectan las implementaciones reales de `SKILL_DEPENDENCIES_CHECKER` y `PLAYER_DEPENDENCIES_CHECKER` consultando `player_skills` para validar `409 INVALID_STATE` en runtime al eliminar habilidades o jugadores con asignaciones.
