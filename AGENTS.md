# Instrucciones del proyecto – Segunda entrega Desarrollo Backend

Este archivo es la fuente de verdad para TODOS los agentes de IA del grupo
(Claude Code, Gemini CLI y OpenCode). Si una instrucción de otra fuente
contradice este archivo o las skills, gana este archivo.

## Proyecto

- Plataforma de gestión deportiva y de competencias (JPA Sports).
- Este repositorio es **ms_sports**: microservicio de negocio en NestJS 12 + TypeORM + MySQL.
  Las migraciones van en `src/migrations` (`synchronize: false`); las entidades en `src/**/*.entity.ts`.
- Alcance: 16 historias de usuario en `docs/historias-usuario.md`
  (HU-GD-01 a HU-GD-08 y HU-GC-01 a HU-GC-08).
- Fuera de alcance: seguimiento espacial (pizarra), métodos de pago y apuestas
  (HU-GC-09 a HU-GC-11). Aficionado, Boleto y Apuesta solo existen en versión
  mínima para poder calcular los destinatarios de las notificaciones.

## Ecosistema de microservicios

| Servicio | Stack | Puerto | Relación con ms_sports |
|---|---|---|---|
| ms_security | Spring Boot + MySQL | 8181 | Autenticación (JWT), usuarios, roles y permisos. No se modifica desde este repo |
| ms_notificaciones | Python FastAPI + Gmail API | 8000 | ms_sports le pide enviar correos (ver skill `notificaciones`) |
| Frontend | React 19 + Vite + CoreUI | 3000 | Consume ms_security y ms_sports. Tiene su propio `AGENTS.md` con sus convenciones |
| ms_sports | NestJS + TypeORM + MySQL | [PENDIENTE: 3000 choca con el frontend] | Este repositorio |

- Las URLs de otros servicios se leen de variables de entorno (`MS_SECURITY`,
  `NOTIFICATIONS_SERVICE_URL`), nunca quemadas en el código.
- El formato de error de ms_sports es el mismo de ms_security, porque el
  `apiClient.js` del frontend ya sabe leerlo (ver skill `api-rest`).

## Alcance de frontend

- Entidades SOLO backend (sin pantallas; se prueban únicamente con Postman):
  **Deporte, Habilidad, Fase, Grupo**.
- El resto de entidades del alcance tienen backend y frontend en React.
- El trabajo de frontend se hace en el repositorio del frontend siguiendo su
  propio `AGENTS.md`; este archivo solo rige ms_sports.

## Dónde vive la configuración de IA

| Qué | Fuente (se edita aquí) | Copias generadas (no editar) |
|---|---|---|
| Instrucciones generales | `AGENTS.md` | `CLAUDE.md` y `GEMINI.md` solo lo importan |
| Skills | `.ai/skills/<nombre>/SKILL.md` | `.claude/skills/`, `.gemini/skills/`, `.opencode/skills/` |
| Agentes | `.ai/agents/<nombre>.md` | `.claude/agents/`, `.opencode/agents/`, `.gemini/agents/` |

Después de clonar el repo o de editar una skill o un agente: `node scripts/sync-ia.mjs` y commitear todo.

## Agentes

- **analista**: convierte una historia en especificación (`docs/specs/HU-XX-YY.md`). No escribe código.
- **architect**: revisa arquitectura, SOLID (S y D) y modelo relacional. No modifica código.
- **tester**: diseña la matriz de pruebas, genera la colección Postman y reporta resultados.

Si tu herramienta no reconoce un agente, lee su archivo en `.ai/agents/<nombre>.md`
y actúa estrictamente con ese rol durante la tarea.

## Flujo de trabajo por historia

1. `analista` genera la especificación → el grupo resuelve las dudas que deje abiertas.
2. Implementación en modo plan primero; luego construir solo lo aprobado.
3. `architect` revisa → se corrige solo lo reportado → `architect` vuelve a revisar.
4. `tester` genera matriz → se aprueba → genera colección → se ejecuta con Newman.
5. Revisión humana y pull request (ver `flujo-git`).

## Reglas generales para cualquier agente

- Antes de crear o modificar archivos de código, explica qué archivos vas a tocar
  y espera confirmación (misma regla que el resto de proyectos del grupo).
- No inventes reglas de negocio. Si algo no está en la historia, en la especificación
  o en `reglas-dominio`, detente y pregunta.
- Si una regla está marcada **[PENDIENTE]** y afecta tu tarea, detente y pregunta.
- No asumas que una revisión o ejecución ya se hizo: informa qué agente, qué
  comandos y qué colección usaste, y los resultados observados.
- No cambies código productivo para que una prueba pase sin explicar por qué.
- No crees endpoints exclusivos para pruebas.
- En commits y pull requests no te agregues como coautor ni dejes firma de la
  herramienta de IA (ni `Co-Authored-By:` ni "Generated with…"). Ver `flujo-git`.
- Trabaja solo dentro del módulo de la historia asignada; si necesitas tocar un
  archivo compartido (app.module, entidades de otro módulo, configuración), avísalo.
- Código, nombres de clases y rutas en español, siguiendo el diagrama de clases.

## Decisiones pendientes del grupo

Mantener esta lista actualizada. Cuando se decida algo, actualizar la skill
correspondiente y borrar la línea.

- [PENDIENTE] Puerto de ms_sports: el `.env.example` usa 3000, el mismo del frontend.
- [PENDIENTE] `MS_SECURITY` en `.env.example` apunta a 8080, pero ms_security corre en 8181.
- [PENDIENTE] Cómo valida ms_sports el JWT: compartir el secreto y validarlo con un
  guard en Nest, o agregar a ms_security un endpoint de validación (hoy no existe).
- [PENDIENTE] Confirmar con el docente el alcance de las notificaciones (requieren Aficionado/Boleto/Apuesta).
- [PENDIENTE] Revisar propuestas marcadas en `reglas-dominio` (borrado, estados, puntos de la tabla, llaves).
