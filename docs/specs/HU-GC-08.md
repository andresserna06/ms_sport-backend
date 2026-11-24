# HU-GC-08 – Consultar desarrollo de un torneo

## Historia

**Historia de usuario:** Como administrador deportivo, quiero consultar la estructura y el desarrollo de un torneo, para conocer de manera centralizada el estado de la competencia.

**Criterios de aceptación** (`docs/historias-usuario.md`; el Anexo 3 la numera HU-GC-08 y la inscripción es HU-GC-02):

- C1. Seleccionar un torneo registrado.
- C2. Mostrar la información general del torneo.
- C3. Mostrar las fases que conforman la competencia.
- C4. En fases de grupos, mostrar los grupos y los equipos que los conforman. Si son grupos, la tabla de posiciones; si es fase final, a manera de llaves.
- C5. Mostrar los partidos asociados con cada fase.

`reglas-dominio` (GC-08) añade: indicador `hasResult` por partido, anotaciones de cada partido y "solo información del torneo consultado". Alcance (`docs/alcance-integrante1.md`): Interfaz Requerida; es una consulta agregada de **solo lectura**, no crea ni modifica datos. Depende de fases/grupos/partidos (integrante 3) y de GC-07 (integrante 2).

## Estado real del código (evidencia)

| Necesidad | Qué existe hoy | Consecuencia |
|---|---|---|
| Torneo | `Tournament` (id, name, startDate, enrollmentDeadline, active, sportId, `phases` OneToMany) | C1 y C2 se pueden entregar |
| Fases del torneo | `Phase.tournamentId` existe pero es NULLABLE y **ningún DTO/servicio de `src/phases` lo asigna** (`PhaseRequestDto` solo tiene `name` y `order`). Todas las fases tienen `tournament_id = NULL` | La consulta `WHERE tournament_id = :id` devuelve siempre vacío: **C3 no es entregable hoy** |
| Tipo de fase | `Phase` abstracta con herencia de tabla única (`phase_type`: `GROUP` / `FINAL`, no `GROUP_STAGE` / `KNOCKOUT`). El campo se llama `order`, no `sequence`. Sin UNIQUE (torneo, orden) | Hay que mapear `GROUP`→`GROUP_STAGE`, `FINAL`→`KNOCKOUT` en la respuesta |
| Grupos | **No existe entidad `Group` como grupo dentro de una fase**: `Group` es un `ChildEntity` de `Phase` (una fase de tipo grupo, endpoint `/groups`). No hay `competition_groups` ni `group_teams` ni `GroupTeam` | **C4 (grupos y equipos) no es entregable**; sin equipos por grupo no hay tabla de posiciones |
| Fase final / llaves | `Final` es otro `ChildEntity` vacío. `Match` **no tiene** `round`, `bracketPosition` ni `groupId` | **Las llaves no son entregables** |
| Partidos | `Match`: scheduledAt, status (`SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`), homeScore/awayScore (nullable), homeTeamId/awayTeamId (nullable), phase (ManyToOne, índice por fase). `GET /matches/phase/:phaseId` ya existe | C5 se puede entregar apenas haya fases ligadas al torneo |
| Resultado | Marcador nullable; `PUT /matches/:id/result` y `PATCH /matches/:id/finish` (GC-07). No existe columna "resultado registrado" | `hasResult` se deriva: `homeScore != null AND awayScore != null` (ver P3) |
| Anotaciones | `ScoringEvent` (matchId, playerId, teamId, minute, type); `ScoringEventRepository` solo tiene `findByMatchId` (uno a uno) | Para evitar N+1 hace falta un método por lote (brecha B4) |
| Inscripciones | No existe `Registration` (GC-02 fuera del alcance de este integrante) | No se pueden mostrar "equipos inscritos"; no es criterio de esta historia |

**Contradicción skill/código (no la decido yo):** `modelo-relacional` y `reglas-dominio` piden `Group` como entidad propia (`competition_groups`) dentro de una fase `GROUP_STAGE`, más `GroupTeam`, `Match.groupId`, `round`, `bracketPosition`. El código del integrante 3 modela el grupo **como fase**. Hasta que el grupo decida, no se puede especificar el contenido de C4.

## Estado de la implementación (actualizado)

- **Implementado:** etapas A y B de `GET /tournaments/:id/overview`: torneo, fases en orden (`order`, tipo `GROUP_STAGE`/`KNOCKOUT`), partidos por fase con `hasResult` y anotaciones por partido (jugador `{id, document}`, P8). Respuestas 200, 400, 404. Sin N+1: torneo, fases, partidos `IN`, anotaciones `IN`. Datos de ejemplo en `scripts/seed-data.mjs` (Copa Colombia de Fútbol 2027 con 2 fases, 4 partidos, 3 anotaciones) y carpeta Postman "GC-08 Desarrollo de un torneo".
- **Implementado (etapa C):** en cada fase `GROUP_STAGE`, `teams` (equipos con `group_id` de esa fase) y `standings` (tabla calculada al consultar con la regla propuesta R6: solo partidos `FINISHED`, 3/1/0, orden PTS, DIF, AF, nombre). En el código actual el grupo **es** la fase (`Group` hereda de `Phase` y `Team.group_id` apunta a ella), así que la respuesta no tiene un nivel `groups`: `teams` y `standings` van en la fase.
- **Implementado (etapa D):** en cada fase `KNOCKOUT`, `finalRound` (`ROUND_OF_16`, `QUARTERFINAL`, `SEMIFINAL`, `THIRD_PLACE`, `FINAL`, del integrante 3) y `bracket` con cada cruce (`matchId`, equipos, marcador, `status`, `winner`). Cada fase final es una ronda y las rondas se ordenan por `order`. `winner` es `null` si el partido no está `FINISHED` o terminó empatado (regla de empate [PENDIENTE], P5).
- **Estado: historia completa** (backend y frontend). Límites conocidos: no existe `bracketPosition` ni la relación entre cruces (qué partido alimenta a cuál), así que las llaves se muestran por ronda, sin conexiones; el empate en llaves sigue [PENDIENTE] (P5).
- Los datos de `scripts/seed-data.mjs` no inscriben equipos ni los asignan al grupo, por eso con ese seed `teams` y `standings` salen vacíos; con datos creados por la API sí se llenan.
- En la respuesta el campo se llama `order` (no `sequence`).

## Qué se entrega y qué no

| Etapa | Contenido | Condición |
|---|---|---|
| A (hoy) | Datos del torneo + `phases: []` + mensaje explícito | Ninguna; pero C3/C4/C5 quedan sin cubrir |
| B | A + fases en orden + partidos por fase con `hasResult` + anotaciones por partido | Integrante 3 asigna `tournamentId` al crear fases |
| C | B + grupos con equipos y tabla de posiciones | Existe pertenencia de equipos a grupo (`GroupTeam` o equivalente) y `Match.groupId` |
| D | C + llaves de fase final | `Match.round` y `Match.bracketPosition` |

Recomendación: implementar el endpoint por etapas, con el service armado para que cada bloque se active cuando exista su dato. Mientras no haya B, la historia queda **parcial** y no debe darse por cumplida.

## Endpoint

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| GET | `/tournaments/:id/overview` (ruta del mapa de `api-rest`; no inventar `/development`) | 200 + `TournamentOverviewDto` | 400 `INVALID_OPERATION` id no numérico (`idParamPipe`), 404 `NOT_FOUND` "No existe el torneo con id X" |

Vive en `TournamentsController`; el service del torneo **no** debe importar repositorios de fases, partidos ni anotaciones: usa un puerto `TournamentOverviewReader` (interfaz + token, principio D) implementado por un adaptador TypeORM, patrón de `scoring-event-dependencies.adapter.ts`. Un torneo inactivo se consulta con normalidad (`reglas-dominio`: sigue visible en consultas históricas).

### Forma de la respuesta (propuesta)

```json
{
  "tournament": { "id": 1, "name": "...", "sport": { "id": 1, "name": "Fútbol" }, "startDate": "2027-03-01", "enrollmentDeadline": "2027-02-01", "active": true },
  "message": "El torneo aún no tiene fases configuradas",
  "phases": [
    { "id": 10, "name": "Fase de grupos", "sequence": 1, "type": "GROUP_STAGE",
      "groups": [ { "id": 3, "name": "A", "teams": [ { "id": 5, "name": "..." } ],
        "standings": [ { "position": 1, "team": { "id": 5, "name": "..." }, "played": 2, "won": 1, "drawn": 1, "lost": 0, "goalsFor": 3, "goalsAgainst": 1, "goalDifference": 2, "points": 4 } ] } ],
      "matches": [ { "id": 77, "scheduledAt": "...", "status": "FINISHED", "hasResult": true, "homeTeam": {"id":5,"name":"..."}, "awayTeam": {"id":6,"name":"..."}, "homeScore": 2, "awayScore": 1,
        "scoringEvents": [ { "id": 1, "minute": 12, "type": "GOAL", "player": {"id":9,"name":"..."}, "team": {"id":5,"name":"..."} } ] } ] },
    { "id": 11, "name": "Final", "sequence": 2, "type": "KNOCKOUT", "groups": null,
      "bracket": [ { "round": 1, "matches": [ { "bracketPosition": 1, "matchId": 90, "winner": null } ] } ],
      "matches": [] }
  ]
}
```

`message` solo aparece si `phases` está vacío (mismo patrón del perfil de jugador GD-08). `groups`/`standings` solo en `GROUP_STAGE`; `bracket` solo en `KNOCKOUT`. Equipos, deporte y jugadores resumidos `{ id, name }` (consulta agregada: `api-rest` permite anidar). Nombre del jugador: la respuesta actual de GC-07 solo trae `document`, no nombre (P8). Fechas ISO 8601. DTO propio; nunca entidades.

## Reglas

| # | Regla | Origen | Estado |
|---|---|---|---|
| R1 | Torneo inexistente → 404; el torneo existe aunque esté inactivo | C1, `api-rest` | Definida |
| R2 | Solo fases con `tournament_id = :id`, ordenadas por `order` ASC (desempate por id); solo partidos de esas fases; solo anotaciones de esos partidos | `reglas-dominio` "solo información del torneo" | Definida |
| R3 | Torneo sin fases → 200 con `phases: []` y `message`; no es error | C3 | Propuesta mía (misma convención que GD-08) |
| R4 | `hasResult = homeScore != null && awayScore != null` | `reglas-dominio` | Definida en nombre; fórmula es P3 |
| R5 | Partidos por fase ordenados por `scheduledAt` ASC, id | C5 | Propuesta |
| R6 | Tabla: columnas PJ/PG/PE/PP/AF/AC/DIF/PTS, solo partidos `FINISHED` del grupo, victoria 3, empate 1, derrota 0, orden PTS, DIF, AF, nombre; calculada al consultar, sin tabla en BD | `reglas-dominio` (**Propuesta**) | Propuesta del grupo, sin confirmar (P4) |
| R7 | Llaves: partidos agrupados por `round`, ordenados por `bracketPosition`; ganador visible si está `FINISHED` | `reglas-dominio` (**Propuesta**) | Propuesta; empate es [PENDIENTE] (P5) |
| R8 | Partidos `CANCELLED` se listan pero no cuentan en la tabla | derivado de R6 | P4 |
| R9 | Solo lectura: sin transacción de escritura, sin eventos de notificación | alcance | Definida |

## Brechas en módulos ajenos (avisar al grupo antes de tocar)

| # | Archivo / módulo | Falta | Dueño |
|---|---|---|---|
| B1 | `src/phases/*` (servicios y DTO de grupo y final) | Asignar `tournamentId` al crear/editar (mapa `api-rest`: `POST /tournaments/:tournamentId/phases`) | Integrante 3 |
| B2 | Modelo de grupos | Decidir si `Group` es entidad propia + `GroupTeam` o se mantiene como fase; agregar `Match.groupId` | Integrante 3 + grupo |
| B3 | `src/matches/entities/match.entity.ts` | `round`, `bracketPosition` (y `groupId` según B2) con migración | Integrante 3 |
| B4 | `src/scoring-events/repositories` | `findByMatchIds(ids: number[])` en el puerto y el adaptador TypeORM (con `player` y `team` cargados) | Integrante 2 |
| B5 | `src/phases` y `src/matches` | Exponer lectura por lote `findByTournamentId` / `findByPhaseIds` (puerto o `exports` del módulo). No leer sus entidades directo desde `src/tournaments` salvo con permiso expreso | Integrantes 3 y 1 |
| B6 | `src/tournaments/tournaments.module.ts`, `app.module.ts` | Importar módulos/adaptadores nuevos (archivos compartidos) | Integrante 1 |

## Rendimiento (evitar N+1)

Máximo 4 consultas por petición, sin bucles de consulta: (1) torneo con deporte; (2) fases del torneo; (3) partidos `WHERE phase_id IN (...)` con equipos (join); (4) anotaciones `WHERE match_id IN (...)` con jugador y equipo. Con grupos: (5) `GroupTeam`/grupos por `phase_id IN (...)`. La tabla y las llaves se calculan en memoria (el service, con funciones puras sin acceso a datos, probables con Jest). Índices ya existentes: `IDX_phases_tournament_id`, `IDX_matches_phase_id`, `IDX_scoring_events_match_id`. Sin paginación (no está en la skill); riesgo de respuesta grande en torneos con muchos partidos: ver P7.

## Casos límite

- Id `abc`, `0` o negativo: 400. Id inexistente: 404 (no 200 vacío).
- Torneo sin fases: 200, `phases: []`, `message`. Torneo inactivo: 200.
- Fase de grupos sin partidos: tabla con todos los equipos en 0 (si hay pertenencia) o lista vacía; fase final sin partidos: `bracket: []`.
- Partido con `homeTeamId`/`awayTeamId` NULL (son nullable): mostrar `homeTeam: null`, no fallar ni contarlo en tabla.
- Partido `FINISHED` con marcador NULL (GC-07 lo impide en `finish`, pero los datos viejos pueden tenerlo): `hasResult=false`, excluir de la tabla.
- Partido `IN_PROGRESS` con marcador parcial: `hasResult` según R4; no cuenta en la tabla (solo `FINISHED`).
- Empate de todos los criterios en la tabla: orden alfabético por nombre (R6), estable.
- Anotación cuyo `teamId` no es ni local ni visitante (datos inconsistentes): se muestra tal cual, no entra en cálculos (la tabla usa marcador, no anotaciones; P2).
- Fases de otros torneos y fases con `tournament_id NULL`: nunca aparecen (R2); es el motivo por el que, hasta B1, el endpoint no muestra fases.

## Impacto en datos, seed y Postman

- Seed `scripts/seed-data.mjs`: solo inserta `sports`, `teams`, `team_sports` y `tournaments`; **no hay fases, grupos, partidos, jugadores ni anotaciones**. Sin ampliar el seed solo se prueban 404, 400 y "torneo sin fases". Propuesta: un seed opt-in aparte (`seed-tournament-overview.mjs`, no tocar el seed base ni los torneos de Fútbol/Baloncesto/Atletismo de los que dependen GD-01 E-11/E-12) que cree, bajo un deporte `QA-...`, un torneo con fases ligadas (`tournament_id`), equipos, partidos con y sin marcador y anotaciones. Hasta B1/B2/B3 las filas se insertarían por SQL directo, no por API.
- `postman/MsSports.postman_collection.json`: agregar folder GC-08 (matriz a diseñar por `tester`): 404, 400, torneo sin fases (200 + `message`), torneo con fases y solo sus fases (aislamiento entre dos torneos), `hasResult` true/false, anotaciones por partido, orden de fases. Los casos de tabla y llaves quedan bloqueados hasta C/D. Los casos de aislamiento y partidos necesitan fixtures por SQL (patrón `postman/fixtures/db.mjs` y `teardown.mjs`, que ya limpia por `QA`; ampliarlo a `phases`/`matches`/`scoring_events`). `GestionDeportiva.postman_collection.json` no llama a torneos: sin impacto. No crear endpoints solo para pruebas.
- Frontend (I.R): una pantalla de detalle con pestañas por fase; debe tratar `message`, `groups: null` y `homeTeam: null`.

## Trazabilidad

| Criterio | Cómo se cubre | Estado |
|---|---|---|
| C1 | `GET /tournaments/:id/overview`, R1 | Entregable hoy |
| C2 | bloque `tournament` | Entregable hoy |
| C3 | `phases`, R2/R3 | Bloqueado por B1 |
| C4 (grupos y equipos) | `groups[].teams` | Bloqueado por B2 |
| C4 (posiciones) | `standings`, R6 | Bloqueado por B2 y P4 |
| C4 (llaves) | `bracket`, R7 | Bloqueado por B3 y P5 |
| C5 | `matches` por fase, R4/R5 | Bloqueado por B1 |
| Anotaciones por partido (`reglas-dominio`) | `scoringEvents`, B4 | Bloqueado por B1 y B4 |

## Preguntas abiertas

| # | Pregunta | Recomendación (propuesta) |
|---|---|---|
| P1 | ¿Cómo se modela el grupo: entidad propia dentro de una fase (`modelo-relacional`) o como fase (código actual)? | Seguir `modelo-relacional` (Group + GroupTeam + `Match.groupId`) porque es el único que da "grupos y equipos que los conforman". Decidir antes de implementar C4 |
| P2 | [PENDIENTE de GC-07] ¿La tabla usa el marcador del partido o la suma de anotaciones? | Marcador (`homeScore`/`awayScore`), ya que es lo que `finish` valida |
| P3 | ¿`hasResult` es "marcador no nulo" o "estado `FINISHED`"? | Marcador no nulo; así un partido `IN_PROGRESS` con resultado parcial se distingue de uno pendiente |
| P4 | ¿Se confirman 3/1/0 y el orden PTS, DIF, AF, nombre? ¿Cuentan `CANCELLED`/`IN_PROGRESS`? ¿Desempate por enfrentamiento directo? | Confirmar tal cual `reglas-dominio`; solo `FINISHED`; sin enfrentamiento directo (no está definido) |
| P5 | [PENDIENTE] Empate en fase final (penales, partido extra) y cómo se muestra el ganador | Mientras no se decida, `winner: null` en empate; no inventar campo de penales |
| P6 | ¿Qué hacer con fases de torneos existentes con `tournament_id NULL`? | Ignorarlas; el integrante 3 las corrige o el seed las recrea. Nunca asignarlas por adivinanza |
| P7 | ¿Se acepta respuesta única y sin paginar, o se separa `GET /tournaments/:id/phases/:phaseId/overview`? | Una sola respuesta; reevaluar si pasa de cientos de partidos |
| P8 | ¿Qué nombre mostrar del jugador en las anotaciones? | Reusar lo que devuelva el módulo de jugadores (nombre completo); si no está disponible, `{ id, document }` como GC-07. Pedir confirmación al integrante 2 |
| P9 | ¿Se implementa por etapas (A→D) o se espera a que existan B1-B3? | Por etapas, dejando la historia marcada parcial hasta C; así el integrante 1 no queda bloqueado |
