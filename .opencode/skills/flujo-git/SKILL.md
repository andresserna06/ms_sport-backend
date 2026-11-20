---
name: flujo-git
description: Flujo de trabajo en Git del grupo - ramas por historia, mensajes de commit y revisión obligatoria antes de hacer commit y push. Úsala al crear ramas, hacer commits o hacer push.
---

# Flujo de Git

Mismas convenciones que el grupo ya usa en ms_security y el frontend.

## Ramas

- `main`: rama estable del proyecto.
- Una rama por historia o módulo desde `main`: `feature/<modulo>`
  (ej. `feature/sports`, `feature/registrations`). Si una historia toca varios
  módulos, la rama lleva el nombre de la historia: `feature/gc-07-match-results`.
- Cambios a la configuración de IA (AGENTS.md, skills, agentes): `chore/ia-<descripcion>`.

## Commits

Conventional Commits con la descripción en inglés: `<tipo>(<scope>): <descripción>`

Tipos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`. El scope es el módulo.

Ejemplos: `feat(contracts): validate overlapping contracts`,
`test(registrations): add closed registration cases`.

Commits pequeños; no mezclar dos historias en un commit.

**Autoría:** los commits son del integrante que los hace.
Ningún agente se agrega como coautor ni deja firma: nada de líneas
`Co-Authored-By:`, "Generated with…", "🤖" ni enlaces a la herramienta de IA,
en ninguna parte del mensaje del commit.

## Archivos compartidos

`app.module.ts`, configuración global, entidades de otros módulos y las
skills: antes de modificarlos, avisar al grupo; cambios en commits separados
para que los conflictos sean fáciles de resolver.

## Antes de hacer commit y push

El agente **nunca** hace commit ni push por su cuenta. Primero:

1. Muestra la lista de archivos que se van a incluir y un resumen de los cambios.
2. Verifica que el código compile (`npm run build`) y que las pruebas Jest pasen (`npm run test`).
3. Si la historia ya tiene colección Postman, indica si se ejecutó con Newman y su resultado.
4. Confirma que no se incluyen `.env`, credenciales, `node_modules` ni `dist`.
5. Propone el mensaje del commit siguiendo el formato de arriba.
6. **Espera la aprobación del integrante** antes de hacer el commit, y otra vez antes del push.

Si algo de los puntos 2 a 4 falla, lo reporta y no continúa.

## Prohibido

- Commitear `.env`, credenciales o tokens.
- Editar las copias generadas en `.claude/`, `.gemini/` u `.opencode/`: se edita
  `.ai/skills/` o `.ai/agents/` y se ejecuta `node scripts/sync-ia.mjs`.
