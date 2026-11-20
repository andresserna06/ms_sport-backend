---
name: arquitectura-nest
description: Arquitectura por capas en NestJS para este proyecto. Úsala al crear o modificar módulos, controllers, services, repositories, DTOs, mappers o la inyección de dependencias.
---

# Arquitectura por capas en NestJS

## Idioma del código

Todo el código va en inglés: clases, métodos, variables, archivos, carpetas,
rutas, tablas, columnas, enums, comentarios y nombres de pruebas. Las entidades
se nombran según el glosario de `modelo-relacional`.
Solo van en español los textos que ve el usuario final: mensajes de error
(`message`) y contenido de los correos.

## Flujo de dependencias

```
Controller → Service → Repository (interfaz) → ORM / Base de datos
                ↕
              Mapper (apoyo, sin persistencia)
```

Ninguna capa salta a otra. El controller nunca habla con el ORM.

## Estructura de un módulo

Un módulo de Nest por agregado del dominio, con nombre en inglés (`sports`,
`teams`, `players`, `skills`, `tournaments`, `phases`, `matches`…). Las
asociaciones viven en el módulo del dueño natural de la relación (ej. contratos
jugador-equipo en `teams`).

```
src/<module>/
├── <module>.module.ts
├── controllers/   <entity>.controller.ts
├── services/      <entity>.service.ts
├── repositories/  <entity>.repository.ts           (interfaz + token)
│                  <entity>.typeorm.repository.ts   (implementación con TypeORM)
├── entities/      <entity>.entity.ts               (modelo persistente)
├── dtos/          create-<entity>.dto.ts, update-<entity>.dto.ts, <entity>-response.dto.ts
└── mappers/       <entity>.mapper.ts
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
  (`existsByName`, `hasDependencies`, `findOverlappingContracts`).

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
- Debe tener pruebas unitarias con Jest (`<entity>.mapper.spec.ts`).

## SOLID

- **S**: cada clase una responsabilidad. Si un service crece con lógica de otro
  agregado, esa lógica va en el service del otro módulo y se consume por inyección.
- **D**: los services dependen de interfaces de repositorio inyectadas por token,
  no de clases concretas del ORM.

Ejemplo de registro por token:

```ts
// repositories/sport.repository.ts
export const SPORT_REPOSITORY = Symbol('SPORT_REPOSITORY');
export interface SportRepository {
  findById(id: number): Promise<Sport | null>;
  existsByName(name: string, excludeId?: number): Promise<boolean>;
  save(sport: Sport): Promise<Sport>;
}

// repositories/sport.typeorm.repository.ts
@Injectable()
export class SportTypeOrmRepository implements SportRepository {
  constructor(@InjectRepository(Sport) private readonly orm: Repository<Sport>) {}
  // ...
}

// sports.module.ts  (imports: [TypeOrmModule.forFeature([Sport])])
providers: [
  SportService,
  { provide: SPORT_REPOSITORY, useClass: SportTypeOrmRepository },
],

// services/sport.service.ts
constructor(@Inject(SPORT_REPOSITORY) private readonly repo: SportRepository) {}
```

## Dependencias entre módulos

- Un módulo que necesite datos de otro importa ese módulo y usa su **service**
  exportado, nunca su repositorio ni su entidad directamente.
- Evitar dependencias circulares; si aparecen, mover la lógica compartida o usar eventos.

## Base de datos y migraciones

- TypeORM + MySQL, `synchronize: false`. Todo cambio de esquema es una migración:
  `npm run migration:generate -- src/migrations/<NameInPascalCase>` y luego `npm run migration:run`.
- Revisar la migración generada antes de commitearla; nunca editar una migración ya subida a `main`.

## Configuración global (main.ts, ya existe parcialmente)

- `ValidationPipe` global: ya tiene `whitelist` y `transform`; falta `forbidNonWhitelisted: true`.
- Falta el filtro global de excepciones con el formato de `api-rest` y la clase
  `ApplicationException` en `src/common/`.
- CORS ya está habilitado.
