# HU-GC-03 - Gestionar fases de un torneo

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar las fases que conforman un torneo, para definir las diferentes etapas mediante las cuales se desarrollará la competencia.

**Criterios de aceptación:**
- El torneo debe existir previamente en el sistema.
- El sistema debe permitir registrar una o varias fases para un torneo.
- Cada fase debe estar asociada con un único torneo.
- Se debe permitir consultar las fases correspondientes a un torneo.
- Se debe poder actualizar la información de una fase.
- Se debe permitir eliminar una fase cuando no tenga información asociada que lo impida.
- El sistema debe permitir definir el orden en el que se desarrollarán las fases.
- Cada fase debe corresponder al tipo de etapa definido para la competencia, como una fase de grupos o una fase final.
- No se debe eliminar el torneo al modificar o eliminar una de sus fases.

## Dependencias

- `HU-GC-01` (`src/tournaments/`): torneo existente.
- `HU-GC-04` (`src/phases/group/`): implementación concreta de fases tipo `GROUP`.
- `HU-GC-05` (`src/phases/final/`): implementación concreta de fases tipo `FINAL`.
- `HU-GC-06` (`src/matches/`): relación Phase-Match; bloquea eliminación de fases con partidos.

## Modelo

- `Phase` (`phases`) es la base STI con `phase_type` (`GROUP` | `FINAL`).
- Campos: `id`, `name`, `order` (`phase_order`), `tournament_id` FK a `tournaments.id` (`RESTRICT`), `matches` 1:N.
- `Group` y `Final` son child entities; el tipo de fase no se cambia por update.
- `order` se valida `>= 1`; no se impone unicidad de orden por torneo en esta entrega (mejora futura documentada).

## Endpoints

| Método | Ruta | Body / Params | Éxito | Errores |
|---|---|---|---|---|
| GET | `/phases` | query opcional `?tournamentId=` | 200 (`PhaseResponseDto[]`) | 400 query inválida |
| GET | `/phases/:id` | - | 200 (`PhaseResponseDto`) | 400 id inválido; 404 fase no existe |
| GET | `/phases/reports/count-by-type` | - | 200 reporte | - |
| GET | `/tournaments/:tournamentId/phases` | - | 200 (`PhaseResponseDto[]`) | 400 id inválido; 404 torneo no existe |

La creación/actualización/eliminación se realiza por los endpoints concretos:
- Grupos: `/groups` (HU-GC-04)
- Finales: `/finals` (HU-GC-05)

## Reglas de negocio

| # | Regla | Criterio | Error |
|---|---|---|---|
| R1 | El torneo debe existir para crear/consultar fases por torneo. | 1,2,4 | 404 `NOT_FOUND` |
| R2 | Cada fase pertenece a un único torneo (`tournament_id`); update no cambia torneo. | 3,9 | 400/contrato DTO |
| R3 | Consulta de fases por torneo retorna fases del torneo solicitado. | 4 | 404 torneo inexistente en alias |
| R4 | Se puede actualizar información de fase (campos permitidos por DTO). | 5 | 400/404/409 |
| R5 | No se elimina una fase con partidos asociados. | 6 | 409 `INVALID_STATE` |
| R6 | `order` debe ser entero >= 1. | 7 | 400 validación |
| R7 | Tipo de fase es `GROUP` o `FINAL` según child entity. | 8 | contrato/modelo |
| R8 | Eliminar/modificar fase no elimina torneo. | 9 | - |

## Trazabilidad

| Criterio | Cumplimiento |
|---|---|
| Torneo existe previamente | Validación en `GroupService/FinalService.getTournamentOrFail`; alias torneo valida `findOne`. |
| Registrar una o varias fases | `POST /groups`, `POST /finals`. |
| Fase asociada a único torneo | FK `tournament_id`, DTO crea con `tournamentId`, update no incluye `tournamentId`. |
| Consultar fases de torneo | `GET /phases?tournamentId=` y alias `GET /tournaments/:id/phases`. |
| Actualizar información | `PATCH /groups/:id`, `PATCH /finals/:id`. |
| Eliminar sin información asociada | `DELETE /groups/:id`, `DELETE /finals/:id` retornan 204; con partidos 409. |
| Orden de desarrollo | Campo `order` en DTO y entidad. |
| Tipo GROUP/FINAL | STI `phase_type` y endpoints concretos. |
| No eliminar torneo | Operaciones sobre fase no borran torneo. |

## Casos límite

- Consultar fases de torneo inexistente por alias -> 404.
- Crear fase con torneo inexistente -> 404.
- Eliminar fase con matches -> 409 `INVALID_STATE`.
- `order < 1` -> 400 DTO.

## Decisiones

- Se mantiene **PATCH** para updates parciales (desviación documentada del mapa que sugiere PUT; PUT canónico reemplaza recurso completo).
- DELETE de fases concretas responde **204 No Content**.
- No se exige unicidad de `order` por torneo en esta entrega. Mejora futura: orden único para rondas finales secuenciales del mismo torneo.
