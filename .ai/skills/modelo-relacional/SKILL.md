---
name: modelo-relacional
description: Modelo de datos del proyecto (deportes, equipos, jugadores, habilidades, torneos, fases, grupos, partidos, anotaciones) con sus relaciones y restricciones. Úsala al crear o cambiar entidades, relaciones, índices, restricciones o migraciones.
---

# Modelo relacional del proyecto

Basado en el diagrama de clases del grupo, con las correcciones acordadas.
Si el código y esta skill no coinciden, se reporta; no se "arregla" en silencio.

## Entidades del alcance

| Entidad | Campos clave | Restricciones |
|---|---|---|
| Deporte | id, nombre, descripcion, activo, deportePadreId (nullable) | nombre único (sin distinguir mayúsculas, tras trim). Autorrelación 1:N (subdeportes) |
| Equipo | id, nombre, ciudad, fechaFundacion, activo | nombre único |
| EquipoDeporte | equipoId, deporteId | PK o UNIQUE (equipoId, deporteId) |
| Jugador | id, documento, nombres, apellidos, fechaNacimiento, activo | documento único |
| ContratoJugador (EquipoJugador) | id, jugadorId, equipoId, fechaInicio, fechaFin (nullable) | ver reglas de solape en `reglas-dominio`. Es entidad propia, no tabla puente simple, porque guarda historial |
| Habilidad | id, nombre, descripcion | nombre único |
| HabilidadJugador | jugadorId, habilidadId | UNIQUE (jugadorId, habilidadId) |
| Torneo | id, nombre, deporteId, fechaInicio, fechaFin, fechaCierreInscripciones, estado, activo | FK a Deporte |
| Inscripcion | id, torneoId, equipoId, fechaInscripcion | UNIQUE (torneoId, equipoId) |
| Fase (abstracta) | id, torneoId, nombre, orden, tipo (GRUPOS / FINAL) | UNIQUE (torneoId, orden) |
| Grupo (hereda de Fase… ver nota) | id, faseId, nombre | UNIQUE (faseId, nombre) |
| GrupoEquipo | grupoId, equipoId, faseId | UNIQUE (grupoId, equipoId) y UNIQUE (faseId, equipoId) |
| Final (hereda de Fase) | datos propios de la fase final (ej. número de rondas) | — |
| Partido | id, faseId, grupoId (nullable), localId, visitanteId, escenarioId (nullable), fechaHora, estado, marcadorLocal, marcadorVisitante, ronda (nullable), posicionLlave (nullable) | CHECK localId <> visitanteId |
| Anotacion | id, partidoId, jugadorId, equipoId, minuto, tipo | FK a Partido y Jugador |
| Escenario / Localidad / EscenarioTorneo | según diagrama | UNIQUE (torneoId, escenarioId) en EscenarioTorneo |

Mínimas, solo para notificaciones: Aficionado (id, nombre, email), Boleto
(aficionadoId, partidoId), Apuesta (aficionadoId, partidoId).

## Correcciones respecto al diagrama original

1. **Grupo–Equipo era 1:N** → pasa a **N:N con GrupoEquipo**. Un equipo juega
   varios torneos, así que no puede pertenecer a un solo grupo de por vida.
   `faseId` se guarda en GrupoEquipo para poder imponer "un equipo en un solo
   grupo por fase" con una restricción UNIQUE.
2. **Resultado del partido**: el diagrama no lo tenía. Se guarda en Partido
   (`marcadorLocal`, `marcadorVisitante`, `estado`).
3. **Fase final y llaves**: Partido guarda `ronda` y `posicionLlave` para poder
   dibujar las llaves.
4. **Partido como clase asociación** de Equipo × Equipo: se implementa con dos
   FK (`localId`, `visitanteId`) a Equipo.

## Herencia Fase → Grupo / Final

Nota de modelado: en el diagrama Grupo y Final heredan de Fase. En la historia
GC-04, una fase de grupos *contiene* varios grupos. Se implementa así:

- Fase es la tabla principal con columna `tipo` (herencia en tabla única).
- Una Fase tipo GRUPOS tiene N registros en la tabla Grupo (FK faseId).
- Una Fase tipo FINAL no tiene grupos; sus partidos usan `ronda` y `posicionLlave`.

[PENDIENTE] Confirmar con el grupo que esta interpretación coincide con lo que
espera el docente del diagrama.

## Reglas generales

- MySQL con TypeORM. IDs enteros autoincrementales (igual que ms_security).
- Las entidades de ms_sports no tienen FK hacia tablas de ms_security (son bases
  de datos distintas). Si se necesita el usuario, se guarda su id como dato simple.

- Toda FK con su índice.
- Borrados en cascada **prohibidos** en relaciones hacia entidades principales
  (Deporte, Equipo, Jugador, Habilidad, Torneo). La validación de dependencias
  se hace en el service (ver `reglas-dominio`) y la FK debe ser `RESTRICT`.
- Cascada permitida solo de un agregado hacia sus partes internas cuando la
  regla lo permita (ej. eliminar un grupo elimina sus filas en GrupoEquipo, no los equipos).
- Los cambios de esquema se hacen con migraciones, nunca con sincronización automática en producción.
- Nombres de tablas y columnas en español, snake_case en la base de datos.
