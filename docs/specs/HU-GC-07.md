# HU-GC-07 – Gestionar resultados y anotaciones de los partidos

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar los resultados y las anotaciones realizadas durante un partido, para mantener actualizado el desarrollo de la competencia y conservar el registro de los acontecimientos relevantes del encuentro.

**Criterios de aceptación:**

- El partido debe estar previamente registrado en el sistema.
- El sistema debe permitir registrar el resultado correspondiente a los equipos participantes.
- Solo se deben poder registrar resultados para los equipos que participan en el partido.
- El sistema debe permitir consultar y modificar el resultado del encuentro cuando las reglas de la competencia lo permitan.
- El resultado debe quedar asociado con el partido correspondiente.
- El sistema debe permitir registrar una o varias anotaciones asociadas con el partido.
- Cada anotación debe estar asociada con el jugador que la realizó.
- El jugador seleccionado para una anotación debe pertenecer a uno de los equipos participantes del partido.
- El sistema debe permitir consultar, modificar y eliminar las anotaciones registradas.
- Eliminar una anotación no debe eliminar al jugador ni al partido asociado.
- Las anotaciones deben conservar su relación con el partido y con el jugador correspondiente.
- Cuando se registre una anotación, el sistema debe enviar una notificación a los aficionados que hayan adquirido un boleto para el partido o realizado una apuesta sobre este.
- Al finalizar y registrar el resultado del partido, el sistema debe enviar una notificación con el resumen del encuentro a los aficionados que hayan adquirido un boleto o realizado una apuesta sobre el partido.

## Dependencias

- **Historias o módulos que deben existir antes:**
  - `HU-GC-06` (`src/matches/`, existente en `main` — *ver brechas detectadas abajo*).
  - `HU-GD-04` (`src/players/`, en `main`).
  - `HU-GD-05` (`src/player-contracts/`, en `main`).
  - `ms_notificaciones` (servicio externo FastAPI en `NOTIFICATIONS_SERVICE_URL`, por defecto `http://localhost:8000`).
- **Brechas detectadas en el código actual de `src/matches/`:**
  1. `src/matches/entities/match.entity.ts` actualmente **no tiene** columnas `home_team_id` ni `away_team_id` (ni relación con `Team`), y `MatchStatus` solo tiene `SCHEDULED`, `FINISHED`, `CANCELLED` (falta `IN_PROGRESS` según `reglas-dominio`). Sin `homeTeamId` y `awayTeamId` en `Match`, no es posible validar qué equipos participan en el partido ni si el jugador tiene contrato vigente con uno de ellos (criterios 3 y 8).
  2. Tampoco existen aún las entidades mínimas `Fan`, `Ticket` ni `Bet` para resolver destinatarios de correo (punto marcado `[PENDIENTE]` en `AGENTS.md`).
- **Archivos compartidos que se tocarán durante la implementación (en commits separados según `flujo-git`):**
  - `src/matches/entities/match.entity.ts`, `src/matches/dto/*`, `src/matches/mappers/match.mapper.ts`, `src/matches/matches.service.ts` *(si se confirma agregar `homeTeamId`, `awayTeamId` e `IN_PROGRESS` en `Match`)*.
  - `src/players/players.module.ts` (agregar verificación de `scoring_events` al verificador compuesto `PLAYER_DEPENDENCIES_CHECKER` para que `DELETE /players/:id` también bloquee si el jugador tiene anotaciones).
  - `src/app.module.ts` (registrar `ScoringEventsModule` / `MatchResultsModule` y `NotificationsModule`).
  - `.env.example` (agregar `NOTIFICATIONS_SERVICE_URL=http://localhost:8000`).
  - Nueva migración en `src/migrations/` para crear `scoring_events` (y agregar columnas faltantes a `matches` si se confirma).

## Modelo

Referencia: `modelo-relacional` (`Match` y `ScoringEvent`).

- **Entidad nueva:** `ScoringEvent` (tabla `scoring_events`).
  - `id`: entero autoincremental, PK.
  - `matchId` (columna `match_id`): entero, obligatorio, FK → `matches.id` (`ON DELETE RESTRICT`), indexado.
  - `playerId` (columna `player_id`): entero, obligatorio, FK → `players.id` (`ON DELETE RESTRICT`), indexado.
  - `teamId` (columna `team_id`): entero, obligatorio, FK → `teams.id` (`ON DELETE RESTRICT`), indexado (equipo por el que anotó).
  - `minute`: entero (`>= 0`), obligatorio.
  - `type`: `VARCHAR(50)`, obligatorio (p. ej. `"GOL"`, `"PENAL"`, `"TRIPLE"`, `"PUNTO"`, según el deporte).
- **Ajuste requerido en `Match` (tabla `matches`)** *(ver Pregunta abierta 1)*:
  - `homeTeamId` (`home_team_id`, FK → `teams.id`, `ON DELETE RESTRICT`, nullable por compatibilidad con registros existentes o obligatorio).
  - `awayTeamId` (`away_team_id`, FK → `teams.id`, `ON DELETE RESTRICT`).
  - `status`: incluir `IN_PROGRESS` junto a `SCHEDULED`, `FINISHED`, `CANCELLED`.
  - `homeScore` (`home_score`, int ≥ 0, nullable) y `awayScore` (`away_score`, int ≥ 0, nullable) ya existen en `Match`.
- **Restricciones e integridad:**
  - **Borrado en cascada prohibido:** todas las FKs de `scoring_events` hacia `matches`, `players` y `teams` deben ser `ON DELETE RESTRICT`.
  - Eliminar una anotación (`DELETE /scoring-events/:id`) borra únicamente la fila de `scoring_events`, nunca el jugador, el equipo ni el partido.

## Endpoints

Rutas alineadas exactamente con `api-rest` para `GC-07 Resultados y anotaciones`:

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `PUT` | `/matches/:id/result` | `{ homeScore, awayScore }` | `200 OK` (`MatchResultResponseDto`) | `400 Bad Request` (`id` no numérico o marcadores negativos/no enteros), `404 Not Found` (`NOT_FOUND`, partido no existe), `409 Conflict` (`INVALID_STATE`, partido `CANCELLED` o sin equipos participantes definidos) |
| `PATCH` | `/matches/:id/finish` | `{ homeScore?, awayScore? }` *(opcional si ya tiene resultado)* | `200 OK` (`MatchResultResponseDto` con `status: "FINISHED"`, emite notificación de resumen) | `400 Bad Request`, `404 Not Found`, `409 Conflict` (`INVALID_STATE` si está `CANCELLED`, ya está `FINISHED` o falta el marcador) |
| `POST` | `/matches/:id/scoring-events` | `{ playerId, teamId, minute, type }` | `201 Created` (`ScoringEventResponseDto`, emite notificación de anotación) | `400 Bad Request`, `404 Not Found` (partido, jugador o equipo no existe), `409 Conflict` (`INVALID_STATE` si partido no está en estado válido, `teamId` no participa en el partido, o jugador no tiene contrato vigente con `teamId` en la fecha del partido) |
| `GET` | `/matches/:id/scoring-events` | — | `200 OK` (`ScoringEventResponseDto[]`, ordenadas por `minute ASC, id ASC`) | `400 Bad Request` (`id` no numérico), `404 Not Found` (partido no existe) |
| `PUT` | `/scoring-events/:id` | `{ playerId, teamId, minute, type }` | `200 OK` (`ScoringEventResponseDto`) | `400 Bad Request`, `404 Not Found`, `409 Conflict` (`INVALID_STATE`, mismas validaciones de pertenencia y estado) |
| `DELETE` | `/scoring-events/:id` | — | `204 No Content` | `400 Bad Request` (`id` no numérico), `404 Not Found` (anotación no existe) |

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | El partido (`:id`) debe existir previamente para consultar/registrar resultados, finalizar o gestionar anotaciones. | Criterio 1 (`reglas-dominio`: Referencias) | `404 Not Found` (`NOT_FOUND`) |
| R2 | `homeScore` y `awayScore` deben ser enteros `>= 0`. No se puede registrar/modificar resultado en un partido `CANCELLED`. | Criterios 2, 4 (`reglas-dominio`: Resultados y anotaciones) | `400 Bad Request` / `409 Conflict` (`INVALID_STATE`) |
| R3 | El partido debe tener equipos participantes definidos (`homeTeamId`, `awayTeamId`, distintos entre sí) y `teamId` de la anotación debe ser uno de esos dos equipos. | Criterios 3 y 8 (`reglas-dominio`: Resultados y anotaciones) | `409 Conflict` (`INVALID_STATE`) |
| R4 | Para registrar/modificar una anotación, el partido debe estar en estado `IN_PROGRESS` o `FINISHED` *(ver Pregunta abierta 2 si también se permite en `SCHEDULED` mientras no exista endpoint de inicio)* y el jugador debe tener contrato vigente en la fecha del partido con el equipo `teamId` (local o visitante). | Criterios 6, 7 y 8 (`reglas-dominio`: Resultados y anotaciones) | `409 Conflict` (`INVALID_STATE`) |
| R5 | `minute` debe ser entero `>= 0` y `type` texto obligatorio no solo espacios (máx. 50 caracteres). | Criterios 6 y 9 | `400 Bad Request` |
| R6 | Eliminar una anotación (`DELETE /scoring-events/:id`) borra solo la anotación, nunca al jugador ni al partido. | Criterios 9 y 10 (`reglas-dominio`) | `404 Not Found` si no existe |
| R7 | `PATCH /matches/:id/finish` cambia el estado del partido a `FINISHED` (requiriendo `homeScore` y `awayScore` válidos, no permitido si está `CANCELLED` o ya `FINISHED`) y dispara la notificación de resumen. | Criterio 13 (`reglas-dominio`, `notificaciones`) | `409 Conflict` (`INVALID_STATE`) |
| R8 | Al crear una anotación y al finalizar el partido, se dispara la notificación por correo vía `ms_notificaciones` (`POST ${NOTIFICATIONS_SERVICE_URL}/send-email`) con `Promise.allSettled`, deduplicando destinatarios y **sin fallar nunca la operación HTTP principal** aunque `ms_notificaciones` esté caído. | Criterios 12 y 13 (`notificaciones`) | Nunca falla la respuesta HTTP (se registra en log) |
| R9 | *(Integración de dependencias)* Mientras un jugador tenga anotaciones en `scoring_events`, `DELETE /players/:id` debe rechazar el borrado (`409 INVALID_STATE`). | `reglas-dominio` (Jugadores GD-04) | `409 Conflict` (`INVALID_STATE`) |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El partido debe estar previamente registrado en el sistema. | Regla **R1** en todos los endpoints de resultados y anotaciones (`404 NOT_FOUND`). |
| El sistema debe permitir registrar el resultado correspondiente a los equipos participantes. | `PUT /matches/:id/result` (**R2**, **R3**, `200 OK`). |
| Solo se deben poder registrar resultados para los equipos que participan en el partido. | Regla **R3** valida que el partido tenga `homeTeamId` y `awayTeamId` y que el resultado corresponda únicamente a esos dos equipos. |
| El sistema debe permitir consultar y modificar el resultado del encuentro cuando las reglas de la competencia lo permitan. | `GET /matches/:id` (ya existente) + `PUT /matches/:id/result` (**R2**, permitido en `IN_PROGRESS` / `FINISHED` para correcciones, bloqueado en `CANCELLED`). |
| El resultado debe quedar asociado con el partido correspondiente. | Se persiste en `matches.home_score` y `matches.away_score` del partido `:id`. |
| El sistema debe permitir registrar una o varias anotaciones asociadas con el partido. | `POST /matches/:id/scoring-events` (`201 Created`, sin límite de anotaciones por partido). |
| Cada anotación debe estar asociada con el jugador que la realizó. | `scoring_events.player_id` (FK `RESTRICT` a `players.id`, validado vía `PlayerService`). |
| El jugador seleccionado para una anotación debe pertenecer a uno de los equipos participantes del partido. | Regla **R4** valida `teamId ∈ {homeTeamId, awayTeamId}` y contrato vigente del jugador en `teamId` en la fecha del partido (`409 INVALID_STATE`). |
| El sistema debe permitir consultar, modificar y eliminar las anotaciones registradas. | `GET /matches/:id/scoring-events` (`200`), `PUT /scoring-events/:id` (`200`), `DELETE /scoring-events/:id` (`204`). |
| Eliminar una anotación no debe eliminar al jugador ni al partido asociado. | Regla **R6** + FKs `RESTRICT` en `scoring_events`. |
| Las anotaciones deben conservar su relación con el partido y con el jugador correspondiente. | FKs `match_id`, `player_id` y `team_id` en `scoring_events`, devueltas en `ScoringEventResponseDto`. |
| Cuando se registre una anotación, el sistema debe enviar una notificación a los aficionados que hayan adquirido un boleto para el partido o realizado una apuesta sobre este. | Regla **R8**: `ScoringEventService` dispara notificación `scoring-event.created` hacia `ms_notificaciones` (ver Pregunta abierta 4 sobre destinatarios `Fan`/`Ticket`/`Bet`). |
| Al finalizar y registrar el resultado del partido, el sistema debe enviar una notificación con el resumen del encuentro a los aficionados que hayan adquirido un boleto o realizado una apuesta sobre el partido. | Regla **R8**: `PATCH /matches/:id/finish` dispara notificación `match.finished` con marcador y anotaciones hacia `ms_notificaciones`. |

## Casos límite

- Registrar resultado con `homeScore: -1` o decimal → `400 Bad Request`.
- Registrar resultado o anotación en partido inexistente → `404 Not Found`.
- Registrar resultado o anotación en partido `CANCELLED` → `409 Conflict` (`INVALID_STATE`).
- Registrar anotación de un jugador con `teamId` que **no** juega ese partido → `409 Conflict` (`INVALID_STATE`).
- Registrar anotación de un jugador que **no** tiene contrato vigente con ese equipo en la fecha del partido (contrato finalizado antes o inexistente) → `409 Conflict` (`INVALID_STATE`).
- Eliminar una anotación → `204 No Content`, y tanto el jugador como el partido siguen existiendo (`200 OK`).
- Intentar `DELETE /players/:id` de un jugador que tiene anotaciones → `409 Conflict` (`INVALID_STATE`).
- Registrar anotación o finalizar partido con `ms_notificaciones` apagado → la respuesta HTTP sigue siendo `201`/`200` y el error de envío se registra en log sin propagar fallo.

## Frontend

- **¿Tiene pantalla?** **Sí (Interfaz Requerida – I.R)** según `AGENTS.md` y `docs/alcance-integrante2.md`.
- Consumirá: `PUT /matches/:id/result`, `PATCH /matches/:id/finish`, `POST/GET /matches/:id/scoring-events`, `PUT/DELETE /scoring-events/:id`.

## Preguntas abiertas

Ninguna pendiente para iniciar la implementación de `HU-GC-07`.

*Decisiones cerradas:*
- Se agregan `homeTeamId`, `awayTeamId` (nullable por compatibilidad con registros existentes, con validación `homeTeamId !== awayTeamId` cuando ambos se envían) y `MatchStatus.IN_PROGRESS` en `src/matches/` (en commit separado de archivo compartido).
- Se permite registrar resultados y anotaciones en estados `SCHEDULED`, `IN_PROGRESS` y `FINISHED` (bloqueando `CANCELLED`).
- `homeScore` y `awayScore` se registran de forma independiente a la suma de `scoring_events`.
- Se implementa **Opción A** para notificaciones: módulo `src/notifications/` completo (`NotificationClient` + `HttpNotificationClient` con `axios` hacia `POST ${NOTIFICATIONS_SERVICE_URL}/send-email`, plantillas HTML en español, deduplicación, `Promise.allSettled`, puerto `MatchNotificationRecipientsProvider` con soporte opcional a `NOTIFICATIONS_TEST_EMAIL` en `.env`, y pruebas unitarias Jest).
