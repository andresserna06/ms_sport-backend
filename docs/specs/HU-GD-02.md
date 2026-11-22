# HU-GD-02 – Gestionar equipos (análisis de brechas)

## Historia

**Historia de usuario:** Como administrador deportivo, quiero gestionar los equipos de la plataforma, para mantener organizada la información de las organizaciones que pueden participar en las diferentes competencias.

**Criterios de aceptación:**

- C1. El sistema debe permitir registrar un equipo con su información básica.
- C2. Los campos obligatorios deben ser validados.
- C3. El sistema debe permitir consultar los equipos registrados.
- C4. Se debe poder consultar la información detallada de un equipo.
- C5. Se debe permitir actualizar la información del equipo.
- C6. Se debe permitir eliminar o desactivar un equipo cuando las reglas del sistema lo permitan.
- C7. Antes de eliminar un equipo, el sistema debe validar si posee información asociada.
- C8. Los cambios realizados deben quedar almacenados correctamente.

Alcance (`docs/alcance-integrante1.md`): **Interfaz Requerida (I.R)**, backend completo y frontend en React. Sin dependencias de otras historias. Esta spec es un **análisis de brechas**: el módulo `src/teams` ya existe (refactorizado en HU-GD-01). No se repite lo que ya cumple.

## Dependencias y archivos

- Módulo existente: `src/teams/` (controller, service, `TeamRepository` + token, `TeamTypeOrmRepository`, `TeamMapper`, DTOs, specs de Jest).
- Entidad `Team` (`teams`): `id`, `name` (120, `UQ_teams_name`), `city` (100), `contact_email` (150), `founded_year` (int, nullable), `active`. Coincide con `InitialSchema`. Diferencia con `modelo-relacional`: la skill dice `foundedAt`; el código usa `foundedYear` (se mantiene, P6).
- Tablas que referencian `teams` (todas con FK `RESTRICT`): `team_sports.team_id`, `player_contracts.team_id`, `matches.home_team_id`, `matches.away_team_id`, `scoring_events.team_id`. Aún no existen: inscripciones (GC-02) y `group_teams` (GC-04).
- Archivos a tocar en la implementación: solo `src/teams/**`. Posible: `src/exception/*` no requiere cambios (`ApplicationException` e `INVALID_STATE` ya existen); CORS de `main.ts` ya permite `PUT`. Sin migraciones (el esquema no cambia).

## Estado actual por criterio

| Criterio | Estado | Evidencia / brecha |
|---|---|---|
| C1 registrar | Cumple | `POST /teams`: 201 (default Nest) con `TeamResponseDto`. `active=true` por defecto, correo en minúsculas |
| C2 validar obligatorios | Cumple con un defecto | `name`, `city`, `contactEmail` obligatorios con trim y mensajes en español. **Brecha B4:** en `PATCH`, `null` pasa `@IsOptional` |
| C3 listar | Parcial | `GET /teams?active=` valida el query. Sin `active` devuelve todos. **Decidido (P2):** se mantiene así; el administrador ve todo y el frontend decide después qué mostrar. No es brecha |
| C4 detalle | Cumple con defecto de formato | `GET /teams/:id` 200; id inválido 400. **B3:** el 404 sale como `NotFoundException` de Nest con mensaje en inglés |
| C5 actualizar | No cumple el contrato | **B1:** usa `PATCH`; `api-rest` define `PUT` (reemplazo total). Nombre duplicado sí da 409 ignorando el propio id |
| C6 eliminar o desactivar | Parcial | `PATCH /:id/deactivate` y `/activate` existen; `DELETE` existe. **B2:** `DELETE` responde 200 con `{message}`, debe ser 204 |
| C7 validar asociaciones | Parcial | `countAssociations` solo cuenta `team_sports` y `player_contracts`. **B5:** faltan `matches` (local y visitante) y `scoring_events` |
| C8 persistencia | Cumple con riesgo | Respuesta armada desde lo guardado. **B7:** una carrera con el mismo nombre cae en `ER_DUP_ENTRY` y responde 500 |

## Endpoints (objetivo)

Mapa de `api-rest` GD-02. (*) = ya existe y no está en el mapa.

| Método | Ruta | Body / Query | Éxito | Errores |
|---|---|---|---|---|
| POST | `/teams` | `{ name, city, contactEmail, foundedYear? }` | 201 + `TeamResponseDto` | 400 validación (objeto plano), 409 `ALREADY_EXISTS` |
| GET | `/teams` | `active`, `all=true` (B6) | 200 + lista | 400 query inválida |
| GET | `/teams/:id` | - | 200 + `TeamResponseDto` | 400 id, 404 `NOT_FOUND` |
| PUT | `/teams/:id` | `{ name, city, contactEmail, foundedYear? }` | 200 + `TeamResponseDto` | 400, 404, 409 `ALREADY_EXISTS` |
| PATCH | `/teams/:id/deactivate` | - | 200 + equipo con `active=false` | 400, 404 |
| PATCH | `/teams/:id/activate` (*) | - | 200 + equipo con `active=true` | 400, 404 |
| DELETE | `/teams/:id` | - | **204 sin cuerpo** | 400, 404, 409 `INVALID_STATE` (con detalle) |
| GET | `/teams/reports/active-by-city` (*) | - | 200 + filas `{city, totalTeams}` | - |

Nota: `/teams/:teamId/sports` (GD-03), `/teams/:teamId/contracts` y `/teams/:id/players` (GD-05) no son de esta historia.

## Reglas de negocio

| # | Regla | Estado | Error |
|---|---|---|---|
| R1 | `name`, `city`, `contactEmail` obligatorios, string, con trim, máx. 120/100/150; correo válido | Cumple | 400 plano, español |
| R2 | `foundedYear` opcional: entero, 1800 a año actual | Cumple | 400 |
| R3 | `name` único sin distinguir mayúsculas y tras trim; al actualizar se ignora el propio id | Cumple (depende de la collation `_ci` de MySQL) | 409 `ALREADY_EXISTS` |
| R4 | `PUT` es reemplazo total: los tres obligatorios siempre; `foundedYear` omitido o `null` lo deja en null | Falta (B1) | 400 |
| R5 | Ningún campo obligatorio acepta `null` ni vacío en actualización | Falta (B4) | 400, nunca 500 |
| R6 | Errores de dominio con `ApplicationException({errorCase, message})` y mensaje en español | Falta (B3) | `NOT_FOUND`, `ALREADY_EXISTS`, `INVALID_STATE` |
| R7 | `DELETE` solo sin información asociada; mensaje dice qué la impide y cuántas | Parcial (B5): hoy mensaje genérico y en inglés | 409 `INVALID_STATE` |
| R8 | Dependencias que bloquean: `team_sports`, `player_contracts`, `matches` (local o visitante), `scoring_events`; más inscripciones y `group_teams` cuando existan (GC-02, GC-04) | Parcial (B5) | 409 |
| R9 | `deactivate` siempre permitido e idempotente; `activate` idempotente. Un equipo inactivo no se usa en nuevas asociaciones (lo validan GD-03, GD-05, GC-02) | Cumple en este módulo | 404 si no existe |
| R10 | Listado: devuelve todos los equipos (activos e inactivos); `?active=true|false` filtra; `GET /:id` devuelve el equipo aunque esté inactivo | Cumple (decisión P2) | 400 si el query es inválido |
| R11 | `:id` numérico (`idParamPipe`) | Cumple | 400 `INVALID_OPERATION` |
| R12 | Una FK que bloquee el borrado tras el conteo se traduce a 409, no 500 | Cumple (`TeamInUseError`) | 409 |

## Brechas a cerrar

| # | Brecha | Cambio propuesto |
|---|---|---|
| B1 | `PATCH /teams/:id` en vez de `PUT` | Cambiar a `PUT`; `UpdateTeamDto` pasa a extender `CreateTeamDto` sin `PartialType` (como `UpdateSportDto`); `mergeEntity` asigna todos los campos. Cambia el contrato que consume el frontend: coordinar (P1) |
| B2 | `DELETE` responde 200 `{message}` | `@HttpCode(204)` y el service devuelve `void` |
| B3 | `NotFoundException`/`ConflictException` con mensajes en inglés | `ApplicationException(NOT_FOUND / ALREADY_EXISTS / INVALID_STATE, "...")` en español; ajustar `teams.service.spec.ts` |
| B4 | `PATCH` con `null` en `name`, `city` o `contactEmail` da 500 (`PartialType` pone `@IsOptional`, que acepta `null`; `contactEmail.toLowerCase()` falla con `null`) | Desaparece con B1 (DTO de reemplazo sin `@IsOptional` en obligatorios). Prueba de regresión: `null`, `""` y `"   "` en cada campo dan 400 |
| B5 | `TEAM_ASSOCIATIONS` omite `matches.home_team_id`, `matches.away_team_id`, `scoring_events.team_id` | Agregarlas. Hoy la FK `RESTRICT` protege (R12), pero el mensaje sería genérico. Mejorar el mensaje con el desglose por tipo (P3) |
| B6 | ~~`GET /teams` sin filtro devuelve inactivos~~ | Descartada: el listado completo es la decisión del grupo (P2) |
| B7 | `ER_DUP_ENTRY` en carrera de dos `POST`/`PUT` con el mismo nombre da 500 | El repositorio traduce el error a `DuplicateTeamNameError` y el service responde 409 `ALREADY_EXISTS` (patrón de sports) |

## Casos límite

- `"  Real Madrid  "` se guarda recortado; `"real madrid"` es duplicado (409). `"Atlético"` vs `"Atletico"`: duplicado por collation `_ai_ci` (misma propuesta aceptada en HU-GD-01 P4).
- `contactEmail` con mayúsculas se guarda en minúsculas; con más de 150 caracteres o sin formato: 400.
- `foundedYear` 1799, año futuro, decimal o texto: 400.
- Body con `active` o `id`: 400 por `forbidNonWhitelisted`; el estado solo cambia con `activate` y `deactivate`.
- `PUT` sin `foundedYear` lo deja en null (R4).
- `PUT` con el propio nombre sin cambios: 200, no es duplicado.
- Equipo con contrato, partido, anotación o deporte asociado: `DELETE` 409; equipo sin nada: 204 y luego `GET` da 404.
- `DELETE` sobre un equipo ya borrado: 404. Id `0`, negativo o fuera de rango: 404; `1e2`, `0x10`, `abc`: 400.

## Frontend (I.R)

Pantallas de listado, formulario crear/editar, detalle y acciones activar/desactivar/eliminar, en el repositorio del frontend con su `AGENTS.md`. Impacto del backend: el frontend debe usar `PUT` en la edición (B1), tratar `DELETE` 204 sin cuerpo (B2) y leer el error 409 de borrado para mostrarlo al usuario.

## Trazabilidad

| Criterio | Cómo se cubre |
|---|---|
| C1 | `POST /teams` (R1, R2, R3) |
| C2 | R1, R2, R5; DTO + `ValidationPipe` |
| C3 | `GET /teams` (R10) |
| C4 | `GET /teams/:id` (R11, B3) |
| C5 | `PUT /teams/:id` (R3, R4, R5, B1, B4) |
| C6 | `DELETE` (R7, R8, B2) y `deactivate`/`activate` (R9) |
| C7 | R7, R8, B5. Completa solo para las tablas que existen hoy (ver P4) |
| C8 | R12, B7; pruebas que releen con `GET` tras cada escritura |

## Preguntas abiertas

Decisiones del integrante (2026-11-21): P1 solo `PUT`; P2 el listado devuelve todos, sin filtro por defecto (el frontend filtra después); P3 a P7 se acogen según la recomendación; P8 ver abajo.

| # | Pregunta | Recomendación |
|---|---|---|
| P1 | Pasar a `PUT` rompe al frontend si ya usa `PATCH /teams/:id`. ¿Se mantiene `PATCH` parcial como alias? | Solo `PUT` (`api-rest`, igual que sports) y avisar al frontend. Dos verbos duplican contrato y pruebas |
| P2 | ¿`GET /teams` debe devolver solo activos por defecto? Cambia el comportamiento actual (devuelve todos) | Sí, por `reglas-dominio` y consistencia con sports, con `?all=true`. Confirmar que el frontend no depende del listado completo |
| P3 | ¿El mensaje de `DELETE` 409 desglosa por tipo (ej. "tiene 2 contratos y 1 partido") o basta un total? | Desglose, como en sports (R9 de HU-GD-01). Exige contar cada tabla por separado en el repositorio |
| P4 | Inscripciones (GC-02) y `group_teams` (GC-04) no existen. ¿Se agregan a `TEAM_ASSOCIATIONS` ahora (la tabla no existe y el conteo fallaría) o cuando se creen? | Cuando se creen sus migraciones, cada historia agrega su línea. Mientras tanto la FK `RESTRICT` protege |
| P5 | `reglas-dominio` dice "deportes asociados" como dependencia: ¿una asociación `team_sports` bloquea el borrado aunque el equipo esté inactivo? | Sí, bloquea siempre (ya implementado). Para quitarlo se usa `DELETE /teams/:teamId/sports/:sportId` (GD-03) |
| P6 | `modelo-relacional` dice `foundedAt`; el código usa `foundedYear` (año entero). ¿Cuál es correcta? | Mantener `foundedYear` (migración y frontend ya lo usan) y corregir la skill |
| P7 | Reportes: `GET /teams/reports/active-by-city` no está en el mapa de `api-rest`. ¿Se conserva? | Conservar si el grupo lo necesita; documentarlo en `api-rest`. No es de los criterios de esta historia |
| P8 | Autenticación JWT | ms_security (puerto 8181) firma con HS256 y un secreto compartido (`security.jwt.secret`, mínimo 32 bytes), emisor `ms-security`, `sub` = id de usuario y claim `roles`. ms_sports puede validar la firma con el mismo secreto; ms_security además comprueba que la sesión no haya expirado en su base. **Fuera del alcance de esta historia:** no se implementa guard aquí; se decide con el grupo cómo validarlo (solo firma, o consultar la sesión) |

Ninguna skill contradice la historia. Todos los criterios se pudieron trazar; C7 queda completo solo para las dependencias existentes (P4).
