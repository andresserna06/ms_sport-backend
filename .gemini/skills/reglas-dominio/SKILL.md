---
name: reglas-dominio
description: Reglas de negocio del proyecto para deportes, equipos, jugadores, contratos, habilidades, torneos, inscripciones, fases, grupos, partidos, resultados, anotaciones, tabla de posiciones y llaves. Úsala siempre que implementes, revises o pruebes una validación.
---

# Reglas de dominio

Los nombres de entidades, campos y estados están en inglés según el glosario de
`modelo-relacional`; las reglas se explican en español.

Cada regla indica la historia de origen. Las marcadas **(Propuesta)** son
decisiones del grupo que aún deben confirmarse; las **[PENDIENTE]** no se
implementan hasta que se decidan. Si una regla no está aquí ni en la historia,
no se inventa: se pregunta.

## Reglas transversales

**Borrado y desactivación (Propuesta)** — aplica a Deporte, Equipo, Jugador, Habilidad, Torneo
- `DELETE` intenta borrar. Si la entidad tiene información asociada → 409
  (`INVALID_STATE`) con un `message` que diga qué lo impide. Nunca borrar en cascada.
- `PATCH /:id/deactivate` marca `active = false` y siempre está permitido.
- Una entidad inactiva no puede usarse en nuevas asociaciones (409), pero sigue
  apareciendo en consultas históricas (perfil, desarrollo del torneo).
- Los listados devuelven solo activos por defecto; `?active=false` o `?all=true` para el resto.

**Duplicados**
- Los nombres únicos se comparan sin distinguir mayúsculas y tras recortar espacios.
- Un nombre solo con espacios es inválido (400).
- Asociación repetida → 409.

**Referencias**
- Todo ID referenciado (ruta o body) debe existir → si no, 404 con el nombre de la entidad.

## Módulo Gestión Deportiva

**Deportes (GD-01)**
- Un deporte puede tener un deporte padre (subdeporte). No puede ser su propio
  padre ni generar ciclos (A padre de B y B padre de A) → 400.
- Dependencias que impiden borrar: subdeportes, equipos asociados, torneos.

**Equipos (GD-02)**
- Dependencias que impiden borrar: deportes asociados, contratos, inscripciones, partidos.

**Equipo–Deporte (GD-03)**
- Ambos deben existir y estar activos. Retirar la asociación no borra ni el equipo ni el deporte.
- (Propuesta) No se puede retirar si el equipo está inscrito en un torneo activo de ese deporte → 409.

**Jugadores (GD-04)**
- `documentNumber` es el identificador único.
- Dependencias que impiden borrar: contratos (incluidos históricos), habilidades, anotaciones.

**Contratos jugador–equipo (GD-05)**
- `startDate` obligatoria; `endDate` opcional (null = vigente); si existe, `endDate >= startDate`.
- "No duplicar la asociación" significa: no puede haber dos contratos del mismo
  jugador con el mismo equipo cuyos periodos se crucen → 409. Sí puede volver
  al mismo equipo en otro periodo (historial de traspasos).
- (Propuesta) Un jugador no puede tener contratos vigentes simultáneos con dos
  equipos que compartan deporte → 409.
- Retirar un jugador = finalizar el contrato (`endDate = hoy`), nunca borrar el registro.

**Habilidades (GD-06, GD-07)**
- Dependencias que impiden borrar una habilidad: jugadores que la tienen.
- Retirar una habilidad de un jugador no borra la habilidad.

**Perfil del jugador (GD-08)**
- Devuelve datos básicos, contratos (vigentes e históricos, marcando cuál está
  vigente) y habilidades.
- Si no tiene equipos o habilidades, devuelve la lista vacía **y** un mensaje
  explícito (`"El jugador no tiene equipos asociados"`) para que el front lo muestre.

## Módulo Gestión Competencias

**Torneos (GC-01)**
- Debe tener un deporte existente y activo.
- `endDate >= startDate`; `registrationDeadline <= startDate`.
- Estados (Propuesta): `SCHEDULED → IN_PROGRESS → FINISHED`, más `CANCELLED`.
  Un torneo se considera **iniciado** cuando su estado es `IN_PROGRESS` o posterior.
- Dependencias que impiden borrar: fases, inscripciones, partidos.

**Inscripciones (GC-02)**
- Torneo y equipo existen y están activos.
- El equipo debe estar asociado al deporte del torneo (vía Equipo–Deporte) → si no, 409.
- Un equipo solo una vez por torneo → 409.
- No se permiten inscripciones ni retiros si el torneo ya inició o si hoy es
  posterior a `registrationDeadline` → 409.
- (Propuesta) No se puede retirar un equipo que ya está asignado a un grupo o tiene partidos en el torneo → 409.

**Fases (GC-03, GC-05)**
- Cada fase pertenece a un único torneo, con `sequence` (orden) único dentro del torneo.
- `type` es `GROUP_STAGE` (grupos) o `KNOCKOUT` (fase final). No se cambia el tipo si la fase ya tiene grupos o partidos.
- No se elimina una fase con grupos o partidos → 409. Eliminar una fase nunca elimina el torneo.
- Modificar una fase no afecta a las demás fases.

**Grupos (GC-04)**
- Solo se crean dentro de fases tipo `GROUP_STAGE` → si no, 409.
- Para asignar un equipo a un grupo, el equipo debe estar inscrito en el torneo de esa fase → 409.
- Un equipo no puede estar dos veces en el mismo grupo ni en dos grupos de la misma fase → 409.
- Eliminar un grupo elimina sus asignaciones, no los equipos. No se elimina si tiene partidos → 409.

**Partidos (GC-06)**
- La fase existe; local y visitante son distintos (→ 400) y ambos inscritos en el torneo (→ 409).
- En fase de grupos, ambos equipos pertenecen al mismo grupo y el partido guarda `groupId`.
- En fase final, el partido guarda `round` y `bracketPosition`.
- El escenario es opcional; si se envía, debe existir (Propuesta: y estar asociado al torneo).
- Estados: `SCHEDULED → IN_PROGRESS → FINISHED`, más `CANCELLED`.
- Solo se modifica si está `SCHEDULED`. Solo se elimina si está `SCHEDULED` y
  no tiene anotaciones, boletos ni apuestas → 409.
- Al crear un partido se emite el evento de notificación (ver `notificaciones`).

**Resultados y anotaciones (GC-07)**
- Una anotación requiere un partido `IN_PROGRESS` o `FINISHED` (Propuesta) y un
  jugador con contrato vigente, en la fecha del partido, con el local o el visitante → 409.
- La anotación (`ScoringEvent`) guarda `teamId` (el equipo por el que anotó).
- Eliminar una anotación no elimina ni al jugador ni al partido.
- Resultado: `homeScore` y `awayScore` enteros ≥ 0.
- [PENDIENTE] ¿El marcador debe coincidir con la suma de anotaciones o se registra de forma independiente?
- `PATCH /matches/:id/finish` pasa el partido a `FINISHED` y emite el
  evento de resumen. (Propuesta) Un partido finalizado solo puede corregir su
  resultado y sus anotaciones, no sus equipos ni su fase.

**Desarrollo del torneo (GC-08)**
- Devuelve: datos del torneo; fases en orden; por fase de grupos, cada grupo
  con su **tabla de posiciones**; por fase final, las **llaves**; los partidos de
  cada fase con un indicador `hasResult` (true / false); las anotaciones de cada partido.
- Solo incluye información del torneo consultado.

**Tabla de posiciones (Propuesta)**
- Columnas: PJ, PG, PE, PP, AF (anotaciones a favor), AC (en contra), DIF, PTS.
- Solo cuentan los partidos `FINISHED` del grupo.
- Puntos: victoria 3, empate 1, derrota 0.
- Orden: PTS, luego DIF, luego AF, luego nombre del equipo.
- Se calcula en el service al consultar; no se guarda en una tabla.

**Llaves de fase final (Propuesta)**
- Los partidos se agrupan por `round` (ej. 1 = octavos, 2 = cuartos…) y se
  ordenan por `bracketPosition`. El ganador de cada partido se muestra si está finalizado.
- [PENDIENTE] ¿Cómo se resuelve un empate en fase final (penales, partido extra)?
