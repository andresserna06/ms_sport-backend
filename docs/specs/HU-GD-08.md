# HU-GD-08 – Consultar perfil deportivo del jugador

## Historia

**Historia de usuario:** Como administrador deportivo, quiero consultar el perfil deportivo de un jugador, para conocer de manera centralizada su información, los equipos a los que pertenece y las habilidades que posee.

**Criterios de aceptación:**

- El sistema debe permitir seleccionar o buscar un jugador registrado.
- Se debe mostrar la información básica del jugador.
- Se deben mostrar los equipos con los que se encuentra asociado.
- Se deben mostrar las habilidades que tiene asignadas.
- Si el jugador no tiene equipos asociados, el sistema debe indicarlo.
- Si el jugador no tiene habilidades registradas, el sistema debe indicarlo.

## Dependencias

- **Historias o módulos que deben existir antes:**
  - `HU-GD-04` (`src/players/`, ya en `main` — expone `PlayerService` y búsqueda `GET /players?document=&position=&all=true`).
  - `HU-GD-05` (`src/player-contracts/`, ya en `main` — expone `PlayerContractService`).
  - `HU-GD-07` (`src/player-skills/`, ya en `main` — expone `PlayerSkillService`).
- **Archivos compartidos que se tocarán durante la implementación (en commit separado según `flujo-git`):**
  - `src/app.module.ts` (registrar `PlayerProfileModule`).
- **Migraciones:** No requiere migración ni tablas nuevas (consulta agregada de solo lectura sobre entidades existentes).

## Modelo

No crea entidades ni tablas nuevas. Agrega y proyecta en un DTO de respuesta compuesto (`PlayerProfileResponseDto`):
- `player`: `{ id, userId, document, position, jerseyNumber, active }` (obtenido vía `PlayerService.findOne(id)`).
- `teams`: arreglo de `PlayerTeamContractResponseDto` (`{ id, teamId, startDate, endDate, current, team: { id, name, city, active } }`, vigentes e históricos, marcando `current: true/false`).
- `teamsMessage`: `string | null` — `"El jugador no tiene equipos asociados"` cuando `teams` está vacío; `null` si tiene al menos un equipo.
- `skills`: arreglo de `PlayerAssignedSkillResponseDto` (`{ id, skillId, level, assignedAt, skill: { id, name, description } }`).
- `skillsMessage`: `string | null` — `"El jugador no tiene habilidades registradas"` cuando `skills` está vacío; `null` si tiene al menos una habilidad.

*(Nota sobre datos de usuario: siguiendo el criterio del docente establecido en `HU-GD-04`, `name`/`email`/`birthDate` pertenecen a `ms_seguridad` y el frontend los enlaza con `player.userId`.)*

## Endpoints

Rutas basadas en `api-rest` para `GD-08 Perfil`:

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `GET` | `/players/:id/profile` | — | `200 OK` (`PlayerProfileResponseDto`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (`NOT_FOUND`, jugador no existe) |
| `GET` *(ya existente en HU-GD-04)* | `/players?document=&position=&all=true` | — | `200 OK` (`PlayerResponseDto[]`) | `400 Bad Request` (query params inválidos) |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | El parámetro `:id` debe ser numérico válido. | Criterio 1 (`api-rest`) | `400 Bad Request` |
| R2 | El jugador consultado debe existir previamente en el sistema. | Criterio 1 (`reglas-dominio`: Referencias) | `404 Not Found` (`NOT_FOUND`) |
| R3 | El perfil incluye tanto jugadores activos como inactivos (consulta histórica permitida) y devuelve contratos vigentes e históricos indicando `current: true/false`. | Criterios 2 y 3 (`reglas-dominio`: Perfil del jugador y Borrado/desactivación) | — |
| R4 | Si el jugador no tiene equipos/contratos asociados, devuelve `teams: []` y `teamsMessage: "El jugador no tiene equipos asociados"` (de lo contrario `teamsMessage: null`). | Criterio 5 (`reglas-dominio`: Perfil del jugador) | — |
| R5 | Si el jugador no tiene habilidades asignadas, devuelve `skills: []` y `skillsMessage: "El jugador no tiene habilidades registradas"` (de lo contrario `skillsMessage: null`). | Criterio 6 (`reglas-dominio`: Perfil del jugador) | — |
| R6 | `PlayerProfileService` consume exclusivamente los servicios exportados (`PlayerService`, `PlayerContractService`, `PlayerSkillService`), nunca repositorios ni entidades de otros módulos directamente. | `arquitectura-nest` (Dependencias entre módulos) | — |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El sistema debe permitir seleccionar o buscar un jugador registrado. | `GET /players` (con `?document=`, `?position=`, `?all=true` de `HU-GD-04`) para buscar/seleccionar y `GET /players/:id/profile` (**R1**, **R2**). |
| Se debe mostrar la información básica del jugador. | Campo `player` en `GET /players/:id/profile` (`200 OK`, **R3**). |
| Se deben mostrar los equipos con los que se encuentra asociado. | Campo `teams` (contratos vigentes e históricos con `current: true/false` y resumen de `team`) en `GET /players/:id/profile` (**R3**). |
| Se deben mostrar las habilidades que tiene asignadas. | Campo `skills` (asignaciones con `level`, `assignedAt` y resumen de `skill`) en `GET /players/:id/profile`. |
| Si el jugador no tiene equipos asociados, el sistema debe indicarlo. | `teams: []` + `teamsMessage: "El jugador no tiene equipos asociados"` (**R4**). |
| Si el jugador no tiene habilidades registradas, el sistema debe indicarlo. | `skills: []` + `skillsMessage: "El jugador no tiene habilidades registradas"` (**R5**). |

## Casos límite

- Consultar perfil de jugador recién creado (sin equipos ni habilidades) → `200 OK` con `teams: []`, `teamsMessage: "El jugador no tiene equipos asociados"`, `skills: []`, `skillsMessage: "El jugador no tiene habilidades registradas"`.
- Consultar perfil de jugador con habilidades pero sin equipos → `skillsMessage: null`, `teamsMessage: "El jugador no tiene equipos asociados"`.
- Consultar perfil de jugador con equipos (vigente + histórico) y habilidades → `teamsMessage: null`, `skillsMessage: null`, mostrando `current: true` en el vigente y `current: false` en el histórico.
- Consultar perfil de un jugador **inactivo** (`active: false`) → `200 OK` (consulta histórica permitida).
- Consultar perfil con `:id` no numérico (`/players/abc/profile`) → `400 Bad Request`.
- Consultar perfil de jugador inexistente (`/players/999999/profile`) → `404 Not Found` (`NOT_FOUND`).

## Frontend

- **¿Tiene pantalla?** **Sí (Interfaz Requerida – I.R)** según `AGENTS.md` y `docs/alcance-integrante2.md`.
- Consumirá `GET /players` (para buscar/seleccionar) y `GET /players/:id/profile` (mostrando `teamsMessage` y `skillsMessage` cuando las listas estén vacías, y complementando nombre/correo con `ms_seguridad` mediante `player.userId`).

## Preguntas abiertas

Ninguna pendiente: todas las reglas de `HU-GD-08` están definidas explícitamente en `docs/historias-usuario.md`, `reglas-dominio` y `api-rest`.
