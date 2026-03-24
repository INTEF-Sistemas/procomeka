# Modelo de dominio

## Estado

Borrador v0. Este modelo es lógico, no físico. La implementación concreta depende de las ADRs de base de datos.

---

## Entidades principales

### Resource (Recurso)

Unidad central del catálogo. Representa un material educativo.

```typescript
type Resource = {
  id: string                    // identificador interno
  slug: string                  // URL-friendly, único
  externalId?: string           // ID en el sistema de origen (migración)
  sourceUri?: string            // URI canónica de procedencia

  // Metadatos descriptivos
  title: string                 // obligatorio
  description: string           // obligatorio
  language: string              // ISO 639-1, obligatorio
  license: License              // obligatorio
  resourceType: ResourceType    // obligatorio
  educationalLevel: EducationalLevel[]  // obligatorio
  subject: Subject[]            // obligatorio
  keywords: string[]
  author?: string
  publisher?: string
  createdAt?: Date
  modifiedAt?: Date
  duration?: number             // minutos estimados

  // Accesibilidad
  accessibilityFeatures?: string[]
  accessibilityHazards?: string[]
  accessMode?: string[]

  // Estado editorial
  editorialStatus: EditorialStatus
  assignedCuratorId?: string
  curatedAt?: Date
  featuredAt?: Date

  // Archivos y medios
  mediaItems: MediaItem[]

  // Sistema
  importedAt?: Date
  importSource?: string
  createdInSystem: Date
  updatedInSystem: Date
}
```

### MediaItem (Elemento multimedia)

Archivo o URL asociada a un recurso.

```typescript
type MediaItem = {
  id: string
  resourceId: string
  type: 'file' | 'external_url' | 'embed'
  mimeType?: string
  url: string
  fileSize?: number
  filename?: string
  isPrimary: boolean
}
```

### Collection (Colección)

Agrupación curada de recursos.

```typescript
type Collection = {
  id: string
  slug: string
  title: string
  description: string
  coverImageUrl?: string
  resourceIds: string[]
  isOrdered: boolean            // true = itinerario
  editorialStatus: EditorialStatus
  curatorId: string
  createdAt: Date
  updatedAt: Date
}
```

### User (Usuario)

Persona con acceso al sistema.

```typescript
type User = {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}
```

### ImportJob (Job de importación)

Registro de una tarea de ingestión desde fuente externa.

```typescript
type ImportJob = {
  id: string
  source: string                // nombre o URL de la fuente
  format: ImportFormat
  status: JobStatus
  startedAt?: Date
  completedAt?: Date
  totalItems?: number
  importedItems?: number
  failedItems?: number
  errorLog?: string
  createdBy: string
  createdAt: Date
}
```

---

## Vocabularios controlados

### EditorialStatus
```
borrador | en-revision | validado | destacado | archivado | rechazado
```

### ResourceType
```
documento | presentacion | video | audio | imagen | actividad-interactiva
secuencia-didactica | ejercicio | evaluacion | proyecto | enlace | otro
```

### EducationalLevel
```
educacion-infantil | educacion-primaria | educacion-secundaria-obligatoria
bachillerato | fp-basica | fp-grado-medio | fp-grado-superior
ensenanzas-especiales | universidad | formacion-adultos | sin-nivel
```

### License
```
cc-by | cc-by-sa | cc-by-nc | cc-by-nc-sa | cc-by-nd | cc-by-nc-nd
cc0 | copyright | otro
```

### UserRole
```
admin | curator | author | reader
```

### ImportFormat
```
csv | json | oai-pmh | rss | lom-xml | otro
```

### JobStatus
```
pendiente | en-proceso | completado | fallido | cancelado
```

---

## Relaciones clave

```
Resource ──< MediaItem         (1 recurso tiene N medios)
Resource >── Subject            (N recursos tienen N materias)
Resource >── EducationalLevel   (N recursos tienen N niveles)
Collection >──< Resource        (N colecciones tienen N recursos)
User ──< Resource               (1 usuario crea N recursos)
User ──< ImportJob              (1 usuario lanza N jobs)
```

---

## Notas de diseño

- El modelo es intencionalmente simple en v0. Se ampliará mediante ADRs cuando casos de uso concretos lo requieran.
- Los identificadores son strings (UUID v4 o nanoid) para facilitar la portabilidad.
- Las relaciones many-to-many (resource-subject, resource-level) se implementan según la ADR de base de datos.
- `externalId` y `sourceUri` son clave para la trazabilidad de recursos migrados.
