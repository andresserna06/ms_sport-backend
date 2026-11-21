# HU-GC-06 – Gestionar partidos

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar los partidos de las diferentes fases de un torneo, para organizar y controlar los encuentros que conforman la competencia.

**Criterios de aceptación:**

- El torneo y la fase correspondiente deben existir previamente.
- El sistema debe permitir registrar un nuevo partido con la información requerida.
- Cada partido debe estar asociado con una fase de la competencia.
- El sistema debe permitir definir los equipos que participarán en el partido.
- No se debe permitir que un equipo compita contra sí mismo.
- Los equipos seleccionados deben encontrarse habilitados para participar en la competencia.
- El sistema debe permitir consultar los partidos registrados.
- Se debe poder consultar la información detallada de cada partido.
- Se debe permitir actualizar la información de un partido cuando su estado lo permita.
- Se debe permitir eliminar un partido cuando no tenga información asociada que lo impida.
- Cuando corresponda, se debe poder asociar el partido con el escenario en el que será disputado.
- Los cambios realizados deben quedar almacenados correctamente.
- Se debe enviar un correo electrónico cuando se cree un partido a los aficionados que han participado en partidos anteriores a los equipos enfrentados.

## Dependencias

- **Historias o módulos que deben existir antes:**
  - `HU-GC-01` (`src/tournaments/`): torneo existe y define deporte/estado/fechas.
  - `HU-GC-02` (`src/registrations/`, en `main`): inscripción de equipo en torneo; necesaria para validar "equipos habilitados".
  - `HU-GC-03` (`src/phases/base/`): fase existe y pertenece a un torneo.
  - `HU-GC-04` (`src/phases/group/`): relación Grupo–Equipo (`teams.group_id`) para validar pertenencia a grupo en fase `GROUP`.
  - `HU-GC-05` (`src/phases/final/`): fases finales; el partido debe soportar `round` y `bracketPosition` en fase `FINAL`.
  - `HU-GD-02` (`src/teams/`): equipos participantes.
  - `HU-GD-03` (`TeamSport`): dependencia de GC-02 para que la inscripción sea coherente con el deporte del torneo; GC-06 no revalida TeamSport directamente, depende de la inscripción activa.
  - `HU-GC-07` (`src/scoring-events/`): ya consume `MatchesService.updateResult` y `MatchesService.finishMatch`; la separación de responsabilidades no debe romperlo.
  - `notificaciones` / `ms_notificaciones`: envío de correo al crear partido (criterio 13).
- **Archivos compartidos que se tocarán (si se implementa):**
  - `src/matches/*` (módulo GC-06).
  - `src/app.module.ts` (solo si se agregan módulos/controladores; hoy `MatchesModule` ya está registrado).
  - `src/scoring-events/controllers/match-results.controller.ts` y `src/scoring-events/services/match-results.service.ts` (verificar compatibilidad; no cambiar contrato GC-07 sin coordinación).
  - `src/notifications/*` (agregar notificación de partido creado, si se implementa criterio 13).
  - Migración TypeORM en `src/migrations/` si se agregan columnas (`round`, `bracket_position`, `venue_id`) o restricciones.
  - Entidades/módulos externos: `Venue`/`TournamentVenue` solo si se implementa escenario (hoy no existen en el repo).

## Modelo

Referencia: `modelo-relacional` (`Match`), `reglas-dominio` (GC-06, GC-07).

### Estado actual (`src/matches/entities/match.entity.ts`)

| Campo | Estado | Observación |
|---|---|---|
| `id` | Existe | PK autoincremental. |
| `scheduledAt` (`scheduled_at`) | Existe | `datetime`, obligatorio. |
| `status` | Existe | Enum `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`; default `SCHEDULED`. |
| `homeScore` / `awayScore` | Existe | `int`, nullable. |
| `homeTeamId` / `awayTeamId` | Existe | FK nullable a `teams.id`, `RESTRICT`, indexadas. |
| `phase` (`phase_id`) | Existe | `ManyToOne` obligatorio a `Phase`, `RESTRICT`. |
| `venueId` (`venue_id`) | Falta | Opcional por historia/reglas; `Venue` no existe en repo. |
| `round` | Falta | Nullable; requerido por modelo para fase final. |
| `bracketPosition` (`bracket_position`) | Falta | Nullable; requerido por modelo para fase final. |

Restricciones actuales: `CHK_matches_distinct_teams` en BD (`home <> away` cuando ambos no son null). Falta validar a nivel de servicio/dominio para IDs iguales antes de persistir con mensaje claro (hoy existe, 400 `INVALID_OPERATION`).

### Cambios de modelo propuestos (alcance GC-06)

- Mantener `Match` como entidad de GC-06 dueña de `phase_id`, equipos, programación, escenario y metadatos de llave.
- Agregar `round` (`int`, nullable) y `bracketPosition` (`int`, nullable) solo si se confirma que GC-06 debe cubrir fase final en esta entrega; en fase `GROUP` deben ser `null`.
- Agregar `venueId`/relación `Venue` solo cuando exista la entidad `Venue` y se defina la regla de asociación a torneo. Mientras no exista, el campo no se implementa y se documenta como brecha/pregunta abierta.
- No agregar cascadas hacia `Team`, `Phase`, `Venue`, `Tournament`.

## Endpoints

### Contrato actual (implementado)

| Método | Ruta | Body | Éxito | Observación |
|---|---|---|---|---|
| `POST` | `/matches` | `CreateMatchDto` | `201` | No coincide con mapa `api-rest`. |
| `GET` | `/matches` | - | `200` | Coincide. |
| `GET` | `/matches/phase/:phaseId` | - | `200` | No coincide con mapa (`/phases/:phaseId/matches`). |
| `GET` | `/matches/reports/status/:status` | - | `200` | Extra, no está en mapa GC-06. |
| `GET` | `/matches/:id` | - | `200` | Coincide. |
| `PATCH` | `/matches/:id` | `UpdateMatchDto` | `200` | Mapa propone `PUT`; además mezcla status/scores con datos generales. |
| `DELETE` | `/matches/:id` | - | `200 {message}` | Mapa/convención esperan `204` sin cuerpo; hoy devuelve 200. |

### Contrato HTTP objetivo (alineado a `api-rest` y alcance solicitado)

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| `POST` | `/phases/:phaseId/matches` | `{ scheduledAt, homeTeamId, awayTeamId, venueId?, round?, bracketPosition? }` | `201 Created` (`MatchResponseDto`) | `400` DTO inválido/IDs no numéricos/mismo equipo; `404` fase/equipo/escenario no existe; `409` equipos no inscritos activos en torneo, equipo inactivo, pertenencia a grupo inválida, torneo/fase inconsistente, escenario no asociado (si aplica) |
| `GET` | `/phases/:phaseId/matches` | - | `200 OK` (`MatchResponseDto[]`) | `400` ID inválido; `404` fase no existe |
| `GET` | `/matches` | Query opcional (p. ej. `status`, `phaseId`) solo si se justifica | `200 OK` (`MatchResponseDto[]`) | `400` query inválida |
| `GET` | `/matches/:id` | - | `200 OK` (`MatchResponseDto`) | `400`; `404` |
| `PUT` | `/matches/:id` | `{ scheduledAt, homeTeamId, awayTeamId, phaseId?, venueId?, round?, bracketPosition? }` | `200 OK` (`MatchResponseDto`) | `400`; `404`; `409 INVALID_STATE` si partido no está `SCHEDULED`; `409` reglas de habilitación/grupo |
| `DELETE` | `/matches/:id` | - | `204 No Content` | `400`; `404`; `409 INVALID_STATE` si no está `SCHEDULED` o tiene anotaciones/boletos/apuestas |

**Endpoints de resultado/finalización (GC-07, fuera del update genérico):**

| Método | Ruta | Dueño | Contrato |
|---|---|---|---|
| `PUT` | `/matches/:id/result` | `MatchResultsController` (GC-07) | Actualiza marcador; no modifica equipos/fase/programación. |
| `PATCH` | `/matches/:id/finish` | `MatchResultsController` (GC-07) | Finaliza partido, exige marcador válido, emite notificación de resumen. |

**Decisión de contrato:** el endpoint genérico de GC-06 no debe aceptar `status`, `homeScore` ni `awayScore`. Esos campos se gestionan por GC-07. Esto separa responsabilidades y evita transiciones inválidas desde un PATCH genérico.

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | La fase (`phaseId`) debe existir. | Criterio 1, 3 | `404 Not Found` (`NOT_FOUND`) |
| R2 | El torneo de la fase debe existir; la fase no puede quedar sin torneo. | Criterio 1 | `404/409` según caso (`NOT_FOUND`/`INVALID_STATE`); hoy `Phase.tournament` es nullable en entidad, pero la creación de fases exige torneo. |
| R3 | `homeTeamId` y `awayTeamId` deben existir. | Criterio 4 | `404 Not Found` (`NOT_FOUND`) |
| R4 | Un equipo no puede competir contra sí mismo (`homeTeamId !== awayTeamId`). | Criterio 5 | `400 Bad Request` (`INVALID_OPERATION`) |
| R5 | Ambos equipos deben estar habilitados para participar: inscripción activa en el torneo de la fase. | Criterio 6, `reglas-dominio` GC-06 | `409 Conflict` (`INVALID_STATE`) |
| R6 | Ambos equipos deben estar activos. | Transversal + criterio 6 | `409 Conflict` (`INVALID_STATE`) |
| R7 | En fase `GROUP`, ambos equipos deben pertenecer al mismo grupo y ese grupo debe ser la fase del partido (`team.group.id === phase.id`). | `reglas-dominio` GC-06 | `409 Conflict` (`INVALID_STATE`) |
| R8 | En fase `FINAL`, el partido debe guardar `round` y `bracketPosition` (nullable en BD, obligatorio por regla de negocio cuando aplique). | `reglas-dominio` GC-06 | `400`/`409` según definición final; **pregunta abierta**. |
| R9 | `venueId`, si se envía, debe existir; (Propuesta) asociado al torneo. | Criterio 11 | `404 NOT_FOUND` / `409 INVALID_STATE` |
| R10 | Solo se modifica un partido si está `SCHEDULED`. | Criterio 9 | `409 Conflict` (`INVALID_STATE`) |
| R11 | Solo se elimina si está `SCHEDULED` y no tiene anotaciones, boletos ni apuestas. | Criterio 10 | `409 Conflict` (`INVALID_STATE`) |
| R12 | Al crear un partido se emite notificación a aficionados que participaron en partidos anteriores de los equipos enfrentados. | Criterio 13 | No debe fallar la operación principal; error de notificación se loguea. |
| R13 | Resultado/finalización no se hacen por update genérico: `PUT /matches/:id/result` y `PATCH /matches/:id/finish` son los contratos GC-07. | Separación solicitada, compatibilidad GC-07 | `400`/`409` si se intenta por ruta incorrecta o estado inválido. |

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El torneo y la fase correspondiente deben existir previamente. | R1, R2; validación en `POST /phases/:phaseId/matches` y `PUT /matches/:id`. |
| El sistema debe permitir registrar un nuevo partido con la información requerida. | `POST /phases/:phaseId/matches`, DTO de creación, `201`. |
| Cada partido debe estar asociado con una fase de la competencia. | `Match.phase` obligatorio; `phaseId` en ruta/body validado. |
| El sistema debe permitir definir los equipos que participarán en el partido. | `homeTeamId`, `awayTeamId` en DTO; R3. |
| No se debe permitir que un equipo compita contra sí mismo. | R4, `400 INVALID_OPERATION`. |
| Los equipos seleccionados deben encontrarse habilitados para participar en la competencia. | R5, R6, R7; inscripción activa en torneo + reglas de grupo/activo. |
| El sistema debe permitir consultar los partidos registrados. | `GET /matches`, `GET /phases/:phaseId/matches`. |
| Se debe poder consultar la información detallada de cada partido. | `GET /matches/:id`. |
| Se debe permitir actualizar la información de un partido cuando su estado lo permita. | `PUT /matches/:id`, R10. |
| Se debe permitir eliminar un partido cuando no tenga información asociada que lo impida. | `DELETE /matches/:id`, R11. |
| Cuando corresponda, se debe poder asociar el partido con el escenario en el que será disputado. | R9; campo `venueId` opcional cuando exista `Venue`. |
| Los cambios realizados deben quedar almacenados correctamente. | Persistencia TypeORM + respuesta DTO. |
| Se debe enviar un correo electrónico cuando se cree un partido a los aficionados que han participado en partidos anteriores a los equipos enfrentados. | R12; integración con `NotificationsModule`/`ms_notificaciones`. |

## Brechas y cambios requeridos (enfoque solicitado)

### 1) Inscripción activa en un torneo

- **Existe:** `RegistrationsService` y `RegistrationRepository.findByTournamentAndTeam`; GC-02 elimina la fila al retirar (no hay campo `status` en `Registration`).
- **Falta en GC-06:** `MatchesService.create/update` no verifica inscripción. Solo verifica existencia de equipos.
- **Cambio:** obtener el torneo de la fase (`phase.tournament.id`) y validar que exista `Registration` para `homeTeamId` y `awayTeamId` en ese torneo. Si no existe, `409 INVALID_STATE` con mensaje claro ("El equipo X no está inscrito activamente en el torneo Y").
- **Definición operativa:** "inscripción activa" = existe fila en `registrations` para `(tournamentId, teamId)`, dado que el retiro físico elimina la inscripción. Confirmar si a futuro se usará borrado lógico.

### 2) Pertenencia a grupo

- **Existe:** `Team.group` (`teams.group_id`), `Group` como fase `GROUP`, `GroupService` es dueño de escritura de Group-Team.
- **Falta en GC-06:** no se valida que en partidos de fase de grupos ambos equipos pertenezcan al grupo/fase del partido.
- **Cambio:** si la fase es `Group` (`phaseType === 'GROUP'` o instancia de `Group`), cargar/validar `team.group.id === phase.id` para ambos equipos. Si no, `409 INVALID_STATE`.
- **Borde:** si un equipo no tiene grupo, o tiene grupo distinto, se rechaza. No asignar grupos desde matches.

### 3) Contrato HTTP

- **Existe:** `POST /matches`, `GET /matches/phase/:phaseId`, `PATCH /matches/:id`, `DELETE /matches/:id` devuelve 200 con mensaje.
- **Falta/desalineado:** mapa `api-rest` define `POST/GET /phases/:phaseId/matches`, `GET /matches`, `GET/PUT/DELETE /matches/:id`.
- **Cambio propuesto:**
  - Agregar `POST /phases/:phaseId/matches` y `GET /phases/:phaseId/matches` (controller por fase o rutas compatibles en `MatchesController`; preferir claridad y compatibilidad).
  - Cambiar actualización genérica a `PUT /matches/:id` (o soportar PUT y deprecar PATCH temporalmente; decidir estrategia de compatibilidad).
  - Cambiar `DELETE /matches/:id` a `204 No Content`.
  - Mantener `GET /matches` y `GET /matches/:id`.
  - Evaluar si conservar rutas antiguas como alias temporal para no romper frontend/Postman; si se conservan, documentar deprecación.
  - `GET /matches/reports/status/:status` es extra; no forma parte de GC-06 mapa, puede mantenerse si no choca.

### 4) Separar update genérico de result/finish

- **Existe:** GC-07 ya expone `PUT /matches/:id/result` y `PATCH /matches/:id/finish` en `MatchResultsController`, delegando a `MatchesService.updateResult` y `MatchesService.finishMatch`. Esto ya separa el contrato público de resultado/finalización.
- **Problema:** `UpdateMatchDto` y `PATCH /matches/:id` permiten `status`, `homeScore`, `awayScore`, lo que duplica responsabilidad y permite cambios de resultado/estado fuera del flujo GC-07.
- **Cambio propuesto:**
  - Crear DTO de update genérico GC-06 (p. ej. `UpdateMatchDto` redefinido o `UpdateMatchScheduleDto`) con solo campos administrativos: `scheduledAt`, `homeTeamId`, `awayTeamId`, `phaseId?`, `venueId?`, `round?`, `bracketPosition?`. **No** incluir `status`, `homeScore`, `awayScore`.
  - `MatchesService.update` solo aplica esos campos, valida R1-R10, y rechaza cambios si no `SCHEDULED`.
  - Mantener `MatchesService.updateResult` y `finishMatch` para GC-07; no moverlos a un controlador que rompa rutas GC-07. Opcionalmente extraer lógica a un servicio de dominio compartido, pero sin cambiar endpoints GC-07.
  - Eliminar/ignorar la capacidad de `PATCH /matches/:id` para finalizar o puntuar. Si se mantiene PATCH por compatibilidad, que use el mismo DTO restringido.
  - Asegurar que GC-07 no dependa del DTO genérico de GC-06.

### Compatibilidad con GC-07

- GC-07 usa `MatchesService.findOne`, `updateResult`, `finishMatch`. Estas firmas deben mantenerse o cambiarse con actualización coordinada.
- GC-07 asume `MatchResponseDto` con `homeTeamId/awayTeamId/phaseId/status/scores`. No romper campos existentes.
- GC-07 valida reglas de anotación por estado del partido; la separación de GC-06 no debe alterar estados permitidos salvo decisión explícita.

## Casos límite

- Crear partido con equipo no inscrito en el torneo de la fase → `409 INVALID_STATE`.
- Crear partido con equipo inscrito pero inactivo → `409 INVALID_STATE`.
- Crear partido en fase `GROUP` con equipo inscrito en torneo pero asignado a otro grupo → `409 INVALID_STATE`.
- Crear partido en fase `GROUP` con equipo sin `groupId` → `409 INVALID_STATE`.
- Crear partido con `homeTeamId == awayTeamId` → `400 INVALID_OPERATION`.
- Actualizar partido `FINISHED`/`CANCELLED`/`IN_PROGRESS` por endpoint genérico → `409 INVALID_STATE`.
- Intentar enviar `status` o `homeScore` por update genérico → `400` (propiedad no permitida) o ignorado; se prefiere `400` con validación DTO.
- Eliminar partido con anotaciones → `409 INVALID_STATE` (ya existe vía `MatchDependenciesChecker`).
- Eliminar partido con boletos/apuestas → `409 INVALID_STATE`; hoy no hay modelo de tickets/bets, queda como regla bloqueante cuando existan.
- Crear partido en fase final sin `round`/`bracketPosition` → depende de decisión; documentar.
- Fase sin torneo asociado (dato inconsistente) → `409 INVALID_STATE` o `404`; no permitir crear partido.

## Frontend

- Tiene pantalla (GC-06 es I.R. según alcance). Consume endpoints de partidos para CRUD y consulta.
- Debe usar endpoints GC-07 para resultado/finalización; no enviar scores/status al update genérico.
- Si se cambia contrato HTTP (rutas/método 204/PUT), coordinar con frontend.

## Preguntas abiertas

- **Inscripción activa:** ¿"activa" significa solo que existe la fila en `registrations`? Actualmente el retiro elimina la fila; si se cambia a borrado lógico, GC-06 deberá filtrar por estado. **Propuesta:** considerar activa la existencia de `Registration` en el torneo.
- **Equipos habilitados:** ¿además de inscripción activa, se exige `Team.active=true` y `Tournament.active=true`/estado válido? **Propuesta:** sí, rechazar equipos/torneo inactivos con `409 INVALID_STATE`.
- **Pertenencia a grupo en `FINAL`:** ¿se debe prohibir/ignorar `round/bracketPosition` en `GROUP` y exigirlos en `FINAL`? **Propuesta:** en `GROUP` deben ser null; en `FINAL` requeridos.
- **Venue:** no existe entidad `Venue`/`TournamentVenue` en el repo. ¿Se implementa `venueId` en esta prioridad o se difiere? **Propuesta:** diferir `venueId` hasta que exista el modelo de escenarios; mantener criterio 11 como pendiente trazado.
- **Contrato HTTP:** el mapa `api-rest` pide `POST/GET /phases/:phaseId/matches` y `PUT/DELETE /matches/:id`. El código actual usa otras rutas y `PATCH`. ¿Se permite breaking change o se mantienen alias? **Propuesta:** implementar rutas objetivo y mantener alias temporales con documentación, `DELETE` pasa a `204`.
- **Tickets/apuestas:** R11 exige no eliminar si hay boletos/apuestas; no existen entidades. **Propuesta:** mantener verificación extensible en `MatchDependenciesChecker`; agregar adaptadores cuando existan Ticket/Bet.
- **Notificación al crear partido (criterio 13):** `notificaciones` skill indica destinatarios "aficionados que han participado en partidos anteriores de los equipos enfrentados"; AGENTS marca pendiente el alcance por falta de Fan/Boleto/Apuesta. **Propuesta:** implementar puerto/notificador con proveedor de destinatarios vacío o detrás de feature flag, sin romper creación; confirmar alcance real.
- **Iniciación de partido:** no hay endpoint para pasar a `IN_PROGRESS`. GC-07 permite anotaciones en `SCHEDULED/IN_PROGRESS/FINISHED`. ¿Se requiere `PATCH /matches/:id/start`? **Propuesta:** fuera de esta prioridad; documentar.
- **PUT vs PATCH:** `api-rest` sugiere `PUT` para update; implementación actual usa `PATCH`. **Propuesta:** aceptar `PUT` como contrato objetivo y, si se desea compatibilidad, soportar `PATCH` con el mismo DTO restringido.
## Actualización de alcance implementado (2026-11-21)

### Decisiones aplicadas
- Contrato HTTP alineado a `api-rest`: `POST/GET /phases/:phaseId/matches`, `GET /matches`, `GET /matches/:id`, `PUT /matches/:id`, `DELETE /matches/:id` (204). Sin rutas legacy ni `GET /matches/reports/status/:status`.
- Update genérico separado de resultado/finalización: `PUT /matches/:id` no acepta `status/homeScore/awayScore`; GC-07 mantiene `PUT /matches/:id/result` y `PATCH /matches/:id/finish`.
- Equipos: obligatorios en fase `GROUP`; opcionales en fase `FINAL`. Si se envían en FINAL, se validan existencia, activo, no mismo equipo e inscripción activa en torneo.
- Diferido: `venueId`, `round`, `bracketPosition` y correo al crear partido (criterio 13).
- Reglas cerradas: inscripción activa en torneo (`Registration` existente), pertenencia al grupo de la fase en `GROUP`, fase con torneo asociado, update/delete solo `SCHEDULED`, delete bloqueado si tiene anotaciones.

### Nota de compatibilidad
- Cambio breaking para Postman/frontend GC-06 por rutas, método PUT y DELETE 204.
