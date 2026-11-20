#!/usr/bin/env node
// Sincroniza la configuración de IA del grupo para Claude Code, Gemini CLI y OpenCode.
//
// Fuentes (las ÚNICAS que se editan a mano):
//   - AGENTS.md                 instrucciones generales
//   - .ai/skills/<n>/SKILL.md   skills en formato estándar
//   - .ai/agents/<n>.md         agentes en formato neutral
//
// Generado por este script (no editar a mano):
//   - .claude/skills/           copia de las skills para Claude Code
//   - .gemini/skills/           copia de las skills para Gemini CLI
//   - .opencode/skills/         copia de las skills para OpenCode
//   - .claude/agents/<n>.md     agentes para Claude Code
//   - .opencode/agents/<n>.md   agentes para OpenCode
//   - .gemini/agents/<n>.md     agentes para Gemini CLI
//
// Uso: node scripts/sync-ia.mjs   (desde la raíz del repositorio)

import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const dirSkills = path.join(raiz, '.ai', 'skills');
const dirAgentes = path.join(raiz, '.ai', 'agents');
const AVISO = '<!-- GENERADO por scripts/sync-ia.mjs a partir de .ai/agents/. No editar este archivo. -->';

function leerFrontmatter(texto, archivo) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${archivo}: falta el frontmatter (--- ... ---)`);
  const datos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const kv = linea.match(/^(\w+):\s*(.*)$/);
    if (kv) datos[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  for (const campo of ['name', 'description']) {
    if (!datos[campo]) throw new Error(`${archivo}: falta "${campo}" en el frontmatter`);
  }
  return { datos, cuerpo: m[2].trimStart() };
}

const yaml = (v) => JSON.stringify(v); // cadena YAML segura

function limpiarGenerados(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const ruta = path.join(dir, f);
    if (f.endsWith('.md') && fs.readFileSync(ruta, 'utf8').includes(AVISO)) fs.rmSync(ruta);
  }
}

// ---------- Skills: .ai/skills -> .claude, .gemini y .opencode ----------
if (!fs.existsSync(dirSkills)) throw new Error('No existe .ai/skills');
const skills = fs.readdirSync(dirSkills).filter((d) =>
  fs.existsSync(path.join(dirSkills, d, 'SKILL.md')));
for (const s of skills) {
  const { datos } = leerFrontmatter(fs.readFileSync(path.join(dirSkills, s, 'SKILL.md'), 'utf8'), `skill ${s}`);
  if (datos.name !== s) throw new Error(`skill ${s}: "name" (${datos.name}) debe ser igual al nombre de la carpeta`);
}
for (const destino of ['.claude', '.gemini', '.opencode'].map((h) => path.join(raiz, h, 'skills'))) {
  fs.rmSync(destino, { recursive: true, force: true });
  for (const s of skills) fs.cpSync(path.join(dirSkills, s), path.join(destino, s), { recursive: true });
}

// ---------- Agentes: .ai/agents -> cada herramienta ----------
const destinos = {
  claude: path.join(raiz, '.claude', 'agents'),
  opencode: path.join(raiz, '.opencode', 'agents'),
  gemini: path.join(raiz, '.gemini', 'agents'),
};
for (const d of Object.values(destinos)) { fs.mkdirSync(d, { recursive: true }); limpiarGenerados(d); }

const agentes = fs.readdirSync(dirAgentes).filter((f) => f.endsWith('.md'));
for (const archivo of agentes) {
  const { datos, cuerpo } = leerFrontmatter(fs.readFileSync(path.join(dirAgentes, archivo), 'utf8'), archivo);
  const soloLectura = datos.readonly === 'true';
  const nombre = datos.name;

  // Claude Code: .claude/agents/<n>.md
  const claude = ['---', `name: ${nombre}`, `description: ${yaml(datos.description)}`];
  if (soloLectura) claude.push('tools: Read, Grep, Glob');
  claude.push('---', AVISO, '', cuerpo);
  fs.writeFileSync(path.join(destinos.claude, `${nombre}.md`), claude.join('\n'));

  // OpenCode: .opencode/agents/<n>.md
  const opencode = ['---', `description: ${yaml(datos.description)}`, 'mode: subagent'];
  if (soloLectura) opencode.push('permission:', '  edit: deny', '  bash: deny');
  opencode.push('---', AVISO, '', cuerpo);
  fs.writeFileSync(path.join(destinos.opencode, `${nombre}.md`), opencode.join('\n'));

  // Gemini CLI: .gemini/agents/<n>.md
  const gemini = ['---', `name: ${nombre}`, `description: ${yaml(datos.description)}`, '---', AVISO, '', cuerpo];
  fs.writeFileSync(path.join(destinos.gemini, `${nombre}.md`), gemini.join('\n'));
}

console.log(`Skills sincronizadas: ${skills.length} x 3 herramientas (${skills.join(', ')})`);
console.log(`Agentes generados:    ${agentes.length} x 3 herramientas`);
