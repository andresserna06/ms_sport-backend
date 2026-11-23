---
name: api-rest
description: Convenciones REST del proyecto - rutas, métodos, códigos HTTP y formato de error. Úsala al crear o cambiar endpoints, contratos de la API o documentación Swagger.
---

# API REST

## Convenciones de rutas

- Recursos en inglés, plural y kebab-case: `/sports`, `/skills`, `/tournaments`
  (nombres según el glosario de `modelo-relacional`).
- Propiedades del JSON en camelCase e inglés (`startDate`, `homeTeamId`).
- IDs en la ruta validados con pipe (no numérico → 400).
- Asociaciones como subrecursos del dueño de la relación.
- Acciones que no son CRUD (desactivar, finalizar contrato) con `PATCH` sobre un subrecurso con verbo en inglés (`/deactivate`, `/end`).
- Filtros por query string: `?active=true`, `?current=true`, `?name=fut`.

## Códigos de estado

| Código | Uso |
|---|---|
| 200 OK | Consulta o actualización exitosa con cuerpo |
| 201 Created | Recurso o asociación creada (devuelve el recurso creado) |
| 204 No Content | Eliminación o retiro exitoso sin cuerpo |
| 400 Bad Request | Body inválido, campos faltantes, formato incorrecto, ID no numérico |
| 404 Not Found | El recurso de la ruta o un recurso referenciado en el body no existe |
| 409 Conflict | Duplicado, asociación repetida, o la operación choca con el estado actual (tiene dependencias, torneo iniciado, inscripciones cerradas, partido finalizado) |
| 500 | Error inesperado (nunca se lanza a propósito) |

Nunca devolver 200 con un mensaje de error en el cuerpo.

## Formato de error (igual al de ms_security)

El `apiClient.js` del frontend ya interpreta este formato, así que ms_sports lo
replica con un filtro global de excepciones:

```json
{ "errorCase": "ALREADY_EXISTS", "message": "Ya existe un deporte con el nombre Fútbol" }
```

| errorCase | HTTP | Uso |
|---|---|---|
| `NOT_FOUND` | 404 | Recurso inexistente |
| `ALREADY_EXISTS` | 409 | Duplicado o asociación repetida |
| `INVALID_STATE` | 409 | Choca con el estado actual: tiene dependencias, torneo iniciado, inscripciones cerradas, partido finalizado |
| `INVALID_OPERATION` | 400 | Regla de negocio sobre los datos enviados (fechas invertidas, equipo contra sí mismo, deporte padre de sí mismo) |
| `HTTP_ERROR` | el que corresponda | Otras excepciones HTTP de Nest |

Errores de validación de DTOs (400): objeto plano `{ "campo": "mensaje" }`,
igual que ms_security, porque el frontend lo usa para marcar cada campo del formulario.

`message` es el único texto en español (lo lee el usuario final); las claves
del JSON y los `errorCase` van en inglés.

## Respuestas

- Siempre DTOs de respuesta; nunca entidades del ORM.
- Las relaciones se devuelven resumidas (`{ id, nombre }`), no anidadas completas,
  salvo en los endpoints de consulta agregada (perfil, desarrollo del torneo).
- Fechas en ISO 8601.

## Mapa de rutas propuesto

| Historia | Rutas |
|---|---|
| GD-01 Deportes | `POST/GET /sports`, `GET/PUT/DELETE /sports/:id`, `PATCH /sports/:id/deactivate`, `GET /sports/:id/subsports` |
| GD-02 Equipos | `POST/GET /teams`, `GET/PUT/DELETE /teams/:id`, `PATCH /teams/:id/deactivate` |
| GD-03 Equipo-Deporte | `POST/DELETE /teams/:teamId/sports/:sportId`, `GET /teams/:id/sports`, `GET /sports/:id/teams` |
| GD-04 Jugadores | `POST/GET /players`, `GET/PUT/DELETE /players/:id`, `PATCH /players/:id/deactivate` |
| GD-05 Contratos | `POST /teams/:teamId/contracts` (body: playerId, startDate, endDate?), `PATCH /contracts/:id/end`, `GET /teams/:id/players?current=true`, `GET /players/:id/teams` |
| GD-06 Habilidades | `POST/GET /skills`, `GET/PUT/DELETE /skills/:id` |
| GD-07 Habilidad-Jugador | `POST/DELETE /players/:playerId/skills/:skillId`, `GET /players/:id/skills`, `GET /skills/:id/players` |
| GD-08 Perfil | `GET /players/:id/profile`, búsqueda con `GET /players?name=` |
| GC-01 Torneos | `POST/GET /tournaments`, `GET/PUT/DELETE /tournaments/:id`, `PATCH /tournaments/:id/deactivate` |
| GC-02 Inscripciones | `POST /tournaments/:tournamentId/registrations` (body: teamId), `DELETE /tournaments/:tournamentId/registrations/:teamId`, `GET /tournaments/:id/registrations`, `GET /teams/:id/tournaments` |
| GC-03 Fases | `GET /phases?tournamentId=`, `GET /phases/:id`; las fases se crean desde `/groups` o `/finals` con `tournamentId` |
| GC-04 Grupos | `POST/GET /groups?tournamentId=`, `GET/PATCH/DELETE /groups/:id`, `POST/DELETE /groups/:groupId/teams/:teamId`, `GET /groups/:id/teams` |
| GC-05 Fase final | `POST/GET /finals?tournamentId=`, `GET/PATCH/DELETE /finals/:id` (tipo `FINAL`) |
| GC-06 Partidos | `POST/GET /phases/:phaseId/matches`, `GET /matches`, `GET/PUT/DELETE /matches/:id` |
| GC-07 Resultados y anotaciones | `PUT /matches/:id/result`, `PATCH /matches/:id/finish`, `POST/GET /matches/:id/scoring-events`, `PUT/DELETE /scoring-events/:id` |
| GC-08 Desarrollo | `GET /tournaments/:id/overview` |
| Modelo completo (CRUD básico, sin reglas de negocio) | `POST/GET /<recurso>`, `GET/PUT/DELETE /<recurso>/:id` para: `venues`, `seating-zones`, `tournament-venues`, `fans`, `fan-teams`, `payment-methods`, `fan-payment-methods`, `tickets`, `bets`, `balls`, `spatial-positions`. Errores: 404 si una referencia no existe, 409 si se repite un valor único o se elimina algo con información asociada |

Si una historia necesita una ruta que no está aquí, propónla en la especificación
antes de implementarla; no la inventes durante la implementación.

## Documentación

- [PENDIENTE] ms_sports todavía no tiene `@nestjs/swagger`. Si el grupo lo agrega,
  cada endpoint documenta sus códigos posibles con `@ApiResponse` y los DTOs con `@ApiProperty`.
- Mientras tanto, la colección Postman es la documentación ejecutable de la API.
