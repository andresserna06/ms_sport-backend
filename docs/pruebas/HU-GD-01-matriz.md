# HU-GD-01 – Gestionar deportes: matriz de pruebas

Estado: **APROBADA y EJECUTADA** (ver sección 8). Colección: `postman/MsSports.postman_collection.json`; environment: `postman/Local.postman_environment.json`. Las decisiones del usuario están en la sección 7.

Fuentes: `docs/specs/HU-GD-01.md` (reglas R1..R13 y "Decisiones del grupo"), `docs/historias-usuario.md`, skills `pruebas-api`, `api-rest` y `reglas-dominio`. Entorno: API en `http://localhost:3001`, MySQL 8.0.46, base `sports_db`, sin autenticación (P14).

## 1. Convenciones de la matriz

- **Criterios de aceptación** (`CA1..CA9`, en el orden de la historia):
  CA1 registrar · CA2 validar obligatorios · CA3 sin duplicados · CA4 listado · CA5 detalle · CA6 actualizar · CA7 eliminar o desactivar · CA8 informar dependencias · CA9 cambios almacenados.
- **Tipo**: `positivo` (camino feliz), `negativo` (entrada o estado inválido que debe rechazarse), `borde` (límite, normalización o caso límite de la spec).
- `N("x")` = nombre `QA{runId} x`, donde `runId` es `Date.now()` generado en el pre-request. Con ese prefijo los nombres son únicos por corrida y no chocan con corridas anteriores.
- **Datos de apoyo** (se crean por API en el propio caso o en su carpeta, nunca se reutilizan entre carpetas que modifican datos):
  `R` = deporte raíz activo nuevo · `H` = subdeporte activo de `R` · `Hi` = subdeporte inactivo de `R` · `Ri` = raíz inactiva.
- **Errores de negocio**: cuerpo `{ "errorCase": "...", "message": "..." }` (solo esas dos claves). **Errores de validación**: objeto plano `{ "<campo>": "<mensaje>" }` en español, sin `errorCase`.
- Un `†` junto a un texto significa que el texto exacto sale del código (DTO o service) y la spec solo dice "mensaje en español". Ver decisión Q4: por defecto se afirma la clave y que el texto no esté vacío, y el texto exacto solo en los marcados `†`.
- Todas las escrituras (POST, PUT, PATCH) con éxito se verifican con un `GET /sports/:id` posterior (CA9, R12). Los casos de escritura rechazada verifican que el estado previo no cambió.
- Ningún caso envía `Authorization` (P14). Cuando se defina el JWT habrá que agregar casos 401/403 y el header a todos.

## 2. Estrategia de datos y limpieza

### 2.1 Independencia

- Cada carpeta de la colección empieza con requests de preparación (`setup`) que crean sus propios deportes y guardan los ids en variables de colección. Ningún caso depende del resultado de un caso de otra carpeta; dentro de una carpeta el orden importa solo entre `setup` y los casos que lo usan, y se declara en la columna Precondición.
- Los ids "inexistentes" son `2147483647` (máximo INT, nunca asignado en una base de desarrollo) y `abc`, no un número cercano a los ids reales.

### 2.2 Limpieza de la base `sports_db` (desarrollo, hoy vacía)

1. **Re-ejecutable sin limpiar**: nombres con prefijo `QA{runId}`; la colección se puede correr varias veces seguidas.
2. **Carpeta final `99 Cleanup`**: borra por API (`DELETE`) todo lo que la corrida creó, primero subdeportes y luego raíces, usando la lista de ids guardada en una variable. Los deportes de `E-10..E-12` (con dependencias) no se pueden borrar por API; los limpia el paso 3.
3. **Script de fixtures** `postman/fixtures/` (se crea en la fase de colección): `seed` (ver 2.3) y `teardown`, que borra por SQL, en orden de FK, `team_sports` → `tournaments` → `teams` → `sports` (hijos antes que padres) **solo de filas con prefijo `QA`** y **se niega a correr si `DB_NAME` no es `sports_db`**.
4. **Reset total opcional** (a pedido del usuario): `DELETE FROM sports WHERE parent_sport_id IS NOT NULL; DELETE FROM sports;`. No se usa `TRUNCATE` ni se tocan las demás tablas.

### 2.3 Precondiciones de equipos y torneos asociados (E-10, E-11, E-12) – DECISIÓN Q1 = opción A (aprobada)

Hoy no se pueden crear por API (`POST /teams/:id/sports` es HU-GD-03 y `POST /tournaments` con deporte es HU-GC-01; `Tournament.sport_id` quedó nullable sin DTO que lo reciba). Opciones:

| Opción | Qué implica | Pros / contras |
|---|---|---|
| **A (recomendada)** | Script `postman/fixtures/seed.mjs` (Node + `mysql2`, que ya es dependencia transitiva del proyecto; la CLI `mysql` no está en el PATH) que se ejecuta **antes** de Newman y crea por SQL: 3 deportes con nombres reservados `QA-FIX-EQUIPO`, `QA-FIX-TORNEO`, `QA-FIX-MIXTO`; 1 fila en `teams` (o 1 por `POST /teams`, que ya existe), 1 en `team_sports` y 3 en `tournaments` (`name`, `start_date`, `enrollment_deadline`, `sport_id`). La colección los localiza por `GET /sports?all=true&name=QA-FIX` y no necesita conocer ids. | Cubre CA8 completo (equipos y torneos reales, contados por el service, no mocks). Frágil si HU-GD-03 o HU-GC-01 cambian columnas de `team_sports`/`tournaments`; cuando existan esas historias el seed se reemplaza por llamadas a la API. Escribe directamente en tablas de otros módulos (solo en la base de desarrollo). |
| B | Marcar E-10, E-11, E-12 como **bloqueadas** hasta HU-GD-03 y HU-GC-01. | Cero dependencia de SQL. CA8 queda cubierto solo para subdeportes (E-05, E-06) y las dos dependencias restantes sin evidencia de integración; la spec ya reconoce esta trazabilidad parcial. |

Decisión aprobada: opción A. Implementada en `postman/fixtures/seed.mjs` y `postman/fixtures/teardown.mjs` (ver sección 8 para los comandos).

### 2.4 Acentos y UTF-8 en Windows

- Git Bash corrompe los acentos en argumentos de línea de comandos. Todo cuerpo con acentos, `ñ` o emoji va en archivos **JSON UTF-8 sin BOM** en `postman/data/` y se envía con `curl --data-binary @archivo.json` (nunca `-d '{"name":"Fútbol"}'`).
- Para Newman: la colección se guarda UTF-8 sin BOM y los cuerpos con acentos viven dentro del JSON de la colección (no se pasan por `--env-var` ni `--global-var`). Los datos variables van en el environment (`-e`) o `--iteration-data` (archivo), no en argumentos. Ejecutar desde una terminal en UTF-8 (`chcp 65001`) y usar `--reporter-cli-no-banner`/reporter `json` para evidenciar los textos con acentos.
- `newman` no está instalado en el equipo (no está en el PATH ni en `node_modules/.bin`): se ejecutará con `npx newman` (o `npm i -g newman`). Se confirmará en la fase de ejecución.

## 3. Casos

### 3.1 `POST /sports` – registrar (CA1, CA2, CA3)

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Cuerpo / parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| C-01 | CA1, R1, R2, R12 | Registrar raíz con nombre y descripción | POST `/sports` | ninguna | `{name:N("Baloncesto"), description:"Deporte de equipo"}` | 201 | `id` entero >0, `name`, `description`, `active:true`, `parentSportId:null`, `parentSport:null`, `subSportsCount:0`. Luego `GET /sports/:id` devuelve lo mismo | positivo |
| C-02 | CA1, R2 | Registrar solo con `name` (descripción opcional, P2) | POST `/sports` | ninguna | `{name:N("Ajedrez")}` | 201 | `description:null`, `active:true` | positivo |
| C-03 | CA1, R4 | Registrar subdeporte bajo una raíz | POST `/sports` | `R` | `{name:N("Futbol de salon"), parentSportId:R.id}` | 201 | `parentSportId:R.id`, `parentSport:{id:R.id,name:R.name}`; `GET /sports/R.id` muestra `subSportsCount:1` | positivo |
| C-04 | R1 | Trim del nombre con acentos (archivo UTF-8) | POST `/sports` | ninguna | `{name:"  QA{runId} Fútbol de salón ñandú  "}` | 201 | `name` sin espacios, acentos y `ñ` intactos; `GET` devuelve el mismo texto | borde |
| C-05 | R1 | Nombre de exactamente 120 caracteres | POST `/sports` | ninguna | `name` de 120 caracteres (prefijo `QA{runId}` + relleno) | 201 | `name.length == 120` | borde |
| C-06 | R1 | 120 caracteres rodeados de espacios (el trim va antes de validar) | POST `/sports` | ninguna | `"  " + name120 + "  "` | 201 | `name.length == 120`, sin espacios | borde |
| C-07 | R2 | Descripción de exactamente 500 caracteres | POST `/sports` | ninguna | `description` de 500 caracteres | 201 | `description.length == 500` | borde |
| C-08 | R2 (ver D4) | Descripción con espacios alrededor | POST `/sports` | ninguna | `{name:N("Natacion"), description:"  Texto  "}` | 201 | `description:"Texto"` (la spec solo define trim para `name`; el DTO también recorta `description`) | borde |
| C-09 | R2 (ver D4) | Descripción vacía o solo espacios | POST `/sports` | ninguna | `{name:N("Tenis"), description:"   "}` | 201 | `description:null` (el mapper convierte vacío en null). Comportamiento no definido en la spec | borde |
| C-10 | R4 | `parentSportId:null` explícito crea raíz | POST `/sports` | ninguna | `{name:N("Golf"), parentSportId:null}` | 201 | `parentSportId:null`, `parentSport:null` | borde |
| C-11 | R1 | Nombre con emoji (utf8mb4) | POST `/sports` | ninguna | `{name:"QA{runId} ⚽ Fútbol"}` (archivo UTF-8) | 201 | `name` idéntico al enviado; `GET` igual | borde |
| C-12 | R1 | Texto con comillas/SQL se guarda literal (no inyección) | POST `/sports` | ninguna | `{name:"QA{runId} x'; DROP TABLE sports;--"}` | 201 | `name` literal; luego `GET /sports?all=true` responde 200 (la tabla sigue existiendo) | borde |
| C-13 | CA2, R1 | Cuerpo vacío `{}` | POST `/sports` | ninguna | `{}` | 400 | objeto plano con clave `name` ("El nombre es obligatorio" †); sin `errorCase` | negativo |
| C-14 | CA2, R1 | `name` cadena vacía | POST `/sports` | ninguna | `{name:""}` | 400 | clave `name` | negativo |
| C-15 | CA2, R1 | `name` solo espacios | POST `/sports` | ninguna | `{name:"     "}` | 400 | clave `name`; no se creó el deporte (listado con `all=true` no lo contiene) | negativo |
| C-16 | CA2, R1 | `name: null` | POST `/sports` | ninguna | `{name:null}` | 400 | clave `name` | negativo |
| C-17 | CA2, R1 | `name` no es texto | POST `/sports` | ninguna | `{name:123}` | 400 | clave `name` ("El nombre debe ser un texto" †) | negativo |
| C-18 | CA2, R1 | `name` de 121 caracteres | POST `/sports` | ninguna | `name` de 121 caracteres | 400 | clave `name` ("El nombre no puede superar los 120 caracteres" †) | negativo |
| C-19 | CA2, R2 | `description` de 501 caracteres | POST `/sports` | ninguna | `{name:N("Rugby"), description:<501>}` | 400 | clave `description`; no se creó | negativo |
| C-20 | CA2, R2 | `description` no es texto | POST `/sports` | ninguna | `{name:N("Rugby"), description:123}` | 400 | clave `description` | negativo |
| C-21 | CA2, R4 | `parentSportId` no numérico | POST `/sports` | ninguna | `{name:N("Polo"), parentSportId:"abc"}` | 400 | clave `parentSportId` ("El deporte padre debe ser un número entero" †) | negativo |
| C-22 | CA2, R4 | `parentSportId` decimal | POST `/sports` | ninguna | `{..., parentSportId:1.5}` | 400 | clave `parentSportId` | negativo |
| C-23 | CA2, R4 | `parentSportId` cero | POST `/sports` | ninguna | `{..., parentSportId:0}` | 400 | clave `parentSportId` ("…id válido" †) | negativo |
| C-24 | CA2, R4 | `parentSportId` negativo | POST `/sports` | ninguna | `{..., parentSportId:-1}` | 400 | clave `parentSportId` | negativo |
| C-25 | CA2, R4 | Varios errores a la vez | POST `/sports` | ninguna | `{name:"", description:<501>, parentSportId:"x"}` | 400 | el objeto trae las tres claves `name`, `description`, `parentSportId` (un mensaje por campo) | negativo |
| C-26 | CA2, R4 | Padre inexistente | POST `/sports` | ninguna | `{name:N("Hockey"), parentSportId:2147483647}` | 404 | `errorCase:"NOT_FOUND"`, `message` menciona el id | negativo |
| C-27 | CA2 | Campo no permitido `active` (el estado solo cambia con activate/deactivate) | POST `/sports` | ninguna | `{name:N("Pesas"), active:false}` | 400 | objeto plano con clave `active` (texto por definir, D11); no se creó | negativo |
| C-28 | CA2 | Campo no permitido `id` | POST `/sports` | ninguna | `{name:N("Pesas2"), id:99}` | 400 | objeto plano con clave `id` | negativo |
| C-29 | CA2 | JSON malformado | POST `/sports` | ninguna | cuerpo `{"name":` | 400 | status 400 (nunca 500); cuerpo con `errorCase`/`message` o similar | negativo |
| C-30 | CA3, R3 | Nombre duplicado exacto | POST `/sports` | `R` con nombre `X` | `{name:X}` | 409 | `errorCase:"ALREADY_EXISTS"`, `message` contiene "Ya existe un deporte con el nombre" y `X` | negativo |
| C-31 | CA3, R3 | Duplicado con distinta capitalización | POST `/sports` | `R` con `N("Voleibol")` | `{name:"qa{runId} VOLEIBOL"}` | 409 | `ALREADY_EXISTS` | negativo |
| C-32 | CA3, R3 (P4) | Duplicado sin distinguir acentos | POST `/sports` | deporte `QA{runId} Fútbol` | `{name:"qa{runId} FUTBOL"}` (archivo UTF-8) | 409 | `ALREADY_EXISTS` | negativo |
| C-33 | CA3, R1, R3 | Duplicado tras trim | POST `/sports` | `R` con nombre `X` | `{name:"   X   "}` | 409 | `ALREADY_EXISTS` | negativo |
| C-34 | CA3, R3 (P3) | La unicidad es global: mismo nombre bajo otro padre | POST `/sports` | `R`, `H` con nombre `X` | `{name:X, parentSportId:<otra raíz>}` | 409 | `ALREADY_EXISTS` | negativo |
| C-35 | CA3, CA9, R12 | Un rechazo por duplicado no deja filas | GET `/sports` | tras C-30 | `?all=true&name=<X>` | 200 | arreglo con exactamente 1 elemento | negativo |
| C-36 | R10 | Padre inactivo | POST `/sports` | `Ri` | `{name:N("Hijo de inactivo"), parentSportId:Ri.id}` | 409 | `errorCase:"INVALID_STATE"`; no se creó | negativo |
| C-37 | R13 | Padre que ya es subdeporte (segundo nivel) | POST `/sports` | `R`, `H` | `{name:N("Nieto"), parentSportId:H.id}` | 400 | `errorCase:"INVALID_OPERATION"`, `message` indica que `H` ya es subdeporte | negativo |

### 3.2 `GET /sports` – listado (CA4)

Precondición común de la carpeta: `La` (raíz activa), `Lb` (raíz activa), `Lh` (subdeporte activo de `La`), `Li` (raíz inactiva), todos con prefijo `QA{runId}`; los casos filtran por `name=QA{runId}` para no depender de otros datos.

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| L-01 | CA4, R7 | Por defecto solo activos (incluye subdeportes) | GET `/sports` | `La, Lb, Lh, Li` | `?name=QA{runId}` | 200 | arreglo; contiene `La, Lb, Lh`; no contiene `Li`; cada elemento trae `id, name, description, active:true, parentSportId, parentSport` | positivo |
| L-02 | R7 | `active=false` devuelve solo inactivos | GET `/sports` | ídem | `?name=QA{runId}&active=false` | 200 | contiene `Li`; ningún elemento con `active:true` | positivo |
| L-03 | R7 | `all=true` devuelve todos | GET `/sports` | ídem | `?name=QA{runId}&all=true` | 200 | contiene `La, Lb, Lh, Li` | positivo |
| L-04 | R7 | `active=true` explícito | GET `/sports` | ídem | `?name=QA{runId}&active=true` | 200 | igual a L-01 | positivo |
| L-05 | CA4 | Filtro `name` parcial, sin distinguir mayúsculas | GET `/sports` | `La` llamada `QA{runId} Atletismo` | `?name=atletis` | 200 | contiene `La` | positivo |
| L-06 | CA4 | Filtro `parentSportId` devuelve hijos directos | GET `/sports` | `La, Lh` | `?parentSportId=La.id` | 200 | solo `Lh`; todos con `parentSportId == La.id` | positivo |
| L-07 | CA4 | `name` + `parentSportId` + `all` combinados | GET `/sports` | ídem | `?name=QA{runId}&parentSportId=La.id&all=true` | 200 | solo hijos de `La` cuyo nombre coincide | positivo |
| L-08 | CA4 | Sin coincidencias | GET `/sports` | ninguna | `?name=zzz-no-existe-{runId}` | 200 | `[]` (no 404) | borde |
| L-09 | CA4 | `parentSportId` válido sin hijos | GET `/sports` | `Lb` | `?parentSportId=Lb.id` | 200 | `[]` | borde |
| L-10 | CA4 | Comillas en el filtro (no 500) | GET `/sports` | ninguna | `?name=a'b";--` | 200 | arreglo (vacío) | borde |
| L-11 | CA4 (D8) | `all=true` junto con `active=false` | GET `/sports` | ídem L-01 | `?name=QA{runId}&all=true&active=false` | 200 | Esperado: `all` prevalece y devuelve todos. **Combinación no definida en la spec** (R7 dice "o"); pendiente D8 | borde |
| L-12 | CA4 (D8) | `name` solo espacios | GET `/sports` | ídem | `?name=%20%20%20` | 200 | Esperado: se ignora el filtro (devuelve los activos). **No definido**; pendiente D8 | borde |
| L-13 | CA4 (D8) | `name` con comodín `%` o `_` | GET `/sports` | ninguna | `?name=%25` | 200 | Esperado: tratado como texto literal (no devuelve todo). **No definido**; pendiente D8 | borde |
| L-14 | CA4 | `active` no booleano | GET `/sports` | ninguna | `?active=maybe` | 400 | objeto plano clave `active` ("…debe ser true o false" †) | negativo |
| L-15 | CA4 | `all` no booleano | GET `/sports` | ninguna | `?all=xyz` | 400 | clave `all` | negativo |
| L-16 | CA4 | `parentSportId` no numérico | GET `/sports` | ninguna | `?parentSportId=abc` | 400 | clave `parentSportId` | negativo |
| L-17 | CA4 | `parentSportId` cero | GET `/sports` | ninguna | `?parentSportId=0` | 400 | clave `parentSportId` | negativo |
| L-18 | CA4 | Parámetro desconocido | GET `/sports` | ninguna | `?foo=1` | 400 | objeto plano clave `foo` | negativo |
| L-19 | CA4 | Valor repetido | GET `/sports` | ninguna | `?name=a&name=b` | 400 | clave `name` | negativo |
| L-20 | CA4 | `name` de 121 caracteres | GET `/sports` | ninguna | `?name=<121 caracteres>` | 400 | clave `name` | negativo |

### 3.3 `GET /sports/:id` – detalle (CA5)

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| G-01 | CA5 | Detalle de raíz con 2 subdeportes | GET `/sports/:id` | `R`, `H1`, `H2` | `id=R.id` | 200 | todos los campos; `parentSport:null`; `subSportsCount:2` | positivo |
| G-02 | CA5, R4 | Detalle de subdeporte | GET `/sports/:id` | `R`, `H` | `id=H.id` | 200 | `parentSportId:R.id`, `parentSport:{id,name}` de `R`; `subSportsCount:0` | positivo |
| G-03 | CA5, R7 | Un deporte inactivo se puede consultar | GET `/sports/:id` | `Ri` | `id=Ri.id` | 200 | `active:false` | positivo |
| G-04 | CA5 | Id inexistente | GET `/sports/:id` | ninguna | `id=2147483647` | 404 | `NOT_FOUND`, `message` "No existe el deporte con id 2147483647" † | negativo |
| G-05 | CA5, R11 | Id no numérico | GET `/sports/:id` | ninguna | `id=abc` | 400 | `INVALID_OPERATION`, "El id debe ser un número entero" † | negativo |
| G-06 | R11 | Id mezcla número y texto | GET `/sports/:id` | ninguna | `id=12abc` | 400 | `INVALID_OPERATION` | negativo |
| G-07 | R11 | Id decimal | GET `/sports/:id` | ninguna | `id=1.5` | 400 | `INVALID_OPERATION` | negativo |
| G-08 | R11 (D2) | Id en notación exponencial | GET `/sports/:id` | ninguna | `id=1e2` | 400 | `INVALID_OPERATION` (D2, CORREGIDO: antes respondía 404 interpretando `1e2` como 100) | negativo |
| G-12 | R11 (D2) | Id hexadecimal | GET `/sports/:id` | ninguna | `id=0x10` | 400 | `INVALID_OPERATION` (D2, CORREGIDO) | negativo |
| G-09 | R11 (D3) | Id negativo | GET `/sports/:id` | ninguna | `id=-1` | 404 | `NOT_FOUND` (la spec no define 400 vs 404; observado 404, ver D3) | borde |
| G-10 | R11 (D3) | Id cero | GET `/sports/:id` | ninguna | `id=0` | 404 | `NOT_FOUND` (idem) | borde |
| G-11 | R11 | Id fuera del rango INT | GET `/sports/:id` | ninguna | `id=99999999999` | 404 | `NOT_FOUND`, nunca 500 (la spec admite 400 o 404; se fija 404 por D3) | borde |

### 3.4 `GET /sports/:id/subsports` – subdeportes (CA4)

Nota (D1, CORREGIDO en el código): el endpoint aplica `?active` (por defecto solo activos) y `?all`, y responde 400 si `active` no es booleano o llega un parámetro desconocido. B-01, B-03 y B-07 se esperan en verde; se agregó B-08 (parámetro desconocido).

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| B-01 | CA4, R7 (D1) | Por defecto solo subdeportes activos | GET `/sports/:id/subsports` | `R`, `H` activo, `Hi` inactivo, otra raíz `R2` con su hijo | `id=R.id` | 200 | solo `H`; todos con `parentSportId == R.id` y `active:true`; no aparece el hijo de `R2` | positivo |
| B-02 | CA4 | `all=true` devuelve activos e inactivos | GET `/sports/:id/subsports` | ídem | `?all=true` | 200 | `H` y `Hi` (2 elementos) | positivo |
| B-03 | CA4, R7 (D1) | `active=false` | GET `/sports/:id/subsports` | ídem | `?active=false` | 200 | solo `Hi` | positivo |
| B-04 | CA4 | Raíz sin hijos | GET `/sports/:id/subsports` | `R` sin hijos | `id=R.id` | 200 | `[]` | borde |
| B-05 | CA4 | Deporte padre inexistente | GET `/sports/:id/subsports` | ninguna | `id=2147483647` | 404 | `NOT_FOUND` | negativo |
| B-06 | CA4, R11 | Id no numérico | GET `/sports/:id/subsports` | ninguna | `id=abc` | 400 | `INVALID_OPERATION` | negativo |
| B-07 | CA4 (D1) | `active` no booleano | GET `/sports/:id/subsports` | `R` | `?active=x` | 400 | objeto plano clave `active` (la spec lista 400 para este endpoint) | negativo |
| B-08 | CA4 (D1) | Parámetro desconocido | GET `/sports/:id/subsports` | `R` | `?foo=1` | 400 | objeto plano clave `foo` | negativo |

### 3.5 `PUT /sports/:id` – actualizar (CA6, CA9)

PUT es reemplazo completo (P12): `name` obligatorio; `description` y `parentSportId` omitidos o `null` quedan en `null`.

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Cuerpo | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| U-01 | CA6, CA9, R12 | Actualizar nombre y descripción | PUT `/sports/:id` | `R` | `{name:N("Renombrado"), description:"Nueva"}` | 200 | refleja los nuevos valores; `GET` posterior idéntico | positivo |
| U-02 | CA6, R3 | Mismo nombre, cambia descripción (se ignora el propio id) | PUT `/sports/:id` | `R` | `{name:R.name, description:"Otra"}` | 200 | `description:"Otra"` | positivo |
| U-03 | CA6, R3 | Cambiar solo la capitalización/acentos del propio nombre | PUT `/sports/:id` | `R` llamada `QA{runId} Futbol` | `{name:"QA{runId} FÚTBOL"}` (archivo UTF-8) | 200 | `name` con el nuevo texto (no es duplicado de sí mismo) | borde |
| U-04 | CA6, R4 | Asignar padre a una raíz sin hijos | PUT `/sports/:id` | `R1`, `R2` raíces | `{name:R2.name, parentSportId:R1.id}` | 200 | `parentSport:{id:R1.id,...}`; `GET /sports/R1.id` → `subSportsCount:1` | positivo |
| U-05 | CA6, R4 | Mover un subdeporte a otra raíz | PUT `/sports/:id` | `R1`, `R2`, `H` hijo de `R1` | `{name:H.name, parentSportId:R2.id}` | 200 | `parentSportId:R2.id`; conteos: `R1:0`, `R2:1` | positivo |
| U-06 | CA6 (P12) | `parentSportId:null` convierte en raíz | PUT `/sports/:id` | `R`, `H` | `{name:H.name, parentSportId:null}` | 200 | `parentSportId:null`, `parentSport:null`; `R.subSportsCount:0` | positivo |
| U-07 | CA6 (P12) | `parentSportId` omitido también deja raíz | PUT `/sports/:id` | `R`, `H` | `{name:H.name}` | 200 | `parentSportId:null` | borde |
| U-08 | CA6 (D10) | `description` omitida queda en `null` (reemplazo completo) | PUT `/sports/:id` | `R` con descripción | `{name:R.name}` | 200 | `description:null`. Spec define reemplazo completo (decisión (b)); no lo dice explícitamente para `description` | borde |
| U-09 | CA6, R8, R12 | PUT no cambia el estado `active` | PUT `/sports/:id` | `Ri` | `{name:N("Inactivo editado")}` | 200 | `active:false` sigue igual | borde |
| U-10 | CA6 | Editar una raíz con hijos sin tocar la jerarquía | PUT `/sports/:id` | `R` con 2 hijos | `{name:N("Raiz editada")}` | 200 | `subSportsCount:2`; los hijos siguen apuntando a `R` | positivo |
| U-11 | CA6, R10 (D7) | Editar un subdeporte cuyo padre quedó inactivo, sin cambiar de padre | PUT `/sports/:id` | `R`, `H`; `H` desactivado, luego `R` desactivado | `{name:H.name, description:"x", parentSportId:R.id}` | 200 | Esperado 200 (R10 aplica a nuevas asociaciones, no a la ya existente). **No definido**; pendiente D7 | borde |
| U-12 | CA6, R1 | Trim del nombre en PUT | PUT `/sports/:id` | `R` | `{name:"   QA{runId} Trim   "}` | 200 | `name` recortado | positivo |
| U-13 | CA6 | Deporte inexistente | PUT `/sports/:id` | ninguna | `id=2147483647`, `{name:N("x")}` | 404 | `NOT_FOUND` | negativo |
| U-14 | CA6, R11 | Id no numérico | PUT `/sports/:id` | ninguna | `id=abc`, `{name:N("x")}` | 400 | `INVALID_OPERATION` | negativo |
| U-15 | CA6 (D5) | Id inexistente **y** cuerpo inválido | PUT `/sports/:id` | ninguna | `id=2147483647`, `{name:""}` | 400 | objeto plano con clave `name` (decisión Q5: el `ValidationPipe` valida antes que el service) | borde |
| U-16 | CA2, R1 | Cuerpo `{}` | PUT `/sports/:id` | `R` | `{}` | 400 | clave `name` | negativo |
| U-17 | CA2, R1 | `name` solo espacios | PUT `/sports/:id` | `R` | `{name:"   "}` | 400 | clave `name`; `GET` conserva el nombre anterior | negativo |
| U-18 | CA2, R1 | `name` de 121 caracteres | PUT `/sports/:id` | `R` | `name` de 121 | 400 | clave `name` | negativo |
| U-19 | CA2, R2 | `description` de 501 caracteres | PUT `/sports/:id` | `R` | `{name:R.name, description:<501>}` | 400 | clave `description` | negativo |
| U-20 | CA2, R4 | `parentSportId` no numérico | PUT `/sports/:id` | `R` | `{name:R.name, parentSportId:"abc"}` | 400 | clave `parentSportId` | negativo |
| U-21 | CA2, R4 | `parentSportId` cero | PUT `/sports/:id` | `R` | `{name:R.name, parentSportId:0}` | 400 | clave `parentSportId` | negativo |
| U-22 | CA2 | Campo no permitido `active` | PUT `/sports/:id` | `R` | `{name:R.name, active:false}` | 400 | clave `active`; `GET` sigue `active:true` | negativo |
| U-23 | CA3, R3 | Nombre de otro deporte | PUT `/sports/:id` | `R1`, `R2` | `{name:R1.name}` sobre `R2` | 409 | `ALREADY_EXISTS` | negativo |
| U-24 | CA3, R3 (P4) | Nombre de otro deporte con otra capitalización y sin acentos | PUT `/sports/:id` | `R1` llamada `QA{runId} Fútbol`, `R2` | `{name:"qa{runId} FUTBOL"}` sobre `R2` (archivo UTF-8) | 409 | `ALREADY_EXISTS` | negativo |
| U-25 | CA9, R12 | Un PUT rechazado no cambia lo guardado | GET `/sports/:id` | tras U-23 | `id=R2.id` | 200 | conserva nombre y descripción originales de `R2` | negativo |
| U-26 | R4 | Padre inexistente | PUT `/sports/:id` | `R` | `{name:R.name, parentSportId:2147483647}` | 404 | `NOT_FOUND` | negativo |
| U-27 | R5 | Un deporte no puede ser su propio padre | PUT `/sports/:id` | `R` | `{name:R.name, parentSportId:R.id}` | 400 | `INVALID_OPERATION` ("…propio deporte padre" †) | negativo |
| U-28 | R6, R13 | Ciclo directo: A padre de B, se intenta B padre de A | PUT `/sports/:id` | `A`, `B` hijo de `A` | `id=A.id`, `{name:A.name, parentSportId:B.id}` | 400 | `INVALID_OPERATION`; `A` sigue siendo raíz y `B` su hijo (GET) | negativo |
| U-29 | R6, R13 | Ciclo indirecto A→B→C: intentar hacer a C padre de A | PUT `/sports/:id` | `A` raíz, `B` hijo de `A`, `C` raíz | `id=C.id`, `{name:C.name, parentSportId:B.id}` (armar la cadena A→B→C) | 400 | `INVALID_OPERATION`, "…ya es un subdeporte…" †. Con un solo nivel (R13) la cadena A→B→C no puede existir; `C` sigue raíz (GET) | negativo |
| U-30 | R13 | Mover un deporte que tiene hijos bajo otro padre | PUT `/sports/:id` | `R1` con hijo, `R2` | `id=R1.id`, `{name:R1.name, parentSportId:R2.id}` | 400 | `INVALID_OPERATION` ("…tiene subdeportes no puede convertirse en subdeporte" †); `R1` sigue raíz | negativo |
| U-31 | R10 | Mover bajo un padre inactivo | PUT `/sports/:id` | `R`, `Ri` | `{name:R.name, parentSportId:Ri.id}` | 409 | `INVALID_STATE` | negativo |

### 3.6 `PATCH /sports/:id/deactivate` y `/activate` (CA7)

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| V-01 | CA7, R8, CA9 | Desactivar un deporte activo sin hijos | PATCH `/sports/:id/deactivate` | `R` | ninguno | 200 | `active:false`; `GET` confirma; ya no aparece en `GET /sports` por defecto y sí con `all=true` | positivo |
| V-02 | R8 | Desactivar es idempotente | PATCH `/sports/:id/deactivate` | `Ri` | ninguno | 200 | `active:false` | borde |
| V-03 | CA8, R8 (P5) | Bloqueado con subdeportes activos (hijos mixtos: 1 activo, 1 inactivo) | PATCH `/sports/:id/deactivate` | `R`, `H` activo, `Hi` inactivo | ninguno | 409 | `INVALID_STATE`, `message` menciona "1 subdeporte activo" †; `GET` muestra `R.active:true` | negativo |
| V-04 | R8 (P5) | Permitido con todos los hijos inactivos; los hijos no cambian | PATCH `/sports/:id/deactivate` | `R`, `Hi1`, `Hi2` inactivos | ninguno | 200 | `R.active:false`; los hijos siguen `active:false` y se listan con `GET /sports/R.id/subsports?all=true` | positivo |
| V-05 | R8 | Desactivar un subdeporte no afecta al padre | PATCH `/sports/:id/deactivate` | `R`, `H` | `id=H.id` | 200 | `H.active:false`; `R.active:true` | positivo |
| V-06 | R8 | Desactivar deporte inexistente | PATCH `/sports/:id/deactivate` | ninguna | `id=2147483647` | 404 | `NOT_FOUND` | negativo |
| V-07 | R11 | Desactivar con id no numérico | PATCH `/sports/:id/deactivate` | ninguna | `id=abc` | 400 | `INVALID_OPERATION` | negativo |
| V-08 | CA7, CA9 | Activar un deporte inactivo | PATCH `/sports/:id/activate` | `Ri` | ninguno | 200 | `active:true`; `GET` confirma | positivo |
| V-09 | R8 (D6) | Activar uno ya activo | PATCH `/sports/:id/activate` | `R` | ninguno | 200 | `active:true`. Idempotencia de `activate` no definida en la spec (solo la de `deactivate`); pendiente D6 | borde |
| V-10 | R10, P6 | No se activa un subdeporte con padre inactivo | PATCH `/sports/:id/activate` | `R`, `H`; se desactiva `H`, luego `R` | `id=H.id` | 409 | `INVALID_STATE`, `message` menciona al padre †; `H.active:false` | negativo |
| V-11 | P6 | Se activa un subdeporte con padre activo | PATCH `/sports/:id/activate` | `R`, `H` desactivado | `id=H.id` | 200 | `H.active:true` | positivo |
| V-12 | R8 | Activar una raíz no reactiva a sus hijos inactivos | PATCH `/sports/:id/activate` | `R` inactiva con `Hi` inactivo | `id=R.id` | 200 | `R.active:true`; `Hi.active:false` | borde |
| V-13 | R8 | Activar deporte inexistente | PATCH `/sports/:id/activate` | ninguna | `id=2147483647` | 404 | `NOT_FOUND` | negativo |
| V-14 | R11 | Activar con id no numérico | PATCH `/sports/:id/activate` | ninguna | `id=abc` | 400 | `INVALID_OPERATION` | negativo |

### 3.7 `DELETE /sports/:id` – eliminar (CA7, CA8)

Los casos E-10, E-11 y E-12 dependen de la decisión Q1 (fixtures SQL).

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| E-01 | CA7, R9, CA9 | Eliminar un deporte hoja sin dependencias | DELETE `/sports/:id` | `R` sin hijos | ninguno | 204 | sin cuerpo; `GET /sports/:id` posterior → 404 | positivo |
| E-02 | CA7, R9 | Eliminar un deporte inactivo sin dependencias | DELETE `/sports/:id` | `Ri` | ninguno | 204 | sin cuerpo; `GET` → 404 | positivo |
| E-03 | CA7, R9 | Eliminar un subdeporte hoja; el padre queda intacto | DELETE `/sports/:id` | `R`, `H` | `id=H.id` | 204 | `GET /sports/R.id`: 200, `active` sin cambio, `subSportsCount:0` | positivo |
| E-04 | R9 | Eliminar al padre una vez eliminado su único hijo (el conteo se actualiza) | DELETE `/sports/:id` | `R`, `H`; antes se eliminó `H` | `id=R.id` | 204 | `GET` → 404 | borde |
| E-05 | CA8, R9 | Raíz con subdeporte activo | DELETE `/sports/:id` | `R`, `H` | `id=R.id` | 409 | `INVALID_STATE`, `message` contiene "subdeporte" y el nombre de `R`; `GET` de `R` y de `H` siguen 200 (no se borró nada) | negativo |
| E-06 | CA8, R9 | Raíz cuyo único hijo está inactivo (cualquier hijo bloquea) | DELETE `/sports/:id` | `R`, `Hi` | `id=R.id` | 409 | `INVALID_STATE`, "1 subdeporte"; ambos siguen existiendo | negativo |
| E-07 | CA7 | Eliminar deporte inexistente | DELETE `/sports/:id` | ninguna | `id=2147483647` | 404 | `NOT_FOUND` | negativo |
| E-08 | R11 | Eliminar con id no numérico | DELETE `/sports/:id` | ninguna | `id=abc` | 400 | `INVALID_OPERATION` | negativo |
| E-09 | CA7 | Segundo `DELETE` del mismo id | DELETE `/sports/:id` | `R` ya eliminado en E-01 (mismo `setup`) | mismo `id` | 404 | `NOT_FOUND` | borde |
| E-10 | CA8, R9 | Deporte con equipo asociado (`team_sports`) | DELETE `/sports/:id` | fixture `QA-FIX-EQUIPO` (Q1-A) | `id=` del fixture | 409 | `INVALID_STATE`, `message` contiene "1 equipo asociado"; el deporte sigue existiendo | negativo |
| E-11 | CA8, R9 | Deporte con torneos | DELETE `/sports/:id` | fixture `QA-FIX-TORNEO` con 3 torneos (Q1-A) | `id=` del fixture | 409 | `INVALID_STATE`, `message` contiene "3 torneos" | negativo |
| E-12 | CA8, R9 | Deporte con subdeportes, equipo y torneos a la vez: el mensaje dice cuáles y cuántos | DELETE `/sports/:id` | fixture `QA-FIX-MIXTO`: 2 subdeportes, 1 equipo, 3 torneos (Q1-A) | `id=` del fixture | 409 | `message` contiene "2 subdeportes", "1 equipo asociado" y "3 torneos" (fragmentos, no la frase completa; ver D12); nada se borró | negativo |

### 3.8 Transversales

| ID | Criterio / regla | Caso | Método y ruta | Precondición | Parámetros | Código | Cuerpo esperado | Tipo |
|---|---|---|---|---|---|---|---|---|
| T-01 | Spec (CORS `PUT`) | Preflight de `PUT` desde el frontend | OPTIONS `/sports/1` | ninguna | headers `Origin: http://localhost:3000`, `Access-Control-Request-Method: PUT` | 204 | `Access-Control-Allow-Methods` incluye `PUT`; `Access-Control-Allow-Origin: http://localhost:3000` | positivo |

### 3.9 Verificaciones manuales o por script (fuera de Newman)

Se ejecutan con `node postman/fixtures/manual-checks.mjs` (Node + `mysql2`); la salida queda en `postman/results/HU-GD-01-manual.log`.

| ID | Criterio / regla | Caso | Cómo | Resultado esperado | Tipo |
|---|---|---|---|---|---|
| M-01 | CA9, R12 | Lo escrito por la API está realmente en MySQL | Tras la corrida, `SELECT id,name,description,active,parent_sport_id FROM sports WHERE name LIKE 'QA%'` y comparar con las respuestas de C-01, U-01, V-01, E-01 | las filas coinciden con lo devuelto; las borradas no existen | positivo |
| M-02 | CA3, R3 | Dos `POST` simultáneos con el mismo nombre | script Node con `Promise.all` de 2 `fetch` | uno 201 y otro 409 `ALREADY_EXISTS`; ninguno 500; una sola fila | borde |
| M-03 | R9 | La FK `RESTRICT` es la red de seguridad real | `DELETE FROM sports WHERE id=<con hijo>` directo en SQL | error 1451; la fila sigue. (Prueba de BD, no de la API) | negativo |
| ~~M-04~~ | P10 | Migraciones `run` y `revert` | **OMITIDO por decisión del usuario (Q3)**: ya se verificaron a mano en `sports_db` (run, revert, re-run) | - | - |

## 4. Trazabilidad

### 4.1 Criterios de aceptación

| Criterio | Casos |
|---|---|
| CA1 Registrar un deporte | C-01, C-02, C-03 (más bordes C-04..C-12) |
| CA2 Validar obligatorios | C-13..C-29, U-16..U-22 |
| CA3 Sin duplicados | C-30..C-35, U-23..U-25, M-02 |
| CA4 Listado | L-01..L-20, B-01..B-08 |
| CA5 Detalle | G-01..G-11 |
| CA6 Actualizar | U-01..U-31 |
| CA7 Eliminar o desactivar | V-01..V-14, E-01..E-09 |
| CA8 Informar dependencias | E-05, E-06, E-10, E-11, E-12, V-03 |
| CA9 Cambios almacenados | C-01 (GET posterior), C-35, U-01, U-25, V-01, V-08, E-01, M-01 |

### 4.2 Reglas de negocio

| Regla | Casos |
|---|---|
| R1 nombre obligatorio, máx. 120, trim | C-01, C-04..C-06, C-11..C-18, U-12, U-16..U-18 |
| R2 descripción opcional, máx. 500 | C-02, C-07..C-09, C-19, C-20, U-08, U-19 |
| R3 nombre único (sin mayúsculas/acentos, trim; ignora el propio id) | C-30..C-34, U-02, U-03, U-23, U-24 |
| R4 padre entero y existente | C-03, C-10, C-21..C-26, U-04..U-06, U-20, U-21, U-26 |
| R5 no ser su propio padre | U-27 |
| R6 sin ciclos | U-28, U-29 (la detección por recorrido fue sustituida por R13) |
| R7 listado por defecto solo activos; detalle de inactivo | L-01..L-04, L-11, G-03, B-01..B-03 |
| R8 desactivar idempotente y bloqueado con hijos activos | V-01..V-07, V-09, V-12, U-09 |
| R9 DELETE solo sin dependencias | E-01..E-06, E-10..E-12, M-03 |
| R10 inactivo no se usa en nuevas asociaciones | C-36, U-31, U-11, V-10 |
| R11 id numérico | G-05..G-12, B-06, U-14, V-07, V-14, E-08 |
| R12 persistencia reflejada | C-01, C-35, U-01, U-25, V-01, E-01, M-01 |
| R13 un solo nivel | C-37, U-28, U-29, U-30 |

Decisiones del grupo cubiertas: P1 (C-37, U-28..U-30), P3 (C-34), P4 (C-32, U-24), P5 (V-03, V-04, E-06), P6 (V-10, V-11), P7 (V-01, E-01), P11 (formato plano de validación en los 400), P12 (U-06..U-08), P13 (V-08, L-05, L-06, L-07), P14 (nota: sin auth).

## 5. Resumen de conteos

| Grupo | Positivo | Negativo | Borde | Total |
|---|---|---|---|---|
| C – POST /sports | 3 | 25 | 9 | 37 |
| L – GET /sports | 7 | 7 | 6 | 20 |
| G – GET /sports/:id | 3 | 6 | 3 | 12 |
| B – GET /sports/:id/subsports | 3 | 4 | 1 | 8 |
| U – PUT /sports/:id | 7 | 18 | 6 | 31 |
| V – activate / deactivate | 5 | 6 | 3 | 14 |
| E – DELETE /sports/:id | 3 | 7 | 2 | 12 |
| T – transversales | 1 | 0 | 0 | 1 |
| **Newman (automatizables)** | **32** | **73** | **30** | **135** |
| M – manuales / script (M-01..M-03) | 1 | 1 | 1 | 3 |
| **Total** | **33** | **74** | **31** | **138** |

Además de los 135 casos, la colección tiene 4 requests de apoyo (L-00, G-00, B-00 de preparación y Z-01 de limpieza) que no son casos de la matriz.

## 6. Hallazgos y dudas (estado original; ver sección 7 para su resolución)

| # | Hallazgo | Casos afectados | Probabilidad de fallo |
|---|---|---|---|
| D1 | `GET /sports/:id/subsports`: la spec lista `?active` y `?all` y R7 pide solo activos por defecto, pero el controller no recibe query; devuelve todos los hijos directos. Verificado: `?active=x` responde 404 de "deporte no existe" (no 400) porque ignora el parámetro | B-01, B-03, B-07 | alta |
| D2 | `GET /sports/1e2` se interpreta como id 100 (`ParseIntPipe` acepta notación exponencial). R11 dice id entero | G-08 | alta |
| D3 | Id `0`, `-1` o fuera de rango: la spec dice "400/404 sin 500". Observado 404. Se propone fijar 404 | G-09..G-11 | baja |
| D4 | La spec solo define trim para `name`; el DTO también recorta `description` y el mapper guarda `null` si queda vacía | C-08, C-09 | baja (documentar) |
| D5 | Orden de validación de `PUT`: la spec sugiere "existe el deporte (404) → DTO (400)"; el `ValidationPipe` global valida antes del service, así que cuerpo inválido sobre id inexistente da 400 | U-15 | media |
| D6 | `activate` sobre un deporte ya activo: la spec no dice nada (solo `deactivate` es idempotente) | V-09 | baja |
| D7 | `PUT` sobre un subdeporte cuyo padre está inactivo, sin cambiar de padre: R10 habla de "nuevas asociaciones"; el service lo permite | U-11 | baja |
| D8 | `?all=true&active=false`, `?name` solo espacios y `?name=%`/`_`: la spec no define el comportamiento | L-11, L-12, L-13 | media |
| D9 | `subSportsCount` en el listado: la spec dice "solo en el detalle" (propuesta) y luego "la respuesta incluye subSportsCount" (decisión). Los casos de listado no afirman su presencia ni ausencia | L-01 | n/a |
| D10 | `PUT` con `description` omitida: se asume `null` (reemplazo completo) pero la spec solo lo explicita para `parentSportId` | U-08 | baja |
| D11 | Texto del 400 por campo no permitido (`active`, `id`, parámetros desconocidos): no definido | C-27, C-28, U-22, L-18 | n/a |
| D12 | El ejemplo del `message` de R9 usa "2 subdeportes, 1 equipo asociado **y** 3 torneos"; el service une con coma ("…, 1 equipo asociado, 3 torneos"). Se afirman fragmentos | E-12 | n/a |
| D13 | `main.ts` hace `listen(process.env.PORT ?? 3000)`: coherente con el entorno (3001), pero el puerto por defecto sigue chocando con el frontend (pendiente del grupo) | - | n/a |
| D14 | `newman` y la CLI `mysql` no están en el PATH | ejecución | n/a |

## 7. Decisiones resueltas

| # | Decisión del usuario |
|---|---|
| Q1 | Opción A: fixtures `QA-FIX-*` por SQL (`postman/fixtures/seed.mjs`), `teardown.mjs` por prefijo `QA`. Ambos se niegan a correr si `DB_NAME` no es `sports_db` |
| Q2 | Nombres con prefijo `QA{Date.now()}`, carpeta final `99 Cleanup` (borra por API, hijos primero) y teardown SQL |
| Q3 | Se incluyen M-01 a M-03; M-04 omitido (migraciones ya verificadas a mano) |
| Q4 | Rigor flexible: se afirma la clave del campo y que el texto exista; texto exacto solo en los casos con † (por ejemplo G-04 y G-05) y fragmentos clave en los 409 |
| Q5 / D3 | Ids 0, negativos o fuera de rango: 404 (G-09, G-10, G-11) |
| Q5 / D5 | En PUT, id inexistente con cuerpo inválido: 400 (el `ValidationPipe` va antes). U-15 espera 400 con clave `name` |
| Q5 / D8 | Si llegan `all` y `active` juntos gana `all` (L-11) |
| D1 | CORREGIDO en el código: `/subsports` aplica `active`/`all`, 400 con `active` no booleano o parámetro desconocido (B-01, B-03, B-07, B-08) |
| D2 | CORREGIDO en el código: `1e2` y `0x10` responden 400 (G-08, G-12) |

Los casos con comportamiento no definido por la spec que se mantuvieron con la expectativa documentada (D4, D6, D7, D10, D11, D12 y los comodines/espacios de D8) pasaron con esa expectativa; siguen siendo decisiones de diseño por confirmar por el grupo, no fallos.

## 8. Ejecución

Ver el reporte final del tester (entregado en la respuesta) y los archivos `postman/results/HU-GD-01-newman.log`, `postman/results/HU-GD-01-newman.json` y `postman/results/HU-GD-01-manual.log`.

Comandos exactos (desde la carpeta `ms_sports`, con la API en `http://localhost:3001`):

```bash
node postman/fixtures/teardown.mjs     # deja la base sin datos QA
node postman/fixtures/seed.mjs         # crea los fixtures QA-FIX-*
npx newman run postman/MsSports.postman_collection.json -e postman/Local.postman_environment.json --reporters cli,json --reporter-json-export postman/results/HU-GD-01-newman.json
node postman/fixtures/manual-checks.mjs   # M-01..M-03
node postman/fixtures/teardown.mjs     # limpieza final
```

La colección se regenera con `node postman/tools/generate-collection.mjs postman/MsSports.postman_collection.json`.
