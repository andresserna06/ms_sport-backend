# Guía práctica: cómo se ven las relaciones del proyecto (código y base de datos)

Referencia rápida de cómo se implementan en TypeORM las relaciones que usa el
proyecto. Sigue el estilo de la guía del profesor (`User`–`Session`,
`User`–`Role`), pero con las entidades reales. Los nombres oficiales están en la
skill `modelo-relacional`.

Reglas que valen para todas:

- La llave foránea (FK) vive en el lado **"muchos"** y es el **dueño** de la
  relación (`@ManyToOne` + `@JoinColumn`).
- El lado **"uno"** solo la refleja (`@OneToMany`) y no crea columnas.
- Un N:N se implementa con una **entidad intermedia explícita** (dos 1:N).
- Los borrados hacia entidades principales son `RESTRICT`; la excepción es
  `teams.group_id`, que usa `SET NULL`.

---

## 1) Group 1:N Team

```text
Group 1 ───────── 0..N Team
```

Un grupo tiene varios equipos; un equipo tiene, como máximo, un grupo a la vez.
Es el mismo patrón de `User` 1:N `Session`.

**Base de datos**

```text
phases (tipo GROUP)            teams
────────────────────           ────────────────
id                             id
name                           name
phase_type = 'GROUP'           city
...                            group_id  ← FK (nullable, NO única)
```

| teams.id | teams.group_id |
|---|---|
| 1 | 5 |
| 2 | 5 |
| 3 | 6 |

Los equipos 1 y 2 están en el grupo 5; el equipo 3 en el grupo 6.

**Código**

```typescript
// teams/entities/team.entity.ts  (dueño: tiene la FK)
@ManyToOne(() => Group, (group) => group.teams, {
  nullable: true,
  onDelete: 'SET NULL',
})
@JoinColumn({ name: 'group_id' })
group!: Group | null;

// phases/group/entities/group.entity.ts  (lado inverso)
@ChildEntity('GROUP')
export class Group extends Phase {
  @OneToMany(() => Team, (team) => team.group)
  teams!: Team[];
}
```

**Consultas**

```typescript
// Equipos de un grupo
this.groupsRepository.findOne({ where: { id }, relations: { teams: true } });

// Grupo de un equipo
this.teamsRepository.findOne({ where: { id }, relations: { group: true } });
```

**Reglas:** un solo grupo por equipo, así que "no duplicado en el mismo grupo"
se cumple por estructura. Eliminar un grupo deja a sus equipos con
`group_id = NULL`. Solo `GroupService` toca esta relación.

---

## 2) Tournament N:N Team mediante Registration

```text
Tournament 1 ───── N Registration N ───── 1 Team
```

Un torneo tiene varios equipos inscritos y un equipo puede inscribirse en varios
torneos. La inscripción es una entidad con su propio `id`.

**Base de datos**

```text
tournaments          registrations                teams
───────────          ───────────────────          ───────────
id ◄───────────────  tournament_id  FK            id
name                 team_id        FK ─────────► name
                     registered_at
                     UNIQUE (tournament_id, team_id)
```

| registrations.id | tournament_id | team_id |
|---|---|---|
| 1 | 10 | 1 |
| 2 | 10 | 2 |
| 3 | 11 | 1 |

El equipo 1 está en dos torneos; el torneo 10 tiene dos equipos.

**Código**

```typescript
@Entity('registrations')
@Unique(['tournament', 'team'])
export class Registration {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (t) => t.registrations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tournament_id' })
  tournament!: Tournament;

  @ManyToOne(() => Team, (t) => t.registrations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;
}

// En Tournament y en Team (lado inverso)
@OneToMany(() => Registration, (r) => r.tournament)
registrations!: Registration[];
```

**Consultas**

```typescript
// Equipos inscritos en un torneo
this.registrationsRepository.find({ where: { tournament: { id } }, relations: { team: true } });

// Torneos de un equipo
this.registrationsRepository.find({ where: { team: { id } }, relations: { tournament: true } });
```

**Reglas:** el `UNIQUE` evita inscribir dos veces al mismo equipo en el mismo
torneo. Retirar una inscripción borra solo esa fila, nunca el equipo ni el torneo.

---

## 3) Tournament 1:N Phase

```text
Tournament 1 ───────── N Phase
```

**Base de datos**

```text
tournaments            phases
───────────            ──────────────────────
id                     id
name                   tournament_id  ← FK
                       name
                       sequence
                       phase_type
```

**Código**

```typescript
// Phase (dueño)
@ManyToOne(() => Tournament, (t) => t.phases, { onDelete: 'RESTRICT' })
@JoinColumn({ name: 'tournament_id' })
tournament!: Tournament;

// Tournament (inverso)
@OneToMany(() => Phase, (p) => p.tournament)
phases!: Phase[];
```

**Reglas:** modificar o eliminar una fase no elimina el torneo.

---

## 4) Herencia: Phase → Group / Final

```text
        Phase (abstracta)
        ├── Group   (phase_type = 'GROUP')
        └── Final   (phase_type = 'FINAL')
```

Una sola tabla `phases`. La columna `phase_type` dice de qué tipo es cada fila.

| id | tournament_id | name | sequence | phase_type |
|---|---|---|---|---|
| 1 | 10 | Group A | 1 | GROUP |
| 2 | 10 | Group B | 1 | GROUP |
| 3 | 10 | Quarterfinals | 2 | FINAL |

**Código**

```typescript
@Entity('phases')
@TableInheritance({ column: { type: 'varchar', name: 'phase_type', length: 10 } })
export abstract class Phase { /* id, tournament, name, sequence */ }

@ChildEntity('GROUP') export class Group extends Phase {}
@ChildEntity('FINAL') export class Final extends Phase {}
```

Consultar con el repositorio de `Group` solo trae filas `GROUP`; con el de `Phase`
trae todas.

---

## 5) Phase 1:N Match, y Match con dos equipos

```text
Phase 1 ───── N Match
Team  1 ───── N Match   (como local)
Team  1 ───── N Match   (como visitante)
```

**Base de datos**

```text
matches
────────────────────
id
phase_id         ← FK (un Group o un Final)
home_team_id     ← FK a teams
away_team_id     ← FK a teams
scheduled_at
status
home_score
away_score
round, bracket_position  (solo fase final)
CHECK (home_team_id <> away_team_id)
```

**Código**

```typescript
@Entity('matches')
@Check('home_team_id <> away_team_id')
export class Match {
  @ManyToOne(() => Phase, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'phase_id' })
  phase!: Phase;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'home_team_id' })
  homeTeam!: Team;

  @ManyToOne(() => Team, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'away_team_id' })
  awayTeam!: Team;
}
```

Aquí no hace falta el lado inverso: nadie consulta "los partidos de un equipo"
desde `Team`; se hace desde `MatchRepository`.

---

## 6) Team N:N Sport mediante TeamSport

Mismo patrón que la sección 2, con una restricción `UNIQUE (team_id, sport_id)`.

```text
Team 1 ───── N TeamSport N ───── 1 Sport
```

---

## 7) Player N:N Team mediante PlayerContract (con atributos)

```text
Player 1 ───── N PlayerContract N ───── 1 Team
```

Es una intermedia con datos propios: `startDate` y `endDate` (nullable). Un
jugador puede pasar por varios equipos y volver a uno anterior, por eso **no**
lleva `UNIQUE (player_id, team_id)`; las reglas de solape de fechas van en el
service. Esto conserva el historial de traspasos.

---

## Resumen

| Relación | Cardinalidad | Dónde está la FK |
|---|---|---|
| Group – Team | 1:N | `teams.group_id` |
| Tournament – Team | N:N | `registrations` (`tournament_id`, `team_id`) |
| Tournament – Phase | 1:N | `phases.tournament_id` |
| Phase – Match | 1:N | `matches.phase_id` |
| Team – Match | 1:N (dos veces) | `matches.home_team_id`, `matches.away_team_id` |
| Team – Sport | N:N | `team_sports` |
| Player – Team | N:N con atributos | `player_contracts` |