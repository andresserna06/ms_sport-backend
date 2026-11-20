# Historias de usuario – Segunda entrega (Desarrollo Backend)

Alcance: 16 historias. Las 8 del Módulo Gestión Deportiva (Anexo 2) y las 8 primeras del Módulo Gestión Competencias (Anexo 3). Quedan fuera HU-GC-09 (seguimiento espacial), HU-GC-10 (métodos de pago) y HU-GC-11 (apuestas).

| Módulo | Historias |
|---|---|
| Gestión Deportiva | HU-GD-01 a HU-GD-08 |
| Gestión Competencias | HU-GC-01 a HU-GC-08 |

## Módulo Gestión Deportiva

### HU-GD-01 – Gestionar deportes

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

### HU-GD-02 – Gestionar equipos

**Historia de usuario:** Como administrador deportivo, quiero gestionar los equipos de la plataforma, para mantener organizada la información de las organizaciones que pueden participar en las diferentes competencias.

**Criterios de aceptación:**

- El sistema debe permitir registrar un equipo con su información básica.
- Los campos obligatorios deben ser validados.
- El sistema debe permitir consultar los equipos registrados.
- Se debe poder consultar la información detallada de un equipo.
- Se debe permitir actualizar la información del equipo.
- Se debe permitir eliminar o desactivar un equipo cuando las reglas del sistema lo permitan.
- Antes de eliminar un equipo, el sistema debe validar si posee información asociada.
- Los cambios realizados deben quedar almacenados correctamente.

### HU-GD-03 – Asociar equipos con deportes

**Historia de usuario:** Como administrador deportivo, quiero asociar los equipos con los deportes en los que participan, para identificar las disciplinas deportivas en las que puede competir cada equipo.

**Criterios de aceptación:**

- Tanto el equipo como el deporte deben existir previamente.
- No se debe permitir registrar dos veces la misma asociación entre un equipo y un deporte.
- El sistema debe permitir consultar los deportes asociados a un equipo.
- El sistema debe permitir consultar los equipos asociados a un deporte.
- Se debe poder retirar una asociación sin eliminar el equipo ni el deporte del sistema.

### HU-GD-04 – Gestionar jugadores

**Historia de usuario:** Como administrador deportivo, quiero gestionar la información de los jugadores, para mantener actualizado el registro de las personas que pueden integrar los diferentes equipos.

**Criterios de aceptación:**

- El sistema debe permitir registrar un jugador con su información requerida.
- Los campos obligatorios deben ser validados.
- No se deben permitir jugadores duplicados cuando exista un identificador único.
- El sistema debe permitir consultar los jugadores registrados.
- Se debe poder consultar el detalle de un jugador.
- Se debe permitir actualizar la información de un jugador.
- Se debe permitir eliminar o desactivar un jugador cuando las reglas del sistema lo permitan.
- La eliminación de un jugador debe validar previamente si tiene información asociada.
- Los cambios deben quedar almacenados correctamente.

### HU-GD-05 – Asignar jugadores a equipos

**Historia de usuario:** Como administrador deportivo, quiero asignar jugadores a los equipos, para establecer la composición de cada plantilla deportiva.

**Criterios de aceptación:**

- Tanto el jugador como el equipo deben existir previamente.
- Se debe permitir asociar un jugador con un equipo definiendo la fecha de inicio y fin del contrato.
- Un equipo puede estar conformado por varios jugadores.
- El sistema debe evitar registrar dos veces la misma asociación.
- Se deben poder consultar los jugadores pertenecientes a un equipo.
- Se deben poder consultar los equipos asociados a un jugador.
- Se debe permitir retirar un jugador de un equipo sin eliminar su información del sistema.
- Al retirar la asociación, el jugador debe continuar disponible para ser asignado a otros equipos para que sirva como historial de traspasos

### HU-GD-06 – Gestionar habilidades

**Historia de usuario:** Como administrador deportivo, quiero gestionar las habilidades deportivas disponibles en el sistema, para disponer de un catálogo de capacidades que puedan ser asignadas a los jugadores.

**Criterios de aceptación:**

- El sistema debe permitir registrar nuevas habilidades.
- Los campos requeridos deben ser validados.
- No se deben permitir habilidades duplicadas.
- El sistema debe permitir consultar las habilidades registradas.
- Se debe poder consultar el detalle de una habilidad.
- Se debe permitir actualizar la información de una habilidad.
- Se debe permitir eliminar una habilidad cuando no existan restricciones que lo impidan.
- Si la habilidad se encuentra asociada con jugadores, el sistema debe validar si puede ser eliminada.

### HU-GD-07 – Asignar habilidades a jugadores

**Historia de usuario:** Como administrador deportivo, quiero asignar habilidades a los jugadores, para representar las capacidades deportivas que posee cada uno.

**Criterios de aceptación:**

- Tanto el jugador como la habilidad deben existir previamente.
- Un jugador puede tener una o varias habilidades.
- Una misma habilidad puede pertenecer a diferentes jugadores.
- No se debe permitir asignar dos veces la misma habilidad al mismo jugador.
- El sistema debe permitir consultar las habilidades asociadas a un jugador.
- Se debe permitir consultar los jugadores que poseen determinada habilidad.
- Se deben poder agregar o retirar habilidades de un jugador.
- Retirar una habilidad de un jugador no debe eliminar la habilidad del sistema.

### HU-GD-08 – Consultar perfil deportivo del jugador

**Historia de usuario:** Como administrador deportivo, quiero consultar el perfil deportivo de un jugador, para conocer de manera centralizada su información, los equipos a los que pertenece y las habilidades que posee.

**Criterios de aceptación:**

- El sistema debe permitir seleccionar o buscar un jugador registrado.
- Se debe mostrar la información básica del jugador.
- Se deben mostrar los equipos con los que se encuentra asociado.
- Se deben mostrar las habilidades que tiene asignadas.
- Si el jugador no tiene equipos asociados, el sistema debe indicarlo.
- Si el jugador no tiene habilidades registradas, el sistema debe indicarlo.

## Módulo Gestión Competencias

### HU-GC-01 – Gestionar torneos

**Historia de usuario:** Como administrador deportivo, quiero gestionar los torneos de la plataforma, para organizar las diferentes competencias que se realizan para los deportes registrados.

**Criterios de aceptación:**

- El sistema debe permitir registrar un torneo con la información requerida.
- Cada torneo debe estar asociado con un deporte previamente registrado.
- Los campos obligatorios deben ser validados antes de guardar la información.
- El sistema debe permitir consultar los torneos registrados.
- Se debe poder consultar la información detallada de un torneo.
- Se debe permitir actualizar la información de un torneo existente.
- Se debe permitir eliminar o desactivar un torneo cuando las reglas del sistema lo permitan.
- Antes de eliminar un torneo, se debe validar si posee fases, partidos u otra información asociada.
- Los cambios realizados deben quedar almacenados correctamente.

### HU-GC-02 – Gestionar inscripciones de equipos en torneos

> Nota: en el Anexo 3 esta historia aparece numerada como HU-GC-08 (no existe HU-GC-02). Se renumera para evitar el ID duplicado con "Consultar desarrollo de un torneo".

**Historia de usuario:** Como administrador deportivo, quiero gestionar la inscripción de equipos en los diferentes torneos, para definir cuáles equipos participarán en cada competencia.

**Criterios de aceptación:**

- El torneo debe estar previamente registrado en el sistema.
- El equipo debe estar previamente registrado en el sistema.
- El equipo debe estar asociado con el deporte correspondiente al torneo.
- El sistema debe permitir inscribir uno o varios equipos en un torneo.
- Un mismo equipo puede estar inscrito en diferentes torneos.
- Un torneo puede contar con varios equipos inscritos.
- No se debe permitir registrar dos veces al mismo equipo en el mismo torneo.
- El sistema debe permitir consultar los equipos inscritos en un torneo.
- El sistema debe permitir consultar los torneos en los que se encuentra inscrito un equipo.
- Se debe permitir retirar la inscripción de un equipo mientras las reglas o el estado del torneo lo permitan.
- Retirar una inscripción no debe eliminar el equipo ni el torneo del sistema.
- La información de la inscripción debe quedar asociada al equipo y al torneo correspondientes.
- Si el torneo ya inició o el periodo de inscripciones se encuentra cerrado, el sistema debe impedir nuevas inscripciones o retiros cuando corresponda.
- El sistema debe informar al usuario cuando una inscripción se haya realizado o retirado correctamente.

### HU-GC-03 – Gestionar fases de un torneo

**Historia de usuario:** Como administrador deportivo, quiero gestionar las fases que conforman un torneo, para definir las diferentes etapas mediante las cuales se desarrollará la competencia.

**Criterios de aceptación:**

- El torneo debe existir previamente en el sistema.
- El sistema debe permitir registrar una o varias fases para un torneo.
- Cada fase debe estar asociada con un único torneo.
- Se debe permitir consultar las fases correspondientes a un torneo.
- Se debe poder actualizar la información de una fase.
- Se debe permitir eliminar una fase cuando no tenga información asociada que lo impida.
- El sistema debe permitir definir el orden en el que se desarrollarán las fases.
- Cada fase debe corresponder al tipo de etapa definido para la competencia, como una fase de grupos o una fase final.
- No se debe eliminar el torneo al modificar o eliminar una de sus fases.

### HU-GC-04 – Gestionar grupos de competencia

**Historia de usuario:** Como administrador deportivo, quiero gestionar los grupos pertenecientes a una fase de un torneo, para organizar los equipos que competirán durante esta etapa.

**Criterios de aceptación:**

- Debe existir previamente un torneo y una fase correspondiente.
- El sistema debe permitir registrar los grupos necesarios para la fase.
- Se debe poder consultar la información de los grupos registrados.
- Se debe permitir modificar la información de un grupo.
- Se debe permitir eliminar un grupo cuando las reglas de la competencia lo permitan.
- El sistema debe permitir asignar varios equipos a un grupo.
- Un grupo debe poder contener varios equipos.
- No se debe permitir registrar dos veces el mismo equipo dentro del mismo grupo.
- Un equipo no debe quedar asignado simultáneamente a diferentes grupos de la misma fase.
- Se deben poder consultar los equipos que conforman cada grupo.
- La eliminación de un grupo no debe eliminar los equipos registrados en la plataforma.

### HU-GC-05 – Gestionar fases finales

**Historia de usuario:** Como administrador deportivo, quiero gestionar las fases finales de un torneo, para organizar las etapas decisivas de la competencia.

**Criterios de aceptación:**

- El torneo debe existir previamente.
- El sistema debe permitir registrar una fase final dentro de la estructura del torneo.
- Se debe poder consultar la información correspondiente a la fase final.
- Se debe permitir actualizar su información mientras las reglas de la competencia lo permitan.
- Se debe permitir eliminar una fase final cuando no tenga partidos u otra información asociada que lo impida.
- Los partidos correspondientes a esta etapa deben poder identificarse como parte de la fase final.
- La modificación de la fase final no debe afectar la información de las demás fases del torneo.

### HU-GC-06 – Gestionar partidos

**Historia de usuario:** Como administrador deportivo, quiero gestionar los partidos de las diferentes fases de un torneo, para organizar y controlar los encuentros que conforman la competencia.

**Criterios de aceptación:**

- El torneo y la fase correspondiente deben existir previamente.
- El sistema debe permitir registrar un nuevo partido con la información requerida.
- Cada partido debe estar asociado con una fase de la competencia.
- El sistema debe permitir definir los equipos que participarán en el partido.
- No se debe permitir que un equipo compita contra sí mismo.
- Los equipos seleccionados deben encontrarse habilitados para participar en la competencia.
- El sistema debe permitir consultar los partidos registrados.
- Se debe poder consultar la información detallada de cada partido.
- Se debe permitir actualizar la información de un partido cuando su estado lo permita.
- Se debe permitir eliminar un partido cuando no tenga información asociada que lo impida.
- Cuando corresponda, se debe poder asociar el partido con el escenario en el que será disputado.
- Los cambios realizados deben quedar almacenados correctamente.
- Se debe enviar un correo electrónico cuando se cree un partido a los aficionados que han participado en partidos anteriores a los equipos enfrentados

### HU-GC-07 – Gestionar resultados y anotaciones de los partidos

**Historia de usuario:** Como administrador deportivo, quiero gestionar los resultados y las anotaciones realizadas durante un partido, para mantener actualizado el desarrollo de la competencia y conservar el registro de los acontecimientos relevantes del encuentro.

**Criterios de aceptación:**

- El partido debe estar previamente registrado en el sistema.
- El sistema debe permitir registrar el resultado correspondiente a los equipos participantes.
- Solo se deben poder registrar resultados para los equipos que participan en el partido.
- El sistema debe permitir consultar y modificar el resultado del encuentro cuando las reglas de la competencia lo permitan.
- El resultado debe quedar asociado con el partido correspondiente.
- El sistema debe permitir registrar una o varias anotaciones asociadas con el partido.
- Cada anotación debe estar asociada con el jugador que la realizó.
- El jugador seleccionado para una anotación debe pertenecer a uno de los equipos participantes del partido.
- El sistema debe permitir consultar, modificar y eliminar las anotaciones registradas.
- Eliminar una anotación no debe eliminar al jugador ni al partido asociado.
- Las anotaciones deben conservar su relación con el partido y con el jugador correspondiente.
- Cuando se registre una anotación, el sistema debe enviar una notificación a los aficionados que hayan adquirido un boleto para el partido o realizado una apuesta sobre este.
- Al finalizar y registrar el resultado del partido, el sistema debe enviar una notificación con el resumen del encuentro a los aficionados que hayan adquirido un boleto o realizado una apuesta sobre el partido.

### HU-GC-08 – Consultar desarrollo de un torneo

**Historia de usuario:** Como administrador deportivo, quiero consultar la estructura y el desarrollo de un torneo, para conocer de manera centralizada el estado de la competencia.

**Criterios de aceptación:**

- El sistema debe permitir seleccionar un torneo registrado.
- Se debe mostrar la información general del torneo.
- Se deben mostrar las fases que conforman la competencia.
- En las fases de grupos se deben mostrar los grupos y los equipos que los conforman.
  - Si son grupos la tabla de posiciones
  - Si es fase final a manera de llaves
- Se deben mostrar los partidos asociados con cada fase.
- Se debe indicar cuáles partidos tienen resultados registrados y cuáles están pendientes.
- Se deben poder consultar las anotaciones correspondientes a cada partido.
- La información presentada debe corresponder únicamente al torneo seleccionado.

