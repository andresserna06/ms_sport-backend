---
name: pruebas-api
description: Pruebas del proyecto - matriz de casos trazada a criterios de aceptación, colección Postman v2.1 ejecutada con Newman, y pruebas unitarias con Jest para mappers y services. Úsala al diseñar, generar, revisar o ejecutar pruebas.
---

# Pruebas de la API

## Tipos de prueba

- **Integración (principal)**: Postman, peticiones reales a la API en ejecución.
  Es la evidencia de entrega y la única forma de probar las entidades sin frontend
  (Deporte, Habilidad, Fase, Grupo).
- **Unitarias**: Jest (`*.spec.ts`) para mappers (obligatorio) y reglas de
  services con lógica no trivial (contratos solapados, tabla de posiciones).

## Matriz de casos

Antes de generar la colección se entrega una matriz y se espera aprobación:

| ID | Historia | Criterio | Endpoint | Escenario | Entrada | HTTP | Aserciones | Variables a guardar |
|---|---|---|---|---|---|---|---|---|

- Cada criterio de aceptación de la historia tiene al menos un caso.
- Cada endpoint cubre lo aplicable: éxito, entrada inválida (400), no existe
  (404), conflicto (409), casos límite de `reglas-dominio`.

Casos límite que no deben faltar en este proyecto:
- Nombre vacío o solo con espacios; nombre duplicado con distinta mayúscula.
- ID no numérico, negativo o inexistente.
- Deporte como su propio padre; ciclo entre subdeportes.
- Contrato con `fechaFin < fechaInicio`; contratos solapados; volver al mismo equipo en otro periodo (debe funcionar).
- Inscribir un equipo que no practica el deporte del torneo; inscribir con inscripciones cerradas.
- Mismo equipo en dos grupos de la misma fase.
- Partido de un equipo contra sí mismo; equipo no inscrito.
- Anotación de un jugador que no pertenece a ninguno de los dos equipos.
- Eliminar entidades con dependencias (debe dar 409 y no borrar nada).

## Colección Postman

- Archivos: `postman/GestionDeportiva.postman_collection.json` (v2.1) y
  `postman/Local.postman_environment.json` (solo `baseUrl` y variables; sin secretos).
- Carpetas por historia (`GD-01 Deportes`, `GC-02 Inscripciones`…), en orden de dependencias.
- El nombre de cada request empieza con el ID del caso de la matriz.
- Cada request tiene `pm.test` que valida al menos el código HTTP y, cuando
  aplique, campos del cuerpo.
- Los IDs creados se guardan con `pm.collectionVariables.set(...)` para los
  requests siguientes.
- Datos únicos por ejecución (sufijo con `Date.now()` en un pre-request) para
  que la colección se pueda correr varias veces sin limpiar la base.
- Autenticación: [PENDIENTE] depende de cómo ms_sports valide el JWT. El login de
  ms_security tiene 2FA por correo, así que la colección no puede hacer login sola:
  el token se pega en la variable `token` del environment y todos los requests lo
  envían en `Authorization: Bearer {{token}}`.
- No crear endpoints solo para pruebas.

Ejecución:

```bash
newman run postman/GestionDeportiva.postman_collection.json -e postman/Local.postman_environment.json
```

## Reporte

- Total de requests, pruebas aprobadas y fallidas.
- Por cada fallo: caso, request, aserción, esperado, recibido y capa probable del problema.
- No modificar código productivo para que una prueba pase; primero se analiza el fallo.
