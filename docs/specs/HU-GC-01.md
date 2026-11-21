# HU-GC-01 – Gestionar torneos

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar los torneos de la plataforma, para organizar las diferentes competencias que se realizan para los deportes registrados.

**Criterios de aceptación:**

- C1. Registrar un torneo con la información requerida.
- C2. Cada torneo está asociado con un deporte previamente registrado.
- C3. Los campos obligatorios se validan antes de guardar.
- C4. Consultar los torneos registrados.
- C5. Consultar la información detallada de un torneo.
- C6. Actualizar un torneo existente.
- C7. Eliminar o desactivar un torneo cuando las reglas lo permitan.
- C8. Antes de eliminar, validar si tiene fases, partidos u otra información asociada.
- C9. Los cambios quedan almacenados correctamente.

Alcance (`docs/alcance-integrante1.md`): **Interfaz Requerida (I.R)**, backend completo y frontend en React. Depende de HU-GD-01 (ya implementada). `Tournament` es entidad base compartida: avisar al grupo antes de cambiar campos o relaciones.

## Estado actual (módulo `src/tournaments`, sin refactorizar)

- Estructura vieja: `tournaments.controller.ts`, `tournaments.service.ts`, `repositories/tournaments.repository.ts` (clase concreta con SQL crudo), `dto/` en singular, `mappers/`, `entities/`.
- Endpoints actuales: `POST /tournaments`, `GET /tournaments` (sin filtros, orden `startDate ASC`), `GET /tournaments/reports/open-enrollment`, `GET /tournaments/:id`, **`PATCH /tournaments/:id`** (parcial), **`DELETE /tournaments/:id`** (200 con `{message}`, borra sin validar nada).
- Entidad: `id, name (120), startDate, enrollmentDeadline, sportId (nullable), sport (nullable)`; índice `IDX_tournaments_sport_id`, FK `FK_tournaments_sport` RESTRICT (migración `CreateSports`). **No tiene `endDate`, `status`, `active`.**
- Errores: `NotFoundException` y `BadRequestException` de Nest con mensajes en inglés (no `ApplicationException`). Los mensajes de los DTO sí están en español y el DTO valida fechas con `IsISO8601 strict` (rechaza 2026-02-30).
- El service inyecta `Repository<Tournament>` de TypeORM **y** la clase `TournamentsRepository`: sin interfaz ni token (viola D).
- `reports/open-enrollment` (torneos con inscripción abierta y no iniciados) **no está en el mapa de `api-rest`**.
- `sportId` no se acepta en ningún DTO ni se devuelve: hoy un torneo creado por API queda sin deporte.

## Endpoints objetivo (mapa de `api-rest` GC-01)

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| POST | `/tournaments` | 201 + `TournamentResponseDto` | 400 validación/fechas, 404 deporte, 409 deporte inactivo (y duplicado si P2) |
| GET | `/tournaments` | 200 + lista (filtros P5) | 400 query inválido |
| GET | `/tournaments/:id` | 200 | 400 id, 404 |
| PUT | `/tournaments/:id` | 200 (reemplazo total) | 400, 404 torneo o deporte, 409 |
| DELETE | `/tournaments/:id` | 204 sin cuerpo | 400, 404, 409 `INVALID_STATE` con desglose |
| PATCH | `/tournaments/:id/deactivate` | 200 | 400, 404 (requiere columna `active`, P1) |

Ids con `idParamPipe` (no numérico: 400 `INVALID_OPERATION`). Respuesta (propuesta): `{ id, name, sport:{id,name}, startDate, enrollmentDeadline, ... }`; el deporte va resumido, no la entidad.

## Reglas de negocio

| # | Regla | Origen | Error |
|---|---|---|---|
| R1 | `name` obligatorio, texto, máx. 120, sin solo espacios (se recorta) | C3, `reglas-dominio` | 400 (objeto `{campo: mensaje}`) |
| R2 | `sportId` obligatorio, entero positivo | C2, C3 | 400 |
| R3 | El deporte debe existir | C2, `api-rest` (referenciado en body) | 404 `NOT_FOUND` |
| R4 | El deporte debe estar activo | `reglas-dominio` GC-01 | 409 `INVALID_STATE` |
| R5 | `startDate` y `enrollmentDeadline` obligatorias, formato `AAAA-MM-DD`, fecha real | C3 | 400 |
| R6 | `enrollmentDeadline <= startDate` (la igualdad se permite, como hoy) | `reglas-dominio` (`registrationDeadline <= startDate`) | 400 `INVALID_OPERATION` con `ApplicationException` (hoy `BadRequestException` en inglés) |
| R7 | PUT reemplaza todos los campos; mismas validaciones que POST | `api-rest` | 400 |
| R8 | DELETE solo si no tiene fases, partidos ni inscripciones; el `message` dice qué y cuántos (patrón de `SportsService.remove`). La FK RESTRICT es la red de seguridad y su error se traduce a 409 en el repositorio | C7, C8, `reglas-dominio` | 409 `INVALID_STATE` |
| R9 | Desactivar siempre permitido; un torneo inactivo no admite nuevas asociaciones (inscripciones, fases) y sigue visible en consultas históricas | `reglas-dominio` (Propuesta) | - |

## Brechas

| # | Criterio / tema | Estado hoy | Cambio necesario |
|---|---|---|---|
| B1 | C1, C3 | Parcial: valida nombre y fechas; falta `sportId` | Agregar `sportId` a DTOs |
| B2 | C2 | **No cumple**: columna y FK nullable, DTO sin `sportId` | Ver B3 y B4 |
| B3 | Entidad | `sportId`/`sport` nullable | `nullable: false` en entidad y relación; el repositorio carga el deporte para la respuesta |
| B4 | Migración | No existe | Nueva migración posterior a `1795132800000-CreateSports.ts`: `ALTER ... MODIFY sport_id int NOT NULL`. Antes, detectar filas con `sport_id IS NULL`. Ver P3. `down` vuelve a NULL |
| B5 | C4 | Cumple en lo básico (lista ordenada); sin filtros ni `sport` en la respuesta | Query DTO con filtros (P5) y respuesta con deporte resumido |
| B6 | C5 | Cumple (404 en inglés) | Refactor y mensaje en español |
| B7 | C6 | Parcial: PATCH parcial, sin validar deporte | PUT total (R7); validar deporte si cambia (P4) |
| B8 | C7 | Parcial: DELETE sin reglas, sin desactivar | R8 + `PATCH /deactivate`; requiere `active` (P1) |
| B9 | C8 | **No cumple**: borra sin mirar nada. Además hoy **no hay con qué contar**: `phases` no tiene `tournament_id` (la entidad `Phase` solo tiene `id, name, order` y los `Match` cuelgan de `Phase`); no existe `Registration` | Ver "Dependencias" |
| B10 | C9 | Cumple (`save` de TypeORM). Con PUT, la respuesta se arma leyendo lo guardado | - |
| B11 | Modelo | `reglas-dominio` y `modelo-relacional` piden `endDate`, `registrationDeadline`, `status`, `active`; el código tiene `enrollmentDeadline` y no tiene los otros | Decisión del grupo (P1, P6) |
| B12 | Arquitectura | Estructura vieja, PATCH, errores Nest, sin interfaz/token | Ver "Refactor" |
| B13 | `reports/open-enrollment` | Fuera del mapa de rutas | Decisión (P7) |

## Dependencias para el borrado (B9)

- Hoy el único bloqueo posible sería la FK RESTRICT de tablas que aún no existen. No se puede implementar `countDependencies` real sin `Phase.tournamentId` (integrante 3, GC-03) ni `Registration` (GC-02).
- Propuesta: el repositorio expone `countDependencies(id): { phases, matches, registrations }`; mientras falten las tablas devuelve 0 y el mensaje y el test de 409 se activan cuando existan (los partidos se cuentan vía `matches -> phases -> tournament_id`). Cada historia posterior (GC-02, GC-03) agrega su conteo y su caso Postman. Contar fases/partidos desde este repositorio implica importar entidades del integrante 3 (patrón de `SportTypeOrmRepository`, que ya importa `Tournament`): **avisar al grupo**.
- **Implementado (decisión del integrante, permiso expreso):** se agregó `phases.tournament_id` (nullable, FK RESTRICT, índice) y `Phase.tournamentId`/`Tournament.phases`. El módulo de fases aún no asigna el torneo, así que hoy todas las fases tienen `tournament_id` NULL y el conteo da 0: **el integrante 3 debe asignarlo al crear una fase** para que el bloqueo funcione. El reporte `open-enrollment` excluye torneos inactivos (R9).
- Mientras tanto, el 409 de este módulo no puede probarse por API; solo la FK y el flujo "sin dependencias" (204).

## Refactor a capas (B12)

- Mover a `controllers/tournaments.controller.ts`, `services/tournaments.service.ts`, `dtos/` (`create-tournament.dto`, `update-tournament.dto` sin `PartialType`, `tournament-response.dto`, `list-tournaments-query.dto`), `mappers/`, `repositories/tournament.repository.ts` (interfaz + `TOURNAMENT_REPOSITORY` + errores de dominio) y `tournament.typeorm.repository.ts` (traduce `ER_DUP_ENTRY` y FK a errores de dominio). Mover `tournament-dtos.spec.ts` junto a los DTO.
- La entidad **se queda en `src/tournaments/entities/tournament.entity.ts`**: `SportTypeOrmRepository`, su spec y `Sport` la importan por esa ruta.
- `TournamentsModule` importa `SportsModule` y usa `SportsService.findOne` (ya exportado) para R3/R4; elimina `Repository<Tournament>` del service.
- Impacto en módulos ajenos (grep sobre `src`): **ningún módulo usa** `TournamentsService`, `TournamentsRepository` ni `TournamentMapper` fuera de `src/tournaments`. Solo `app.module.ts` registra `TournamentsModule` (sin cambios) y `sports/*` importa la **entidad** `Tournament`. Los exports `TournamentsService`/`TournamentMapper` pueden cambiar sin romper a nadie. `phases/`, `matches/`, `notifications/`, `scoring-events/` no referencian torneos.

## Impacto en datos y Postman

- Seed `scripts/seed-data.mjs`: inserta 8 torneos con `sport_id` (Fútbol, Baloncesto, Atletismo). Sigue válido si no se agregan columnas obligatorias; si P1/P6 agregan `status`/`active`/`end_date` con DEFAULT, no hay que tocarlo. Bases de otros integrantes pueden tener torneos con `sport_id NULL` (creados por la API vieja): la migración debe manejarlos (P3).
- `MsSports.postman_collection.json`: no tiene casos de torneos. Los casos GD-01 E-11 ("3 torneos", Atletismo) y E-12 ("2 subdeportes, 1 equipo, 3 torneos", Baloncesto) dependen de los torneos del seed: **los casos nuevos no deben crear ni borrar torneos en Fútbol, Baloncesto ni Atletismo**; usar deportes `QA-...`. `postman/fixtures/teardown.mjs` ya borra `tournaments` por nombre `QA` o por `sport_id` de deportes QA.
- `GestionDeportiva.postman_collection.json` (compañeras): folders GD-04..08 y GC-07; no llama a `/tournaments` (0 coincidencias). Sin impacto.
- Cambios de contrato visibles para el frontend (aún sin consumidor verificado en este repo): PATCH pasa a PUT, DELETE 200 -> 204 sin cuerpo, `sportId` obligatorio, la respuesta incluye `sport`, errores con formato `{errorCase, message}`. Avisar al grupo.

## Casos límite

- POST sin `sportId`, con `sportId: 0`, negativo, `"1"` o `1.5`: 400 (no 404).
- `sportId` inexistente: 404; deporte inactivo ("Squash" del seed): 409; subdeporte activo (Fútbol 11): ver P8.
- `enrollmentDeadline == startDate`: 201. `enrollmentDeadline > startDate`: 400. Fecha `2026-02-30` o `01/03/2026`: 400.
- Nombre `"   "` o de 121 caracteres: 400. Nombre con espacios alrededor: se recorta.
- PUT con campo faltante: 400 (no es parcial). PUT con body vacío: 400 con todos los campos.
- PUT a un torneo con deporte hoy inactivo sin cambiar `sportId`: ver P4.
- Deporte borrado o desactivado entre la validación y el INSERT: FK -> 404/409, no 500.
- DELETE dos veces: 204 y luego 404. DELETE de torneo sin dependencias: 204. Deporte con torneos sigue bloqueado por GD-01 (ya implementado).
- Migración sobre BD con torneos sin deporte: no debe dejar la BD a medias (usar comprobación previa, no `ALTER` que falle).

## Trazabilidad

| Criterio | Cómo se cubre |
|---|---|
| C1 | POST, R1, R2, R5 |
| C2 | R2, R3, R4, B3, B4 |
| C3 | R1, R2, R5, R6 |
| C4 | `GET /tournaments` (P5) |
| C5 | `GET /tournaments/:id` |
| C6 | `PUT` (R7, P4) |
| C7 | `DELETE` (R8) y `PATCH /deactivate` (R9) |
| C8 | R8, sección Dependencias (parcial hasta GC-02/GC-03) |
| C9 | Respuesta leída de la BD; casos Postman GET tras POST/PUT |

C8 solo es trazable por completo cuando existan `Phase.tournamentId` y `Registration`.

## Preguntas abiertas

| # | Pregunta | Recomendación (propuesta) |
|---|---|---|
| P1 | ¿Se agregan `active` y `status` (`SCHEDULED/IN_PROGRESS/FINISHED/CANCELLED`) a `Tournament`? La historia dice "eliminar o desactivar"; `api-rest` ya define `/deactivate`; el código no tiene ninguna | Agregar solo `active` (default 1) en esta historia. `status` y su máquina de estados dependen de GC-02/GC-06 (qué es "iniciado"): se difiere, no se inventa |
| P2 | ¿Nombre de torneo único? `reglas-dominio` no lo exige; el seed usa el año en el nombre | Único por (deporte, nombre) sin distinguir mayúsculas ni espacios, 409 `ALREADY_EXISTS`, con `UQ_tournaments_sport_name`. Verificar duplicados existentes antes de la migración. Alternativa: sin unicidad |
| P3 | Filas con `sport_id NULL` al volver la columna NOT NULL: ¿abortar, borrar o asignar un deporte por defecto? | Abortar con mensaje claro (cuántas filas y cómo corregirlas); nunca inventar deporte ni borrar datos de otros. Sin filas NULL la migración aplica normal. El grupo corrige por SQL o corre el seed |
| P4 | En PUT, ¿se exige deporte activo aunque no cambie `sportId`? | Solo si `sportId` cambia; así se puede corregir un torneo cuyo deporte se desactivó después. Cambiar de deporte con inscripciones (GC-02) se bloquea cuando exista esa historia |
| P5 | Listado: `reglas-dominio` pide solo activos por defecto; GD-02 decidió devolver todo con `?active=`. Filtros extra | Igual que GD-02: todo, con `active` visible y `?active=true|false`; más `?sportId=` y `?name=` (contiene, sin acentos). Orden `startDate ASC, id` (como hoy). Sin paginación (no está en la skill) |
| P6 | Nombre del campo: `enrollmentDeadline` (código) vs `registrationDeadline` (skills); falta `endDate` | Mantener `enrollmentDeadline` (cambiarlo rompe seed, DTO y reporte) y actualizar `modelo-relacional`/`reglas-dominio`. `endDate`: no agregarla en esta historia; no hay criterio que la use. Decide el grupo; esta spec no resuelve el choque |
| P7 | ¿Qué pasa con `GET /tournaments/reports/open-enrollment` (no está en el mapa)? | Conservarlo refactorizado (en el repositorio por interfaz) hasta confirmar si el frontend lo usa; si no, sustituir por `?openEnrollment=true` en el listado. Proponerlo al grupo antes de borrar |
| P8 | ¿El deporte del torneo puede ser un subdeporte? Nada lo prohíbe | Sí, cualquier deporte activo (padre o subdeporte). La asociación equipo-deporte es directa (GD-03 P2), así que GC-02 validará contra ese mismo deporte sin expandir jerarquías |
| P9 | ¿Se permiten fechas pasadas al crear? No hay regla | Sí; no inventar. Solo se valida R6 |
| P10 | Hasta GC-02/GC-03, ¿se acepta que el 409 de borrado no pueda probarse por API? | Sí; quedan el flujo 204, la FK y pruebas unitarias del service con repositorio simulado. Coordinar con el integrante 3 para que `Phase` reciba `tournamentId` |

## Frontend (I.R)

Listado con filtros por deporte y estado, formulario (selector de deportes activos, fechas) y detalle. Debe usar `PUT` con todos los campos, tratar 204 sin cuerpo, mostrar los 409 con `message` y marcar campos con el objeto de errores 400.

Contradicciones skill/código: `modelo-relacional` y `reglas-dominio` (campos `endDate`, `registrationDeadline`, `status`, `active`) frente a la entidad real; ver P1 y P6.
