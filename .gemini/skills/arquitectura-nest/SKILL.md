---
name: arquitectura-nest
description: Arquitectura por capas en NestJS para este proyecto. Úsala al crear o modificar módulos, controllers, services, repositories, DTOs, mappers o la inyección de dependencias.
---

# Arquitectura por capas en NestJS

## Flujo de dependencias

```
Controller → Service → Repository (interfaz) → ORM / Base de datos
                ↕
              Mapper (apoyo, sin persistencia)
```

Ninguna capa salta a otra. El controller nunca habla con el ORM.

## Estructura de un módulo

Un módulo de Nest por agregado del dominio (deportes, equipos, jugadores,
habilidades, torneos, fases, partidos…). Las asociaciones viven en el módulo
del dueño natural de la relación (ej. contratos jugador-equipo en `equipos`).

```
src/<modulo>/
├── <modulo>.module.ts
├── controllers/   <entidad>.controller.ts
├── services/      <entidad>.service.ts
├── repositories/  <entidad>.repository.ts           (interfaz + token)
│                  <entidad>.typeorm.repository.ts   (implementación con TypeORM)
├── entities/      <entidad>.entity.ts               (modelo persistente)
├── dtos/          crear-<entidad>.dto.ts, actualizar-<entidad>.dto.ts, <entidad>-respuesta.dto.ts
└── mappers/       <entidad>.mapper.ts
```

## Responsabilidades

**Controller**
- Recibe la petición, lee parámetros y body (ya validados por pipes).
- Llama a un único método del service y devuelve el DTO de respuesta.
- Define el código HTTP de éxito con `@HttpCode` cuando no sea el por defecto.
- Prohibido: reglas de negocio, acceso al ORM, mapeos manuales, try/catch para
  traducir errores (eso lo hace el filtro global).

**Service**
- Implementa las reglas de negocio (ver skill `reglas-dominio`).
- Coordina repositorios, usa mappers y emite eventos de dominio.
- Lanza `ApplicationException(errorCase, mensaje)` con los `errorCase` de la
  skill `api-rest`; el filtro global la traduce al código HTTP.
- No conoce objetos `Request`/`Response` ni decoradores HTTP.
- Operaciones que tocan varias tablas van en una transacción.

**Repository**
- Encapsula TODO el acceso a persistencia: consultar, guardar, actualizar, eliminar.
- Se define una interfaz y se inyecta por token; el service depende de la interfaz,
  no de la implementación del ORM (principio D).
- No contiene reglas de negocio; sí puede tener consultas específicas
  (`existeNombre`, `tieneAsociaciones`, `contratosSolapados`).

**Entity (modelo persistente)**
- Solo estructura y relaciones (ver `modelo-relacional`). Nunca se devuelve al cliente.

**DTO**
- Entrada: validados con `class-validator` y `class-transformer`
  (`@IsNotEmpty`, `@IsString`, `@Length`, `@IsInt`, `@IsDateString`…).
  Los strings se recortan (trim) antes de validar.
- Actualización: `PartialType` del DTO de creación.
- Salida: DTO de respuesta explícito; nunca exponer la entidad del ORM.

**Mapper**
- Funciones o clase sin estado: entidad → DTO de respuesta, DTO de entrada → entidad/datos.
- Prohibido: reglas de negocio, consultas, dependencias HTTP, inyectar repositorios.
- Debe tener pruebas unitarias con Jest (`<entidad>.mapper.spec.ts`).

## SOLID

- **S**: cada clase una responsabilidad. Si un service crece con lógica de otro
  agregado, esa lógica va en el service del otro módulo y se consume por inyección.
- **D**: los services dependen de interfaces de repositorio inyectadas por token,
  no de clases concretas del ORM.

Ejemplo de registro por token:

```ts
// repositories/deporte.repository.ts
export const DEPORTE_REPOSITORY = Symbol('DEPORTE_REPOSITORY');
export interface DeporteRepository {
  buscarPorId(id: number): Promise<Deporte | null>;
  existeNombre(nombre: string, excluirId?: number): Promise<boolean>;
  guardar(deporte: Deporte): Promise<Deporte>;
}

// repositories/deporte.typeorm.repository.ts
@Injectable()
export class DeporteTypeOrmRepository implements DeporteRepository {
  constructor(@InjectRepository(Deporte) private readonly orm: Repository<Deporte>) {}
  // ...
}

// deportes.module.ts  (imports: [TypeOrmModule.forFeature([Deporte])])
providers: [
  DeporteService,
  { provide: DEPORTE_REPOSITORY, useClass: DeporteTypeOrmRepository },
],

// services/deporte.service.ts
constructor(@Inject(DEPORTE_REPOSITORY) private readonly repo: DeporteRepository) {}
```

## Dependencias entre módulos

- Un módulo que necesite datos de otro importa ese módulo y usa su **service**
  exportado, nunca su repositorio ni su entidad directamente.
- Evitar dependencias circulares; si aparecen, mover la lógica compartida o usar eventos.

## Base de datos y migraciones

- TypeORM + MySQL, `synchronize: false`. Todo cambio de esquema es una migración:
  `npm run migration:generate -- src/migrations/<NombreEnPascalCase>` y luego `npm run migration:run`.
- Revisar la migración generada antes de commitearla; nunca editar una migración ya subida a `main`.

## Configuración global (main.ts, ya existe parcialmente)

- `ValidationPipe` global: ya tiene `whitelist` y `transform`; falta `forbidNonWhitelisted: true`.
- Falta el filtro global de excepciones con el formato de `api-rest` y la clase
  `ApplicationException` en `src/common/`.
- CORS ya está habilitado.
