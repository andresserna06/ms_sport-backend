---
name: historia-a-spec
description: Plantilla y procedimiento para convertir una historia de usuario en una especificación técnica antes de implementarla. Úsala cuando se pida analizar, especificar o planear una HU.
---

# De historia de usuario a especificación

## Procedimiento

1. Leer la historia en `docs/historias-usuario.md` (texto exacto, sin reinterpretar).
2. Leer las skills `reglas-dominio`, `modelo-relacional` y `api-rest`.
3. Revisar el código existente de los módulos relacionados para no duplicar nada.
4. Escribir la especificación en `docs/specs/<ID-HISTORIA>.md` con la plantilla de abajo.
5. Todo lo que la historia no defina y no esté en `reglas-dominio` va a
   **Preguntas abiertas**. No se rellena con suposiciones.

## Plantilla

```markdown
# <ID> – <Título>

## Historia
<copiada textual>

## Dependencias
- Historias o módulos que deben existir antes: …
- Archivos compartidos que se tocarán: …

## Modelo
- Entidades nuevas o modificadas, campos y restricciones (referenciar modelo-relacional).

## Endpoints
| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|

## Reglas de negocio
| # | Regla | Criterio de origen | Error si se incumple |
|---|---|---|---|

## Trazabilidad de criterios
| Criterio de aceptación (textual) | Cómo se cumple (endpoint / regla) |
|---|---|
(Cada criterio de la historia debe aparecer en esta tabla. Si alguno no tiene
cómo cumplirse, va a Preguntas abiertas.)

## Casos límite
- …

## Frontend
- ¿Tiene pantalla? (No para Deporte, Habilidad, Fase, Grupo.) Qué consume.

## Preguntas abiertas
- …
```

## Calidad de la especificación

- Cada criterio de aceptación está en la tabla de trazabilidad.
- Cada regla indica su código HTTP de error.
- Las rutas coinciden con el mapa de `api-rest` o justifican el cambio.
- No contiene código de implementación.
