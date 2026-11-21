# Alcance de Desarrollo - Integrante 1 (Andrés)

## Reglas de alcance y restricciones
- **Repositorio actual (`ms_sport-backend`):** NestJS. Implementar únicamente la capa de backend (entidades, DTOs, servicios, controladores y pruebas).
- **Nombres en código:** usar la traducción del glosario de la skill `modelo-relacional` (Deporte → `Sport`, Equipo → `Team`, EquipoDeporte → `TeamSport`, Torneo → `Tournament`).
- **Regla de interfaz (para referencia de alcance y documentación):**
  - `HU-GD-01` (`Deporte`): **Sin Interfaz (S.I)** — Solo backend. No planificar ni generar componentes visuales para esta entidad; el frontend lo entrega el docente.
  - `HU-GD-02`, `HU-GD-03`, `HU-GC-01` y `HU-GC-08`: **Interfaz Requerida (I.R)** — Requieren backend completo preparado para ser consumido desde el frontend.
- **Modelado de relaciones:**
  - `Deporte` tiene una **autorrelación 1:N** (deporte padre → subdeportes). Un deporte no puede ser su propio padre ni generar ciclos.
  - `EquipoDeporte` debe modelarse como **entidad intermedia explícita** (clase de asociación), no como una relación `@ManyToMany` simple.
  - `Torneo` tiene una relación **N:1 con `Deporte`** (cada torneo pertenece a un deporte registrado).
- **Entidades base compartidas:** `Deporte`, `Equipo` y `Torneo` son la base de la que dependen los integrantes 2 y 3. Priorizar que estén estables y avisar al grupo antes de cambiar sus campos o relaciones.

## Historias asignadas y orden de ejecución
1. **HU-GD-01** – Gestionar deportes, con subdeportes *(Sin dependencias)*
2. **HU-GD-02** – Gestionar equipos *(Sin dependencias)*
3. **HU-GD-03** – Asociar equipos con deportes *(Depende de HU-GD-01 y HU-GD-02)*
4. **HU-GC-01** – Gestionar torneos *(Depende de HU-GD-01)*
5. **HU-GC-08** – Consultar desarrollo de un torneo: tabla de posiciones para fases de grupos y llaves para fase final *(Dejar para el final; depende de las fases, grupos y partidos del integrante 3 y de los resultados y anotaciones de HU-GC-07 del integrante 2)*
