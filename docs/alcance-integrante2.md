# Alcance de Desarrollo - Integrante 2 (Laura Medina)

## Reglas de alcance y restricciones
- **Repositorio actual (`ms_sport-backend`):** NestJS. Implementar únicamente la capa de backend (entidades, DTOs, servicios, controladores y pruebas).
- **Regla de interfaz (para referencia de alcance y documentación):**
  - `HU-GD-06` (`Habilidad`): **Sin Interfaz (S.I)** — Solo backend. No planificar ni generar componentes visuales para esta entidad.
  - `HU-GD-04`, `HU-GD-05`, `HU-GD-07`, `HU-GD-08` y `HU-GC-07`: **Interfaz Requerida (I.R)** — Requieren backend completo preparado para ser consumido desde el frontend.
- **Modelado de relaciones:**
  - `EquipoJugador` y `HabilidadJugador` deben modelarse como **entidades intermedias explícitas** (clases de asociación con sus propios atributos), no como relaciones `@ManyToMany` simples.

## Historias asignadas y orden de ejecución
1. **HU-GD-06** – Gestionar habilidades *(Sin dependencias)*
2. **HU-GD-04** – Gestionar jugadores *(Sin dependencias)*
3. **HU-GD-07** – Asignar habilidades a jugadores *(Depende de HU-GD-04 y HU-GD-06)*
4. **HU-GD-05** – Asignar jugadores a equipos *(Depende de HU-GD-04 y de la entidad `Equipo`)*
5. **HU-GD-08** – Consultar perfil deportivo del jugador *(Depende de HU-GD-04, HU-GD-05 y HU-GD-07)*
6. **HU-GC-07** – Gestionar resultados y anotaciones de los partidos *(Dejar para el final; depende de `Partido` y del servicio de notificaciones existente)*