---
name: modelo-relacional
description: Modelo de datos del proyecto (deportes, equipos, jugadores, habilidades, torneos, fases, grupos, partidos, anotaciones) con sus nombres en inglés, relaciones y restricciones. Úsala al crear o cambiar entidades, relaciones, índices, restricciones o migraciones.
---

# Modelo relacional del proyecto

Basado en el diagrama de clases del grupo, con las correcciones acordadas.
Si el código y esta skill no coinciden, se reporta; no se "arregla" en silencio.

## Glosario: diagrama (español) → código (inglés)

El código se escribe en inglés. Esta tabla es la traducción oficial; ningún
agente inventa otra. Si falta un término, se agrega aquí antes de usarlo.

| Diagrama / historias | Entidad en código | Tabla |
|---|---|---|
| Deporte (subdeporte) | `Sport` (`parentSport`) | `sports` |
| Equipo | `Team` | `teams` |
| EquipoDeporte | `TeamSport` | `team_sports` |
| Jugador | `Player` | `players` |
| EquipoJugador (contrato) | `PlayerContract` | `player_contracts` |
| Habilidad | `Skill` | `skills` |
| HabilidadJugador | `PlayerSkill` | `player_skills` |
| Torneo | `Tournament` | `tournaments` |
| Inscripción | `Registration` | `registrations` |
| Fase | `Phase` | `phases` |
| Grupo | `Group` | `competition_groups` (`group` es palabra reservada en MySQL) |
| GrupoEquipo | `GroupTeam` | `group_teams` |
| Final | `KnockoutPhase` (fase tipo `KNOCKOUT`) | dentro de `phases` |
| Partido | `Match` | `matches` |
| Anotación | `ScoringEvent` | `scoring_events` |
| Escenario | `Venue` | `venues` |
| Localidad | `SeatingZone` | `seating_zones` |
| EscenarioTorneo | `TournamentVenue` | `tournament_venues` |
| Aficionado / Boleto / Apuesta | `Fan` / `Ticket` / `Bet` | `fans` / `tickets` / `bets` |

Estados y tipos (enums en inglés, MAYÚSCULAS):
- Torneo: `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`.
- Partido: `SCHEDULED`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`.
- Tipo de fase: `GROUP_STAGE` (fase de grupos), `KNOCKOUT` (fase final).

## Entidades del alcance

Propiedades en camelCase en el código y snake_case en la base de datos.

| Entidad | Campos clave | Restricciones |
|---|---|---|
| Sport | id, name, description, active, parentSportId (nullable) | name único (sin distinguir mayúsculas, tras trim). Autorrelación 1:N (subdeportes) |
| Team | id, name, city, contactEmail, foundedYear, active | name único |
| TeamSport | teamId, sportId | PK o UNIQUE (teamId, sportId) |
| Player | id, documentNumber, firstName, lastName, birthDate, active | documentNumber único |
| PlayerContract | id, playerId, teamId, startDate, endDate (nullable) | ver reglas de solape en `reglas-dominio`. Es entidad propia, no tabla puente simple, porque guarda historial |
| Skill | id, name, description | name único |
| PlayerSkill | playerId, skillId | UNIQUE (playerId, skillId) |
| Tournament | id, name, sportId, startDate, enrollmentDeadline, active | FK a Sport (obligatoria); nombre único por deporte. `endDate` y `status` se agregan cuando GC-02/GC-06 los necesiten |
| Registration | id, tournamentId, teamId, registeredAt | UNIQUE (tournamentId, teamId) |
| Phase | id, tournamentId, name, sequence, type | UNIQUE (tournamentId, sequence) (`order` es palabra reservada) |
| Group | id, phaseId, name | UNIQUE (phaseId, name) |
| GroupTeam | groupId, teamId, phaseId | UNIQUE (groupId, teamId) y UNIQUE (phaseId, teamId) |
| Match | id, phaseId, groupId (nullable), homeTeamId, awayTeamId, venueId (nullable), scheduledAt, status, homeScore, awayScore, round (nullable), bracketPosition (nullable) | CHECK homeTeamId <> awayTeamId |
| ScoringEvent | id, matchId, playerId, teamId, minute, type | FK a Match y Player |
| Venue / SeatingZone / TournamentVenue | según diagrama | UNIQUE (tournamentId, venueId) en TournamentVenue |

Mínimas, solo para notificaciones: Fan (id, name, email), Ticket
(fanId, matchId), Bet (fanId, matchId).

## Correcciones respecto al diagrama original

1. **Grupo–Equipo era 1:N** → pasa a **N:N con GroupTeam**. Un equipo juega
   varios torneos, así que no puede pertenecer a un solo grupo de por vida.
   `phaseId` se guarda en GroupTeam para poder imponer "un equipo en un solo
   grupo por fase" con una restricción UNIQUE.
2. **Resultado del partido**: el diagrama no lo tenía. Se guarda en Match
   (`homeScore`, `awayScore`, `status`).
3. **Fase final y llaves**: Match guarda `round` y `bracketPosition` para poder
   dibujar las llaves.
4. **Partido como clase asociación** de Equipo × Equipo: se implementa con dos
   FK (`homeTeamId`, `awayTeamId`) a Team.

## Herencia Fase → Grupo / Final

Nota de modelado: en el diagrama Grupo y Final heredan de Fase. En la historia
GC-04, una fase de grupos *contiene* varios grupos. Se implementa así:

- `phases` es la tabla principal con columna `type` (herencia en tabla única).
- Una fase `GROUP_STAGE` tiene N registros en `competition_groups` (FK phase_id).
- Una fase `KNOCKOUT` no tiene grupos; sus partidos usan `round` y `bracketPosition`.

[PENDIENTE] Confirmar con el grupo que esta interpretación coincide con lo que
espera el docente del diagrama.

## Reglas generales

- MySQL con TypeORM. IDs enteros autoincrementales (igual que ms_security).
- Las entidades de ms_sports no tienen FK hacia tablas de ms_security (son bases
  de datos distintas). Si se necesita el usuario, se guarda su id como dato simple.
- Toda FK con su índice.
- Borrados en cascada **prohibidos** en relaciones hacia entidades principales
  (Sport, Team, Player, Skill, Tournament). La validación de dependencias
  se hace en el service (ver `reglas-dominio`) y la FK debe ser `RESTRICT`.
- Cascada permitida solo de un agregado hacia sus partes internas cuando la
  regla lo permita (ej. eliminar un grupo elimina sus filas en GroupTeam, no los equipos).
- Los cambios de esquema se hacen con migraciones, nunca con sincronización automática.
- Tablas en inglés, plural y snake_case; columnas en snake_case.
