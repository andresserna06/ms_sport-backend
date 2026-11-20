---
name: api-rest
description: Convenciones REST del proyecto - rutas, métodos, códigos HTTP y formato de error. Úsala al crear o cambiar endpoints, contratos de la API o documentación Swagger.
---

# API REST

## Convenciones de rutas

- Recursos en español, plural y kebab-case: `/deportes`, `/habilidades`, `/torneos`.
- IDs en la ruta validados con pipe (no numérico → 400).
- Asociaciones como subrecursos del dueño de la relación.
- Acciones que no son CRUD (desactivar, finalizar contrato) con `PATCH` sobre un subrecurso con nombre de verbo.
- Filtros por query string: `?activo=true`, `?vigentes=true`, `?nombre=fut`.

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

`message` siempre en español y entendible por el usuario final.

## Respuestas

- Siempre DTOs de respuesta; nunca entidades del ORM.
- Las relaciones se devuelven resumidas (`{ id, nombre }`), no anidadas completas,
  salvo en los endpoints de consulta agregada (perfil, desarrollo del torneo).
- Fechas en ISO 8601.

## Mapa de rutas propuesto (mantener sincronizado con Swagger)

| Historia | Rutas |
|---|---|
| GD-01 Deportes | `POST/GET /deportes`, `GET/PUT/DELETE /deportes/:id`, `PATCH /deportes/:id/desactivar`, `GET /deportes/:id/subdeportes` |
| GD-02 Equipos | `POST/GET /equipos`, `GET/PUT/DELETE /equipos/:id`, `PATCH /equipos/:id/desactivar` |
| GD-03 Equipo-Deporte | `POST/DELETE /equipos/:equipoId/deportes/:deporteId`, `GET /equipos/:id/deportes`, `GET /deportes/:id/equipos` |
| GD-04 Jugadores | `POST/GET /jugadores`, `GET/PUT/DELETE /jugadores/:id`, `PATCH /jugadores/:id/desactivar` |
| GD-05 Contratos | `POST /equipos/:equipoId/contratos` (body: jugadorId, fechaInicio, fechaFin?), `PATCH /contratos/:id/finalizar`, `GET /equipos/:id/jugadores?vigentes=true`, `GET /jugadores/:id/equipos` |
| GD-06 Habilidades | `POST/GET /habilidades`, `GET/PUT/DELETE /habilidades/:id` |
| GD-07 Habilidad-Jugador | `POST/DELETE /jugadores/:jugadorId/habilidades/:habilidadId`, `GET /jugadores/:id/habilidades`, `GET /habilidades/:id/jugadores` |
| GD-08 Perfil | `GET /jugadores/:id/perfil`, búsqueda con `GET /jugadores?nombre=` |
| GC-01 Torneos | `POST/GET /torneos`, `GET/PUT/DELETE /torneos/:id`, `PATCH /torneos/:id/desactivar` |
| GC-02 Inscripciones | `POST /torneos/:torneoId/inscripciones` (body: equipoId), `DELETE /torneos/:torneoId/inscripciones/:equipoId`, `GET /torneos/:id/inscripciones`, `GET /equipos/:id/torneos` |
| GC-03 Fases | `POST/GET /torneos/:torneoId/fases`, `GET/PUT/DELETE /fases/:id` |
| GC-04 Grupos | `POST/GET /fases/:faseId/grupos`, `GET/PUT/DELETE /grupos/:id`, `POST/DELETE /grupos/:grupoId/equipos/:equipoId`, `GET /grupos/:id/equipos` |
| GC-05 Fase final | Se crea con `POST /torneos/:torneoId/fases` (tipo FINAL); `GET/PUT/DELETE /fases/:id` |
| GC-06 Partidos | `POST/GET /fases/:faseId/partidos`, `GET /partidos`, `GET/PUT/DELETE /partidos/:id` |
| GC-07 Resultados y anotaciones | `PUT /partidos/:id/resultado`, `PATCH /partidos/:id/finalizar`, `POST/GET /partidos/:id/anotaciones`, `PUT/DELETE /anotaciones/:id` |
| GC-08 Desarrollo | `GET /torneos/:id/desarrollo` |

Si una historia necesita una ruta que no está aquí, propónla en la especificación
antes de implementarla; no la inventes durante la implementación.

## Documentación

- [PENDIENTE] ms_sports todavía no tiene `@nestjs/swagger`. Si el grupo lo agrega,
  cada endpoint documenta sus códigos posibles con `@ApiResponse` y los DTOs con `@ApiProperty`.
- Mientras tanto, la colección Postman es la documentación ejecutable de la API.
