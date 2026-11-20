---
name: flujo-git
description: Flujo de trabajo en Git del grupo - ramas por historia, mensajes de commit y requisitos para pull requests. Úsala al crear ramas, hacer commits o preparar un pull request.
---

# Flujo de Git

Mismas convenciones que el grupo ya usa en ms_security y el frontend.

## Ramas

- `main`: estable, solo recibe merges revisados.
- Una rama por historia o módulo desde `main`: `feature/<modulo>`
  (ej. `feature/deportes`, `feature/inscripciones`). Si una historia toca varios
  módulos, la rama lleva el nombre de la historia: `feature/gc-07-resultados`.
- Cambios a la configuración de IA (AGENTS.md, skills, agentes): `chore/ia-<descripcion>`.

## Commits

Conventional Commits con la descripción en inglés: `<tipo>(<scope>): <descripción>`

Tipos: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`. El scope es el módulo.

Ejemplos: `feat(contratos): validate overlapping contracts`,
`test(inscripciones): add closed registration cases`.

Commits pequeños; no mezclar dos historias en un commit.

**Autoría:** los commits y los pull requests son del integrante que los hace.
Ningún agente se agrega como coautor ni deja firma: nada de líneas
`Co-Authored-By:`, "Generated with…", "🤖" ni enlaces a la herramienta de IA,
ni en el mensaje del commit ni en la descripción del PR.

## Archivos compartidos

`app.module.ts`, configuración global, entidades de otros módulos y las
skills: antes de modificarlos, avisar al grupo; cambios en commits separados
para que los conflictos sean fáciles de resolver.

## Antes de abrir un pull request

1. Especificación de la historia en `docs/specs/`.
2. Reporte del agente `architect` sin incumplimientos pendientes (o justificados).
3. Colección Postman de la historia ejecutada con Newman, todo en verde.
4. Pruebas Jest pasando.
5. La descripción del PR enlaza la especificación e incluye el resumen de Newman.
6. Lo revisa otro integrante del grupo, no quien lo escribió.

## Prohibido

- Commitear `.env`, credenciales o tokens.
- Editar las copias generadas en `.claude/`, `.gemini/` u `.opencode/`: se edita
  `.ai/skills/` o `.ai/agents/` y se ejecuta `node scripts/sync-ia.mjs`.
