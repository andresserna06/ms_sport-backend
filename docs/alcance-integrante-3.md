# Alcance de Desarrollo - Integrante 3 (Jazmin)

## Reglas de alcance y restricciones
- **Repositorio actual (`ms_sport_backend`):** NestJS con TypeORM y MySQL. Implementar únicamente la capa de backend (entidades, DTOs, mappers, servicios, controladores, repositorios y pruebas).
- **Nombres de tablas y columnas:** en inglés (`phases`, `matches`, `phase_order`, `scheduled_at`...).
- **Estructura por dominio**, como en la guía del primer CRUD: `controller`, `service`, `dto`, `mapper`, `entity` y `repository`. Flujo: Request → Controller → DTOs → Service → (Mapper, Repository) → Entity → MySQL.
- **Regla de interfaz (para referencia de alcance y documentación):**
  - `HU-GC-03` (`Fase`) y `HU-GC-04` (`Grupo`): **Sin Interfaz (S.I)** — Solo backend. No planificar ni generar componentes visuales para estas entidades.
  - `HU-GC-02`, `HU-GC-05` y `HU-GC-06`: **Interfaz Requerida (I.R)** — Requieren backend completo preparado para ser consumido desde el frontend.
- **Modelado de herencia:**
  - `Fase` es abstracta en el diagrama, con `Grupo` y `Final` como hijas.
  - Se implementa con **herencia de tabla única** (`@TableInheritance` + `@ChildEntity`): una sola tabla `phases` y la columna `phase_type` (`GROUP` o `FINAL`).
  - En el código, `Group` y `Final` extienden `Phase`.
  - Nunca se crea una fase "a secas": solo desde `/groups` y `/finals`, y cada una exige un `tournamentId` existente.
- **Modelado de relaciones:**
  - `Inscripción` debe modelarse como **entidad intermedia explícita** (`Enrollment`, con sus propios atributos), no como una relación `@ManyToMany` simple.
  - `Partido` pertenece a una `Fase` (N:1). El dueño de la relación es `Match`, con la llave foránea `phase_id` y `onDelete: 'RESTRICT'`: no se borra una fase que tenga partidos.
- **Resultado del partido:** va como atributos de `Partido` (marcador local y visitante), por acuerdo del grupo.
- **Dependencias de otros integrantes:** `Torneo`, `Deporte` y `Equipo` son del Integrante 1. Mientras las entrega, se trabaja con una versión mínima de `Tournament` y `Team`, que él extiende después.
- **Reglas de trabajo con el código:** cada entidad se implementa primero como CRUD mínimo funcional, sin relaciones, y después se conecta con las demás.

## Historias asignadas y orden de ejecución
1. **HU-GC-03** – Gestionar fases del torneo *(Depende de `Torneo`, versión mínima del Integrante 1)*
2. **HU-GC-04** – Gestionar grupos de competencia *(Depende de HU-GC-03 y de la entidad `Equipo`)*
3. **HU-GC-05** – Gestionar fases finales *(Depende de HU-GC-03)*
4. **HU-GC-02** – Gestionar inscripciones de equipos en torneos *(Depende de `Torneo` y `Equipo`; aparece como HU-GC-08 en el anexo)*
5. **HU-GC-06** – Gestionar partidos *(Depende de HU-GC-03 y de `Equipo`; el escenario es opcional; el correo al crear un partido se deja para el final y depende de `Aficionado`, `Boleto` y `Apuesta` y del servicio de notificaciones existente)*

## Entidades del alcance

| Entidad | Tabla | Notas |
|---|---|---|
| `Phase` | `phases` | `id`, `name`, `order` (`phase_order`), `phaseType` (`GROUP` o `FINAL`), `tournament_id` (FK obligatoria en la API). |
| `Group` | `phases` (fila tipo `GROUP`) | Extiende `Phase`; se relaciona 1:N con `Team` vía `teams.group_id`. |
| `Final` | `phases` (fila tipo `FINAL`) | Extiende `Phase`. Cada ronda eliminatoria es una fila. |
| `Enrollment` | por definir | Entidad intermedia entre `Team` y `Tournament`. Atributos propuestos: fecha de inscripción, estado (activa o retirada) y fecha de retiro. |
| `Match` | `matches` | `scheduledAt`, `status` (`SCHEDULED`, `FINISHED`, `CANCELLED`), `homeScore`, `awayScore`. Relaciones: `phase_id` (obligatoria), equipo local, equipo visitante y escenario (opcional). |

**Versiones mínimas de otros integrantes (solo para poder trabajar):**

- `Tournament`: `id`, `name`, `startDate`, `enrollmentDeadline`.
- `Team`: `id`, `name`.

## Reglas de negocio del alcance (resumen de las historias)
- **Fases (GC-03):** cada fase pertenece a un único torneo, tiene orden y tipo, y solo se elimina si no tiene información asociada.
- **Grupos (GC-04):** un grupo contiene varios equipos; no se repite un equipo en el mismo grupo; un equipo no está en dos grupos del mismo torneo.
- **Fases finales (GC-05):** solo se elimina una fase final si no tiene partidos; sus partidos deben poder identificarse como de la fase final.
- **Inscripciones (GC-02):** el equipo debe tener el mismo deporte que el torneo; no se repite el mismo equipo en el mismo torneo; retirar una inscripción no borra el equipo ni el torneo; si el torneo ya inició o las inscripciones están cerradas, se bloquean inscripciones y retiros.
- **Partidos (GC-06):** cada partido tiene una fase; un equipo no juega contra sí mismo; los equipos deben estar habilitados (inscripción activa en el torneo); solo se actualiza según el estado del partido; el escenario solo cuando corresponda.

## Decisiones tomadas
- Herencia de `Phase` como tabla única (`phases` + `phase_type`), con `Group` y `Final` extendiendo `Phase` (ver `7_PhaseInheritance1to1.md` y `guia-relaciones.md`).
- **Grupo ↔ Equipo = 1:N** como en el diagrama: FK `teams.group_id` (nullable, `ON DELETE SET NULL`). Un equipo pertenece como máximo a un grupo; al eliminar el grupo sus equipos quedan sin grupo.
- La validación de inscripción del equipo en el torneo al asignarlo a un grupo se difiere a HU-GC-02 (cuando exista `Registration`).
- Estado y marcador de `Match` con reglas en el servicio: solo se actualiza un partido programado; un partido terminado necesita los dos marcadores.
- La tabla de posiciones y las llaves se calculan a partir de los resultados, no se guardan a mano.

## Pendientes por definir
- **Enum para las rondas finales:** agregar una columna `round` a las filas de `phases` con `phase_type = 'FINAL'`, con valores fijos. Los nombres de los grupos quedarían como texto con formato fijo.
- **Manejo de excepciones:** adoptar `ErrorCase`, `ApplicationException` y un filtro global (ver `5_ExceptionHandling.md`); decisión de todo el equipo.
- **Gateway:** no se implementa por ahora; las direcciones de otros servicios van en variables de entorno.
- **Marcador por sets** (voleibol, tenis): decidir con el grupo si entra en el alcance.
- **Qué significa "equipo habilitado"** en un partido: se propuso inscripción activa en el torneo.
- **Correo de GC-06:** se deja para el final, cuando existan `Aficionado` y el servicio de notificaciones esté disponible para este backend.

## Ramas de trabajo
- `feature/phases`: fases, grupos y fases finales.
- `feature/matches`: partidos y su relación con fase.
- `feature/enrollments`: inscripciones.

