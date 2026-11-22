# HU-GC-05 - Gestionar fases finales

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar las fases finales de un torneo, para organizar las etapas decisivas de la competencia.

**Criterios de aceptación:**
- El torneo debe existir previamente.
- El sistema debe permitir registrar una fase final dentro de la estructura del torneo.
- Se debe poder consultar la información correspondiente a la fase final.
- Se debe permitir actualizar su información mientras las reglas de la competencia lo permitan.
- Se debe permitir eliminar una fase final cuando no tenga partidos u otra información asociada que lo impida.
- Los partidos correspondientes a esta etapa deben poder identificarse como parte de la fase final.
- La modificación de la fase final no debe afectar la información de las demás fases del torneo.

## Dependencias

- `HU-GC-01` (`src/tournaments/`): torneo existente.
- `HU-GC-03` (`src/phases/base/`): modelo base de fases STI.
- `HU-GC-06` (`src/matches/`): partidos asociados a fase; `Match.phase` identifica la fase final.

## Modelo

- `Final` extiende `Phase` con `phaseType = 'FINAL'` (`@ChildEntity('FINAL')`).
- Hereda `id`, `name`, `order`, `tournament`, `matches`.
- No tiene metadata de bracket/round en esta entrega; GC-06 difiere `round/bracketPosition`.

## Endpoints

| Método | Ruta | Body / Params | Éxito | Errores |
|---|---|---|---|---|
| POST | `/finals` | `{ name, order, tournamentId }` | 201 (`FinalResponseDto`) | 400 DTO inválido; 404 torneo inexistente; 409 nombre duplicado en torneo |
| GET | `/finals` | query opcional `?tournamentId=` | 200 (`FinalResponseDto[]`) | 400 query inválida |
| GET | `/finals/:id` | - | 200 (`FinalResponseDto`) | 400 id inválido; 404 no existe |
| PATCH | `/finals/:id` | `{ name?, order? }` | 200 (`FinalResponseDto`) | 400 DTO inválido; 404 no existe; 409 nombre duplicado |
| DELETE | `/finals/:id` | - | 204 No Content | 400 id inválido; 404 no existe; 409 tiene partidos |

## Reglas de negocio

| # | Regla | Criterio | Error |
|---|---|---|---|
| R1 | `tournamentId` debe existir al crear. | 1 | 404 `NOT_FOUND` |
| R2 | Se puede registrar una fase final en un torneo. | 2 | 400/404/409 |
| R3 | Se puede consultar información de fase final por id/listado. | 3 | 404 |
| R4 | Se puede actualizar `name/order` mientras reglas lo permitan; no cambia torneo/tipo. | 4,7 | 400/404/409 |
| R5 | No se elimina si tiene partidos asociados. | 5 | 409 `INVALID_STATE` |
| R6 | Los partidos de la fase final se identifican por `Match.phase`/`phaseId`. | 6 | - |
| R7 | Modificar una final no afecta otras fases; solo actualiza la entidad indicada. | 7 | - |
| R8 | `order >= 1`, `name` requerido/trim/max 100. | DTO | 400 |
| R9 | Nombre único por torneo entre fases (case-insensitive, trim), excluyendo la propia en update. | consistencia GC-03/04 | 409 `ALREADY_EXISTS` |

## Trazabilidad

| Criterio | Cumplimiento |
|---|---|
| Torneo existe previamente | `FinalService.getTournamentOrFail`. |
| Registrar fase final | `POST /finals`. |
| Consultar fase final | `GET /finals`, `GET /finals/:id`. |
| Actualizar mientras reglas lo permitan | `PATCH /finals/:id`; no cambia torneo/tipo; valida nombre duplicado. |
| Eliminar sin partidos u otra información asociada | `DELETE /finals/:id` -> 204; con matches 409. |
| Partidos identificables como parte de fase final | `Match.phase` apunta a fase; `phaseType=FINAL`. |
| Modificación no afecta otras fases | Update guarda solo la final objetivo. |

## Casos límite

- Torneo inexistente al crear -> 404.
- Nombre duplicado en mismo torneo -> 409.
- Eliminar final con partidos -> 409.
- Final inexistente -> 404.

## Decisiones

- **PATCH** se mantiene para update parcial; DTO controla campos permitidos. Desviación documentada del mapa que sugiere PUT.
- **DELETE 204 No Content**.
- `round/bracketPosition` diferidos a GC-06/modelo futuro.
- `order` único no exigido; solo `>= 1`. Mejora futura documentada para rondas finales secuenciales.
