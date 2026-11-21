# HU-GD-03 – Asociar equipos con deportes

## Historia

**Historia de usuario:** Como administrador deportivo, quiero asociar los equipos con los deportes en los que participan, para identificar las disciplinas deportivas en las que puede competir cada equipo.

**Criterios de aceptación:**

- C1. Tanto el equipo como el deporte deben existir previamente.
- C2. No se debe permitir registrar dos veces la misma asociación entre un equipo y un deporte.
- C3. El sistema debe permitir consultar los deportes asociados a un equipo.
- C4. El sistema debe permitir consultar los equipos asociados a un deporte.
- C5. Se debe poder retirar una asociación sin eliminar el equipo ni el deporte del sistema.

Alcance (`docs/alcance-integrante1.md`): **Interfaz Requerida (I.R)**, backend completo y frontend en React. Depende de HU-GD-01 y HU-GD-02 (ya implementadas). `TeamSport` es entidad intermedia explícita, no `@ManyToMany`.

## Estado actual y archivos

- Existe: entidad `TeamSport` (`team_sports`: `id`, `team_id`, `sport_id`, `UQ_team_sports_team_sport`, `IDX_team_sports_sport_id`, FKs `RESTRICT` a `teams` y `sports`), su migración (`CreateSports`) e inversas `Team.teamSports` y `Sport.teamSports`. **El esquema no cambia: sin migración nueva.**
- No existe: módulo, controller, service, repositorio (interfaz + token + TypeORM), mapper ni DTOs en `src/team-sports/`.
- `TeamsModule` exporta `TeamsService` y `TeamMapper`. `SportsModule` **no exporta nada** (su comentario prevé exportar `SportsService` en esta historia).
- Archivos a tocar: `src/team-sports/**` (nuevo), `src/app.module.ts` (registrar el módulo) y `src/sports/sports.module.ts` (exportar `SportsService`/`SportMapper`). Los dos últimos son compartidos: avisar al grupo. Sin cambios en `src/exception/*`.
- Módulo propio `TeamSportsModule` con un solo controller con rutas completas (`/teams/...` y `/sports/...`), para no crear dependencia circular entre `TeamsModule` y `SportsModule` (ver `arquitectura-nest`).

## Endpoints

Mapa de `api-rest` GD-03. Todos los ids de ruta con `idParamPipe` (no numérico: 400 `INVALID_OPERATION`). Ninguno recibe body.

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| POST | `/teams/:teamId/sports/:sportId` | 201 + `TeamSportResponseDto` | 400 id, 404 equipo o deporte, 409 `ALREADY_EXISTS`, 409 `INVALID_STATE` (inactivo) |
| DELETE | `/teams/:teamId/sports/:sportId` | 204 sin cuerpo | 400 id, 404 (equipo, deporte o asociación) |
| GET | `/teams/:id/sports` | 200 + lista de deportes del equipo | 400, 404 equipo |
| GET | `/sports/:id/teams` | 200 + lista de equipos del deporte | 400, 404 deporte |

Respuestas (propuesta, P1): `TeamSportResponseDto = { id, team: {id, name}, sport: {id, name} }`; las listas devuelven resúmenes `{ id, name, active }` del equipo o deporte relacionado, ordenados por nombre.

## Reglas de negocio

| # | Regla | Origen | Error |
|---|---|---|---|
| R1 | El equipo y el deporte de la ruta deben existir. Se valida primero el equipo y luego el deporte; el mensaje nombra la entidad | C1, `reglas-dominio` | 404 `NOT_FOUND` (español) |
| R2 | Para crear, equipo y deporte deben estar activos. Se evalúa después de R1 | `reglas-dominio` GD-03 | 409 `INVALID_STATE` |
| R3 | No se repite el par (equipo, deporte). Se verifica antes de insertar; el `ER_DUP_ENTRY` de una carrera se traduce a 409 en el repositorio (patrón `DuplicateTeamNameError` de GD-02), nunca 500 | C2 | 409 `ALREADY_EXISTS` |
| R4 | Retirar borra solo la fila de `team_sports`; no toca `teams` ni `sports`. Si la asociación no existe: 404 (el retiro no es idempotente) | C5 | 404 `NOT_FOUND` |
| R5 | Retirar se permite aunque el equipo o el deporte estén inactivos; es la única vía para liberar el borrado de un equipo o deporte inactivo (GD-02 P5) | GD-02 P5 | - |
| R6 | Las listas validan que el recurso de la ruta exista (aunque esté inactivo) y devuelven `[]` con 200 si no tiene asociaciones | C3, C4 | 404 si no existe |
| R7 | `GET /sports/:id/teams` devuelve solo las asociaciones directas con ese deporte, sin subdeportes (P2) | C4 | - |
| R8 | Las listas devuelven todas las asociaciones, con `active` en cada elemento; `?active=true|false` filtra por el estado del equipo o deporte relacionado (P3) | C3, C4 | 400 si el query es inválido |
| R9 | Desactivar un equipo o un deporte no borra ni modifica sus asociaciones; solo bloquea nuevas (R2) (P4) | `reglas-dominio` | - |
| R10 | Las asociaciones bloquean el borrado de equipos y deportes (409 con desglose, ya implementado en GD-01 y GD-02). Al terminar HU-GD-03 el usuario puede liberar el borrado retirando las asociaciones | GD-01 R9, GD-02 R8 | 409 `INVALID_STATE` |

## Brechas

| # | Brecha | Cambio propuesto |
|---|---|---|
| B1 | No hay módulo ni endpoints | Crear `src/team-sports/` con controller, service, `TeamSportRepository` (interfaz + token) + `TeamSportTypeOrmRepository`, `TeamSportMapper`, DTOs de respuesta |
| B2 | El service necesita validar equipo y deporte sin duplicar lógica | Reutilizar `TeamsService` (ya exportado) y exportar `SportsService` desde `SportsModule`. Si el `architect` prefiere no depender de services ajenos, el repositorio consulta existencia y `active` directo |
| B3 | `reglas-dominio` ("listados solo activos por defecto") choca con la decisión de GD-02 (listado de equipos completo) | No decide esta spec; ver P3 |
| B4 | La condición "(Propuesta) no retirar si el equipo está inscrito en un torneo activo de ese deporte" requiere inscripciones, que no existen (GC-02) | Diferida a GC-02, que agrega la comprobación al service de retiro (ver P5) |

## Casos límite

- Asociar el mismo par dos veces seguidas: 201 y luego 409. Dos POST simultáneos: uno 201 y otro 409, nunca 500.
- Equipo inexistente y deporte inexistente a la vez: 404 del equipo (R1). Equipo inactivo y deporte inexistente: 404 (R1 antes que R2).
- Equipo activo + deporte inactivo (ej. "Squash" del seed) o equipo inactivo ("Cúcuta Deportivo"): 409 `INVALID_STATE`, y no queda fila creada.
- Un equipo puede tener varios deportes y un deporte varios equipos; un equipo puede estar en un deporte y en su subdeporte a la vez (el seed ya lo hace: Atlético Nacional en Fútbol y Fútbol 11); son dos asociaciones distintas.
- Ids `0`, negativo o fuera de rango: 404; `abc`, `1e2`: 400.
- DELETE de una asociación inexistente: 404. DELETE dos veces seguidas: 204 y luego 404.
- Tras el DELETE: `GET /teams/:id` y `GET /sports/:id` siguen respondiendo 200 y las listas ya no incluyen el elemento.
- Un equipo o deporte borrado entre la validación y el INSERT (error de FK): se traduce a 404, no 500.
- Un deporte inactivo con equipos asociados sigue apareciendo en `GET /teams/:id/sports` con `active=false`.

## Datos de prueba y Postman

- **Esquema:** sin cambios, así que `scripts/seed-data.mjs` sigue válido. Inserta `team_sports` por SQL (función `link`), saltándose las reglas R2 y R3; es correcto porque no enlaza ningún equipo ni deporte inactivo. Si P1 u otra decisión agregara columnas a `team_sports`, el `INSERT` del seed debe actualizarse.
- **Datos que ya sirven para GD-03:** Fútbol con 7 equipos; Fútbol 11 con Atlético Nacional; Baloncesto con Piratas; Tenis y Natación con Club Campestre; Atletismo sin equipos; "Squash" (deporte inactivo) y "Cúcuta Deportivo" (equipo inactivo) para los 409 de R2.
- **Riesgo para lo ya existente:** los casos E-10 y E-12 de GD-01 (`MsSports.postman_collection.json`) afirman "1 equipo asociado" sobre Tenis y Baloncesto. Los casos nuevos **no** deben crear ni retirar asociaciones de los deportes y equipos del seed; deben crear sus propias filas `QA-...` y limpiarlas. `postman/fixtures/teardown.mjs` ya borra `team_sports` de entidades `QA` primero (orden de FK), no requiere cambios.
- **Colección:** la colección actual cubre solo GD-01; HU-GD-03 agrega un folder nuevo. Con los endpoints reales, los fixtures que GD-01 resolvía con SQL (equipo asociado a un deporte) podrían crearse con `POST`; es opcional y lo decide el `tester`.
- Nota: la pregunta P1 de GD-01 y la matriz (`docs/pruebas/HU-GD-01-matriz.md`) esperaban esta historia para cubrir el borrado de deportes y equipos con dependencias por API.

## Frontend (I.R)

Pantalla de detalle o edición de equipo con sus deportes (agregar/quitar) y, opcionalmente, vista del deporte con sus equipos. Debe: usar `POST`/`DELETE` sin body, tratar 204 sin cuerpo, ofrecer solo equipos y deportes activos para asociar, y leer los 409 para mostrar el mensaje.

## Trazabilidad

| Criterio | Cómo se cubre |
|---|---|
| C1 | R1, R2 (`POST`) |
| C2 | R3 |
| C3 | `GET /teams/:id/sports` (R6, R8) |
| C4 | `GET /sports/:id/teams` (R6, R7, R8) |
| C5 | `DELETE` (R4, R5, R10) |

## Preguntas abiertas

| # | Pregunta | Recomendación (propuesta) |
|---|---|---|
| P1 | Forma de las respuestas: el POST devuelve la asociación, las listas devuelven el equipo o deporte relacionado | `TeamSportResponseDto = { id, team:{id,name}, sport:{id,name} }` y resúmenes `{id, name, active}` en las listas; no se reutiliza `SportResponseDto` completo (evita contar subdeportes por fila) |
| P2 | ¿`GET /sports/:id/teams` incluye equipos de los subdeportes? | No, solo directos: la asociación es explícita y GC-02 pide el deporte "correspondiente al torneo". Un `?includeSubsports=true` queda para después si el grupo lo necesita |
| P3 | ¿Las listas devuelven solo activos (transversal de `reglas-dominio`) o todo (decisión de GD-02 para `GET /teams`)? | Todo, con `active` visible y filtro `?active=`; es una consulta de relación e histórica, y el administrador debe ver (y poder retirar) asociaciones con entidades inactivas |
| P4 | ¿Qué pasa al desactivar un deporte con equipos asociados (hoy solo lo bloquean subdeportes activos)? ¿Y al desactivar un equipo? | Se permite y no se tocan las asociaciones (R9), igual que "desactivar siempre permitido". No se desactiva en cascada ni se bloquea |
| P5 | La regla Propuesta "no retirar si el equipo está inscrito en un torneo activo de ese deporte" ¿se aplica? | Diferirla a GC-02 (B4): hoy no hay inscripciones y no se inventa el criterio de "torneo activo"; mientras tanto el retiro es libre |
| P6 | ¿El retiro de una asociación inexistente es 404 o 204 idempotente? | 404, consistente con el resto del proyecto (`DELETE` sobre recurso ya borrado da 404) |
| P7 | ¿Se necesita `PUT /teams/:id/sports` para reemplazar todos los deportes de un equipo de una vez (comodidad del frontend)? No está en el mapa de `api-rest` | No; usar `POST`/`DELETE` individuales. Si el frontend lo pide, se propone en la spec antes de implementar |

Ninguna skill contradice la historia, salvo la tensión señalada en B3/P3 entre `reglas-dominio` y la decisión previa de GD-02. Todos los criterios se pudieron trazar.
