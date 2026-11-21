# HU-GD-01 – Gestionar deportes (con subdeportes)

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar la información de los deportes registrados en la plataforma, para mantener actualizadas las disciplinas disponibles para la organización de equipos y competencias. Es de tener presente que un deporte puede tener a su vez varios subdeportes, por ejemplo existe futbol, futbol callejero, futbol de salón, etc

**Criterios de aceptación:**

- El sistema debe permitir registrar un nuevo deporte con su información requerida.
- El sistema debe validar los campos obligatorios antes de realizar el registro.
- No se deben permitir deportes duplicados.
- El sistema debe permitir consultar el listado de deportes registrados.
- Se debe poder consultar el detalle de un deporte.
- Se debe permitir actualizar la información de un deporte existente.
- Se debe permitir eliminar o desactivar un deporte.
- Si el deporte tiene información asociada que impida su eliminación, el sistema debe informar al usuario.
- Los cambios realizados deben quedar almacenados correctamente.

Alcance (`docs/alcance-integrante1.md`): HU-GD-01 es **Sin Interfaz (S.I)**, solo backend. Autorrelación 1:N (deporte padre → subdeportes), sin ciclos ni auto-padre. Sin dependencias de otras historias.

## Dependencias

- Historias o módulos que deben existir antes: ninguno. Es la base de HU-GD-03 (TeamSport) y HU-GC-01 (Tournament), que dependen de `Sport`.
- Estado del código existente (revisado en `src/`):
  - No existe el módulo `sports`.
  - `src/tournaments/entities/tournament.entity.ts` existe pero **no tiene `sportId` ni relación con Sport** (solo `id`, `name`, `startDate`, `enrollmentDeadline`). Además no tiene `status`, `endDate`, `active` ni `registrationDeadline` (usa `enrollmentDeadline`).
  - `src/teams/entities/team.entity.ts` existe (`id`, `name`, `city`, `contactEmail`, `foundedYear`, `active`). No tiene relación con Sport. No existe `TeamSport`.
  - No existe `Skill` ni ninguna otra entidad que referencie `sportId`.
  - Plantilla de patrón a seguir: `src/teams/` (controller, service, repository personalizado, mapper, DTOs `create/update/response`).
- Archivos compartidos que se tocarán (avisar al grupo antes):
  - `src/app.module.ts`: registrar `SportsModule`.
  - `src/exception/error-case.enum.ts` y `src/exception/global-exception.filter.ts`: agregar `INVALID_STATE` → 409 (hoy no existe; `api-rest` lo exige).
  - `src/main.ts`: CORS permite `GET, POST, PATCH, DELETE, OPTIONS` pero **no `PUT`**; `api-rest` define `PUT /sports/:id`.
  - `src/migrations/` (no existe): hoy `app.module.ts` usa `synchronize: true`; AGENTS.md exige `synchronize: false` y migraciones.
  - Entidades de otros módulos (`Tournament`, futura `TeamSport`) solo para la FK hacia `sports`; se coordina con quien las implemente (HU-GC-01 y HU-GD-03).

## Entidades a crear/modificar

Resumen para comparar con el diagrama:

| Entidad | Tabla | Estado en el código | Acción en HU-GD-01 |
|---|---|---|---|
| `Sport` | `sports` | **No existe** | Crear (entidad principal de la historia) |
| `Tournament` | `tournaments` | Existe, incompleta, sin `sport_id` | Se modifica en HU-GC-01 (aquí solo se define la FK que apuntará a `sports`) |
| `TeamSport` | `team_sports` | **No existe** | Se crea en HU-GD-03 (aquí solo se define la FK que apuntará a `sports`) |
| `Team` | `teams` | Existe | Sin cambios |
| `Skill` | `skills` | No existe | No referencia Sport según `modelo-relacional`. Sin cambios |

### 1. `Sport` – tabla `sports` (CREAR)

| Columna (BD) | Propiedad | Tipo | Nulo | Notas |
|---|---|---|---|---|
| `id` | `id` | INT, autoincremental, PK | NO | `@PrimaryGeneratedColumn()` |
| `name` | `name` | VARCHAR(120) | NO | Se guarda ya recortado (trim). Único (ver restricciones) |
| `description` | `description` | VARCHAR(500) | SÍ | Longitud propuesta. La skill lista el campo pero no indica obligatoriedad (pregunta abierta P2) |
| `active` | `active` | BOOLEAN (TINYINT(1)), DEFAULT true | NO | Desactivación lógica |
| `parent_sport_id` | `parentSportId` / `parentSport` | INT | SÍ | FK autorreferencia a `sports.id`. NULL = deporte raíz |

Restricciones e índices:

| Nombre propuesto | Tipo | Columnas | Detalle |
|---|---|---|---|
| `PK_sports` | PK | `id` | |
| `UQ_sports_name` | UNIQUE | `name` | Comparación sin distinguir mayúsculas: se apoya en la collation `_ci` de MySQL (`utf8mb4_0900_ai_ci` o `utf8mb4_general_ci`) **y** se valida en el service (trim + comparación case-insensitive) para dar 409 legible. Ver P3 (alcance global vs por padre) y P4 (acentos) |
| `FK_sports_parent_sport` | FK | `parent_sport_id` → `sports.id` | `ON DELETE RESTRICT`, `ON UPDATE RESTRICT`. Nunca CASCADE |
| `IDX_sports_parent_sport_id` | INDEX | `parent_sport_id` | "Toda FK con su índice" (MySQL lo crea con la FK, se declara explícito en la migración) |
| `CHK_sports_not_self_parent` | CHECK (opcional) | `parent_sport_id <> id` | Defensa en BD contra auto-padre; MySQL 8.0.16+ lo aplica. La regla real vive en el service |

Relaciones:

- `Sport` 1 — N `Sport` (autorrelación): `parentSport` (`@ManyToOne`, nullable, `onDelete: 'RESTRICT'`, `@JoinColumn({ name: 'parent_sport_id' })`) y `subSports` (`@OneToMany`, `cascade: false`).
- `Sport` 1 — N `Tournament`: inversa de `Tournament.sport` (declarada en HU-GC-01). Sin cascada.
- `Sport` 1 — N `TeamSport`: inversa de `TeamSport.sport` (declarada en HU-GD-03). Sin cascada.
- Las inversas `OneToMany` hacia Tournament y TeamSport son opcionales en `Sport`; el conteo de dependencias puede hacerse por consulta (ver Reglas, R9). Decisión en P8.

### 2. `Tournament` – tabla `tournaments` (EXISTE; se modifica en HU-GC-01, no en esta historia)

Lo que HU-GD-01 necesita de ella:

| Columna (BD) | Tipo | Nulo | Estado | Detalle |
|---|---|---|---|---|
| `sport_id` | INT | NO | **FALTA** | FK a `sports.id`, `ON DELETE RESTRICT`, índice `IDX_tournaments_sport_id`. Relación `@ManyToOne(() => Sport)` |

Diferencias detectadas entre el código actual y `modelo-relacional` (se reportan, no se corrigen aquí): faltan `sport_id`, `end_date`, `status`, `active`; `enrollment_deadline` debería llamarse `registration_deadline`; `name` no es único (la skill no lo exige); los `date` están tipados como `string`.

### 3. `TeamSport` – tabla `team_sports` (NO EXISTE; se crea en HU-GD-03)

| Columna (BD) | Tipo | Nulo | Detalle |
|---|---|---|---|
| `team_id` | INT | NO | FK a `teams.id`, RESTRICT |
| `sport_id` | INT | NO | FK a `sports.id`, RESTRICT, índice propio |

Restricción: `UNIQUE (team_id, sport_id)` (o PK compuesta). Entidad intermedia explícita, no `@ManyToMany` (alcance del integrante 1).

### 4. Entidades que NO referencian Sport

`Team`, `Player`, `Skill`, `PlayerSkill`, `Phase`, `Group`, `Match` no tienen `sportId` en `modelo-relacional`. `Phase`/`Group`/`Match` llegan a Sport solo a través de `Tournament`. Si el diagrama del grupo muestra otra relación hacia Deporte (por ejemplo Habilidad con Deporte), es una discrepancia que debe resolverse antes de implementar (P9).

### 5. Migración

Hay que crear `src/migrations/` con la migración de `sports` (tabla, UNIQUE, índice, FK autorreferencial RESTRICT, CHECK opcional) y cambiar `synchronize` a `false` (P10). Las FK desde `tournaments` y `team_sports` hacia `sports` van en las migraciones de sus historias.

## Endpoints

Rutas del mapa de `api-rest` (GD-01). Las marcadas con (*) no están en el mapa y se proponen.

| Método | Ruta | Body / Query | Éxito | Errores |
|---|---|---|---|---|
| POST | `/sports` | `{ name, description?, parentSportId? }` | 201 + `SportResponseDto` | 400 validación (objeto plano `{campo: mensaje}`), 400 `INVALID_OPERATION` (padre inválido), 404 `NOT_FOUND` (padre no existe), 409 `ALREADY_EXISTS` (nombre duplicado), 409 `INVALID_STATE` (padre inactivo, ver P6) |
| GET | `/sports` | Query: `active` (por defecto solo activos), `all=true`, `name` (filtro parcial), `parentSportId` (*) | 200 + lista | 400 query inválida |
| GET | `/sports/:id` | - | 200 + `SportResponseDto` (con `parentSport` resumido `{id,name}` y `subSportsCount`) | 400 id no numérico, 404 |
| GET | `/sports/:id/subsports` | Query: `active`, `all` | 200 + lista de subdeportes directos | 400, 404 (deporte padre no existe) |
| PUT | `/sports/:id` | `{ name, description?, parentSportId? }` | 200 + `SportResponseDto` | 400 validación, 400 `INVALID_OPERATION` (auto-padre o ciclo), 404 (deporte o padre), 409 `ALREADY_EXISTS`, 409 `INVALID_STATE` (padre inactivo) |
| PATCH | `/sports/:id/deactivate` | - | 200 + `SportResponseDto` con `active=false` | 400, 404 |
| PATCH | `/sports/:id/activate` (*) | - | 200 + `SportResponseDto` con `active=true` | 400, 404, 409 `INVALID_STATE` si el padre está inactivo (P6) |
| DELETE | `/sports/:id` | - | 204 sin cuerpo | 400, 404, 409 `INVALID_STATE` (tiene subdeportes, equipos asociados o torneos; el `message` dice cuáles y cuántos) |

Notas:
- `PUT` requiere agregar `PUT` al CORS de `main.ts`. El `TeamsController` existente usa `PATCH :id` para actualizar, lo que **contradice `api-rest`** (PUT). Se sigue `api-rest` y se reporta la diferencia (P11).
- Los DTOs de respuesta no exponen la entidad ORM. Propuesta de campos: `id, name, description, active, parentSport {id, name} | null`, y `subSportsCount` solo en el detalle.
- `main.ts` configura `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`, así que enviar campos desconocidos da 400. Ojo: los errores de validación de Nest hoy salen como `{ errorCase: "VALIDATION_ERROR", message: [...] }` (ver `global-exception.filter.ts`), no como el objeto plano `{campo: mensaje}` que exige `api-rest`; se reporta como diferencia (P11).
- `/sports/:id/teams` (GD-03) y filtros por torneos no pertenecen a esta historia.

## Reglas de negocio

| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|
| R1 | `name` obligatorio, string, máx. 120, no vacío ni solo espacios; se recorta (trim) antes de validar y guardar | "validar los campos obligatorios"; `reglas-dominio` (duplicados) | 400 (objeto plano `{ name: "..." }`) |
| R2 | `description`, si se envía, es string de máx. 500 (obligatoriedad en P2) | "información requerida" | 400 |
| R3 | `name` único sin distinguir mayúsculas y tras trim. En actualización se ignora el propio id | "No se deben permitir deportes duplicados" | 409 `ALREADY_EXISTS` ("Ya existe un deporte con el nombre X") |
| R4 | `parentSportId`, si se envía, debe ser un entero y apuntar a un deporte existente | autorrelación; `reglas-dominio` (referencias) | 400 (formato), 404 `NOT_FOUND` (no existe) |
| R5 | Un deporte no puede ser su propio padre (solo en `PUT`; en `POST` el id aún no existe) | alcance + `reglas-dominio` GD-01 | 400 `INVALID_OPERATION` |
| R6 | No se permiten ciclos: el nuevo padre no puede ser el propio deporte ni uno de sus descendientes (a cualquier profundidad). Se recorre la cadena de ancestros del nuevo padre; si aparece el deporte editado, hay ciclo. Se aplica también si se mueve un deporte con subdeportes | alcance + `reglas-dominio` GD-01 | 400 `INVALID_OPERATION` |
| R7 | Listado: por defecto solo activos; `?active=false` o `?all=true` devuelve el resto. `GET /:id` devuelve el deporte aunque esté inactivo | "consultar el listado"; `reglas-dominio` (Propuesta) | - |
| R8 | `PATCH /:id/deactivate` deja `active=false`; es idempotente (desactivar uno ya inactivo devuelve 200). **DECIDIDO (P5):** se bloquea si el deporte tiene subdeportes **activos** (no se dejan huérfanos) | "eliminar o desactivar"; decisión del grupo | 404 si no existe; 409 `INVALID_STATE` si tiene subdeportes activos |
| R13 | **DECIDIDO (P1): un solo nivel.** Un subdeporte no puede tener hijos, y un deporte que ya tiene subdeportes no puede pasar a ser subdeporte. Sustituye la detección de ciclos de R6 (con un nivel el ciclo es imposible; se mantiene R5) | Historia (ejemplos de un nivel); decisión del grupo | 400 `INVALID_OPERATION` |
| R9 | `DELETE` solo si no tiene dependencias: (a) subdeportes, (b) `TeamSport` (equipos asociados), (c) `Tournament`. El service cuenta cada una y arma el mensaje. La FK `RESTRICT` es la red de seguridad | "Si el deporte tiene información asociada ... debe informar"; `reglas-dominio` GD-01 | 409 `INVALID_STATE` con `message` que diga qué lo impide (ej. "No se puede eliminar el deporte X: tiene 2 subdeportes, 1 equipo asociado y 3 torneos. Desactívelo en su lugar.") |
| R10 | Un deporte inactivo no puede usarse en nuevas asociaciones (nuevo padre, nuevo `TeamSport`, nuevo `Tournament`). En esta historia aplica a R4 | `reglas-dominio` (Propuesta) | 409 `INVALID_STATE` |
| R11 | Todo `:id` de ruta es numérico (`ParseIntPipe`) | `api-rest` | 400 |
| R12 | Las escrituras se persisten y se devuelven desde lo guardado (la respuesta refleja el estado en BD) | "Los cambios deben quedar almacenados" | - |

Orden de validación sugerido en `PUT`: existe el deporte (404) → validar DTO (400) → padre existe (404) → auto-padre/ciclo (400) → padre activo (409) → nombre único (409).

## Trazabilidad de criterios

| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
| El sistema debe permitir registrar un nuevo deporte con su información requerida. | `POST /sports` (R1, R2, R4); 201 con el recurso creado |
| El sistema debe validar los campos obligatorios antes de realizar el registro. | R1, R2, R4 con DTO + `ValidationPipe`; 400 con objeto plano por campo |
| No se deben permitir deportes duplicados. | R3 en `POST` y `PUT`; `UNIQUE (name)`; 409 `ALREADY_EXISTS` |
| El sistema debe permitir consultar el listado de deportes registrados. | `GET /sports` (R7), `GET /sports/:id/subsports` |
| Se debe poder consultar el detalle de un deporte. | `GET /sports/:id` (404 si no existe) |
| Se debe permitir actualizar la información de un deporte existente. | `PUT /sports/:id` (R1 a R6, R10) |
| Se debe permitir eliminar o desactivar un deporte. | `DELETE /sports/:id` (R9) y `PATCH /sports/:id/deactivate` (R8) |
| Si el deporte tiene información asociada que impida su eliminación, el sistema debe informar al usuario. | R9: 409 `INVALID_STATE` con mensaje detallado. Ver nota de P7: hasta que existan `TeamSport` y `Tournament` solo puede probarse con subdeportes |
| Los cambios realizados deben quedar almacenados correctamente. | R12 + migración; pruebas que releen con `GET` tras cada escritura. Criterio no automatizable por sí solo: se verifica con la matriz de pruebas |

Criterio con trazabilidad parcial: "información asociada" (R9). Dos de las tres dependencias (equipos y torneos) no existen aún en el código.

## Casos límite

- Nombre con espacios alrededor (`"  Fútbol  "`) se guarda recortado; `"fútbol"` y `"FÚTBOL"` cuentan como duplicado.
- Nombre solo con espacios o vacío: 400.
- Nombre de 121 caracteres: 400.
- `parentSportId: null` explícito en `PUT`: convierte el subdeporte en deporte raíz. Omitirlo en `PUT` (semántica de reemplazo) también lo deja en null (P12).
- `parentSportId` igual al propio id (`PUT`): 400 `INVALID_OPERATION`.
- Ciclo directo (A padre de B, se intenta B padre de A) y ciclo indirecto (A→B→C, se intenta C padre de A): 400.
- Padre inexistente: 404; padre inactivo: 409 (P6).
- Eliminar un deporte raíz con subdeportes: 409; eliminar un subdeporte hoja sin otras dependencias: 204; eliminar un subdeporte no afecta al padre.
- Desactivar el padre no cambia el estado de sus subdeportes (P5); se pueden seguir listando.
- Dos peticiones concurrentes con el mismo nombre: la segunda cae en el `UNIQUE` de BD; el service debe capturar el error `ER_DUP_ENTRY` y devolver 409 `ALREADY_EXISTS`, no 500.
- `id` no numérico o `id` fuera del rango INT: 400/404 sin 500.
- Body con campos extra (`active`, `id`): 400 por `forbidNonWhitelisted` (el estado solo cambia con `deactivate`/`activate`).
- Jerarquía de más de un nivel: rechazada (R13). Asignar como padre a un subdeporte, o mover bajo otro padre a un deporte que ya tiene hijos: 400 `INVALID_OPERATION`.
- Desactivar un padre con subdeportes activos: 409; con todos los hijos inactivos: permitido. Eliminar con cualquier hijo: 409.

## Frontend

- Sin interfaz (S.I). No se planifican ni generan pantallas; las pruebas son solo con Postman. El frontend lo entrega el docente.
- Consumirán los endpoints: Postman (colección del `tester`) y, indirectamente, HU-GC-01 y HU-GD-03 para validar la existencia y el estado de `Sport`.

## Preguntas abiertas

Cada una trae una propuesta (no decidida) para que el grupo confirme.

| # | Pregunta | Propuesta (no es decisión) |
|---|---|---|
| P1 | ¿Cuántos niveles de subdeportes se permiten (solo 2: deporte y subdeporte, o jerarquía ilimitada)? El ejemplo de la historia muestra un solo nivel | Jerarquía sin límite fijo, con detección de ciclos recorriendo ancestros. Si el grupo prefiere 2 niveles, se agrega la regla "un subdeporte no puede tener hijos" (409/400) |
| P2 | ¿Cuáles son los campos obligatorios? La historia dice "información requerida" y `modelo-relacional` lista `name, description, active, parentSportId` sin indicar obligatoriedad | `name` obligatorio; `description` opcional (VARCHAR 500, NULL); `active` por defecto true; `parentSportId` opcional |
| P3 | ¿La unicidad del nombre es global o solo entre hermanos (mismo padre)? `modelo-relacional` dice "name único" (global). Pero "Fútbol de salón" bajo Fútbol y "de salón" bajo Baloncesto podrían chocar solo si se repite el mismo nombre | Global (`UNIQUE(name)`), tal como dice la skill. Es lo más simple y evita duplicados ambiguos en listados |
| P4 | ¿Se distingue por acentos? Con collation `_ai_ci` de MySQL, `Futbol` y `Fútbol` chocarían; con `_general_ci` también. `reglas-dominio` solo habla de mayúsculas y espacios | Tratar `Futbol` y `Fútbol` como duplicados (es el comportamiento por defecto de MySQL y evita falsos distintos) y documentarlo en la prueba |
| P5 | Al desactivar el padre, ¿qué pasa con sus subdeportes? | No hay efecto en cascada: los subdeportes conservan su estado (`reglas-dominio` dice que desactivar "siempre está permitido" y la cascada de estado no está definida). Se muestra al consultar el detalle |
| P6 | ¿Se puede asignar como padre a un deporte inactivo? ¿Y reactivar un subdeporte cuyo padre está inactivo? (`reglas-dominio`: una entidad inactiva no se usa en nuevas asociaciones) | No: 409 `INVALID_STATE` al crear/mover bajo un padre inactivo. La reactivación del subdeporte no valida al padre (solo advertencia en la respuesta o sin restricción). Decidir una de las dos |
| P7 | Borrado vs desactivación: la historia dice "eliminar o desactivar". `reglas-dominio` propone ofrecer ambos (DELETE condicionado + PATCH deactivate) | Ofrecer ambos, como en la skill. Hoy solo la dependencia "subdeportes" existe en el código; las de equipos y torneos se completan cuando existan `TeamSport` y `Tournament` (HU-GD-03 y HU-GC-01). Mientras tanto la FK `RESTRICT` protege |
| P8 | Cómo cuenta `SportsService` las dependencias de `TeamSport` y `Tournament` sin crear dependencias circulares entre módulos y respetando SOLID (D) | `SportsRepository` (clase personalizada, como `TeamsRepository`) cuenta con `QueryBuilder`/`EntityManager` sobre las tablas `tournaments` y `team_sports`, sin importar sus módulos. Alternativa: una interfaz `SportDependencyChecker` que cada módulo implementa. Decide el `architect`/grupo |
| P9 | ¿El diagrama del grupo muestra alguna relación más hacia Deporte (por ejemplo Habilidad ↔ Deporte, Jugador ↔ Deporte)? `modelo-relacional` solo tiene Tournament y TeamSport | Mantener lo de la skill. Si el diagrama tiene más, se actualiza la skill antes de implementar |
| P10 | `app.module.ts` usa `synchronize: true` y no hay carpeta `src/migrations`. AGENTS.md exige `synchronize: false` | Crear la primera migración de `sports` y apagar `synchronize` al implementar esta historia. Avisar a los otros integrantes porque afecta a todas las entidades existentes (`teams`, `tournaments`, `matches`, `phases`) |
| P11 | `TeamsController` usa `PATCH /teams/:id` para actualizar y `api-rest` define `PUT`; `ErrorCase` y el filtro usan `ConflictException`/`NotFoundException` de Nest en `TeamsService` en vez de `ApplicationException`; falta `INVALID_STATE` | Sports sigue `api-rest` (`PUT`, `ApplicationException` con `ErrorCase`) y se agrega `INVALID_STATE`. Los otros módulos se alinean por separado. El `message` de los errores va en español |
| P12 | Semántica de `PUT` con `parentSportId` omitido: ¿deja el padre en null (reemplazo completo) o lo conserva? | Reemplazo completo: omitido o `null` deja el deporte como raíz, coherente con `PUT`. Si se prefiere conservarlo, usar `PATCH` parcial |
| P13 | Endpoint `PATCH /sports/:id/activate` y filtro `?parentSportId=` no están en el mapa de rutas de `api-rest` | Agregarlos (`TeamsController` ya tiene `activate`). Si el grupo no los quiere, no se implementan; entonces no hay forma de reactivar un deporte salvo `PUT` con `active` |
| P14 | Autenticación: ¿estos endpoints van protegidos por JWT? Es un [PENDIENTE] del grupo en AGENTS.md (cómo valida ms_sports el JWT) | Sin guard por ahora; se agrega cuando el grupo decida |
| P15 | Ninguna skill contradice la historia en HU-GD-01. Se detecta una diferencia menor: la historia da "futbol callejero" y "futbol de salón" como ejemplos de subdeportes, lo que sugiere un solo nivel (ver P1) | Ver P1 |

## Decisiones del grupo (resueltas)

- **P1:** un solo nivel de subdeportes (R13).
- **P3:** unicidad **global** del nombre, `UNIQUE(name)`.
- **P5:** un deporte con subdeportes no se puede eliminar (cualquier hijo) ni desactivar (hijos activos).
- **P7:** se ofrecen ambos: `DELETE` condicionado y `PATCH /:id/deactivate` (cambia `active`).
- **Relaciones bidireccionales** (cada lado declarado en su entidad): `Sport.parentSport` / `Sport.subSports`; `Sport.tournaments` / `Tournament.sport`; `Sport.teamSports` / `TeamSport.sport`; `Team.teamSports` / `TeamSport.team`. Las de `Team`, `Tournament` y `TeamSport` se declaran en HU-GD-03 y HU-GC-01 (avisar al grupo).
- **P6 (resuelta):** `activate` valida al padre: no se puede reactivar un subdeporte cuyo padre está inactivo (409 `INVALID_STATE`), coherente con R10.
- **P10 (resuelta):** migraciones por historia. `synchronize: false`. `InitialSchema` (baseline con `CREATE TABLE IF NOT EXISTS` de `teams`, `tournaments`, `phases`, `matches`) corre antes de `CreateSports`, y funciona tanto en una BD limpia como en una que ya tiene esas tablas.
- **P13 (resuelta):** se implementan `PATCH /sports/:id/activate` y los filtros `?name=` (parcial) y `?parentSportId=` en `GET /sports`.
- **P11 (resuelta):** los errores de validación de DTO salen como objeto plano `{ campo: mensaje }` con mensajes en español (`ValidationException` + `exceptionFactory` en `main.ts`). Afecta a todos los módulos.
- **Respuesta:** incluye `parentSport {id, name} | null` y `subSportsCount`; siempre se arma releyendo lo guardado (R12).
- **Excepciones documentadas:** (a) `SportTypeOrmRepository` consulta las entidades `TeamSport` y `Tournament` de otros módulos para contar dependencias (P8, aceptado por las relaciones bidireccionales); (b) `UpdateSportDto` extiende `CreateSportDto` y no usa `PartialType`, porque `PUT` es reemplazo completo (P12); (c) no se crea el CHECK `parent_sport_id <> id`: MySQL no permite CHECK sobre una columna `AUTO_INCREMENT`, la regla vive en el service (R5); (d) `Tournament.sport_id` queda nullable hasta HU-GC-01.
- El repositorio traduce los errores del driver a errores de dominio (`DuplicateSportNameError`, `SportInUseError`); si una FK bloquea el borrado tras el conteo, la respuesta es 409 `INVALID_STATE`, no 500.
- **Filtros del listado:** `GET /sports` valida su query con `ListSportsQueryDto` (`active`, `all`, `name`, `parentSportId`); un valor repetido (`?name=a&name=b`), un booleano inválido o un parámetro desconocido responden 400 en español.
- **Ids de ruta:** `idParamPipe` (`src/common/pipes`) responde 400 `INVALID_OPERATION` con mensaje en español. Se usa en `sports` y `teams`.
- **Padre borrado entre la validación y el guardado:** el repositorio traduce la FK rota a `ParentSportNotFoundError` y el service responde 404. Queda una ventana de concurrencia residual aceptada en la regla de un solo nivel (R13): dos escrituras simultáneas podrían crear un segundo nivel; requeriría bloqueo de filas y no se justifica en esta entrega.
- **`SportsService` no se exporta** hasta que HU-GD-03 y HU-GC-01 lo necesiten: depende del `ValidationPipe` global para recortar los textos.
- **`CreateSports` es idempotente:** comprueba cada tabla/columna antes de crearla, así que funciona en BD que ya la tenían por el antiguo `synchronize`.
- **Nombres explícitos en entidades de otros módulos** (solo nombres, sin cambio de esquema): `Team` (`UQ_teams_name`) y `Match` (`FK_matches_phase`, `IDX_matches_phase_id`), para que coincidan con `InitialSchema`. En una BD que ya había sincronizado con los nombres automáticos, `migration:generate` puede proponer renombrarlos.
- **Mensajes en español** en los DTOs de `teams` y `tournaments` (el formato plano `{ campo: mensaje }` es común a toda la API).
- **Estructura de `teams` alineada** a `arquitectura-nest` (`controllers/`, `services/`, `dtos/`, repositorio por interfaz y token). `TeamSport` vive en su propio módulo `src/team-sports/` (HU-GD-03 agrega controller, service y DTOs). Cambios de comportamiento en `teams` (tercera revisión): `team_sports` cuenta como información asociada al borrar, y una FK que bloquee el borrado responde 409 en vez de 500; los DTOs recortan los textos antes de validar (un nombre de solo espacios ya no se guarda vacío); `contactEmail` ausente dice "obligatorio"; el año de fundación máximo se evalúa en cada petición; `?active=` se valida con `ListTeamsQueryDto` (400 en español); `TeamsModule` ya no exporta nada. `tournaments`: las fechas se validan con `IsISO8601` estricto (rechaza `2026-13-45`). Migración `CreateSports`: el índice y la FK de `tournaments.sport_id` se comprueban por separado. `teams` sigue usando `PATCH` y excepciones de Nest; alinearlo a `PUT` y `ApplicationException` cambia el contrato que consume el frontend y se decide en HU-GD-02.
- **Defectos hallados al preparar las pruebas de API (corregidos):** (a) `GET /sports/:id/subsports` ignoraba `?active` y `?all`; ahora aplica la misma regla R7 que el listado (solo activos por defecto, `?all=true` devuelve todos, `active` no booleano o parámetros desconocidos responden 400); (b) el `ValidationPipe` global convertía `:id` antes que el pipe de ids, así que `1e2` se leía como 100 y `0x10` como 16; ahora se lee el texto original con el decorador `@IdParam` y responden 400. Ids numéricos fuera de rango, `0` o negativos siguen respondiendo 404.
- **Orden de validación en `PUT`:** el `ValidationPipe` valida el cuerpo antes de que el service compruebe que el deporte existe, así que un id inexistente con cuerpo inválido responde 400 (no 404). Es el comportamiento estándar de Nest y se acepta.
- **`all` + `active` juntos:** `all=true` gana y devuelve todos los estados.
- **Alcance de las pruebas unitarias:** los specs de repositorio usan mocks. El SQL real (subconsulta de `subSportsCount`, collation `utf8mb4_unicode_ci`, códigos `ER_*`, FK `RESTRICT`) y las migraciones (`migration:run` y `migration:revert` sobre una BD limpia y sobre una con tablas previas) solo se verifican con el `tester` (Postman/Newman contra MySQL).
- **Deuda diferida a HU-GD-02 (`teams`):** `PATCH /teams/:id` con `null` en un campo obligatorio responde 500 (`PartialType` aplica `@IsOptional`, que acepta `null`); `DELETE /teams/:id` responde 200 con cuerpo (`api-rest` pide 204); los mensajes del service están en inglés y usa excepciones de Nest en vez de `ApplicationException`; `PATCH` en lugar de `PUT`.
- **Deuda diferida a HU-GC-01 (`tournaments`):** `CreateTournamentDto.name` no recorta espacios.
- Sin cambios (propuesta aceptada): P2, P4, P8, P9, P12, P14.

## Criterios de aceptación sin trazabilidad completa

- "Si el deporte tiene información asociada ... debe informar al usuario": completa solo para subdeportes hasta que existan `TeamSport` y `Tournament`.
- "Los cambios realizados deben quedar almacenados correctamente": se verifica con pruebas de lectura posterior; no hay un endpoint o regla específica.
