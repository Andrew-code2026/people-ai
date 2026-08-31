# PEOPLE AI — Informe de implementación Fases 2 y 3

## Estado

Las Fases 2 y 3 fueron implementadas sobre la arquitectura existente de PEOPLE AI. La Fase 1 se conserva: autenticación de la analista, `companyId`, RBAC, aislamiento multi-tenant, AuditLog, navegación HR, contratos desacoplados y datos demo. No se implementó la Fase 4.

## Fase 2

### Implementado

Se agregaron cargos por empresa, plantillas de documentos reutilizables y documentos requeridos con orden, obligatoriedad y MIME permitido. Al crear una contratación, el backend valida que el cargo y la plantilla pertenezcan al mismo tenant y copia los documentos como snapshot en `hiring_requirements`; modificar la plantilla no modifica los requisitos históricos del proceso.

La analista dispone de pantallas para crear cargos, crear plantillas, añadir documentos, alternar documentos obligatorios/opcionales y crear procesos de contratación. El listado muestra los procesos y cada detalle presenta candidato, proceso, requisitos y estado. Todas las operaciones administrativas pasan por `protectedProcedure`, resolución de perfil, RBAC y `assertCompanyScope`.

### Archivos principales

| Archivo | Cambio |
|---|---|
| `drizzle/schema.ts` | Entidades de cargos, plantillas, items, candidatos, procesos y requisitos snapshot |
| `drizzle/0003_rapid_jetstream.sql` | Migración no destructiva aplicada |
| `server/hrDomain.ts` | Operaciones de dominio multi-tenant y creación de snapshots |
| `server/routers.ts` | Procedimientos tRPC protegidos para Fase 2 |
| `client/src/pages/PositionsPage.tsx` | Gestión de cargos y plantillas |
| `client/src/pages/HiringPage.tsx` | Creación y listado de contrataciones |
| `client/src/pages/HiringDetailPage.tsx` | Detalle y generación de enlace |
| `client/src/components/DashboardLayout.tsx` | Navegación HR funcional |
| `client/src/App.tsx` | Rutas nuevas |

## Fase 3

### Implementado

Se añadió un enlace candidato opaco generado con `randomBytes`, guardando únicamente su hash SHA-256. La URL no incluye ID incremental, cédula, `companyId` ni información personal. El registro contempla expiración de siete días, estado activo y revocación automática del enlace anterior al regenerar.

El portal candidato funciona sin cuenta OAuth y presenta una bienvenida mínima, cargo, empresa, checklist individual, progreso, carga de PDF/JPG/JPEG/PNG, límite de 10 MB, reemplazo y eliminación lógica antes del envío. El backend vuelve a validar MIME y tamaño; el nombre final se genera desde el título del requisito y se conserva el nombre original.

Los bytes se envían al backend y se guardan mediante `storagePut` en storage privado; la base de datos conserva únicamente `fileKey`, metadata y trazabilidad. La analista puede consultar el detalle y obtener una URL firmada para documentos activos mediante el procedimiento protegido `hiring.documentUrl`. Al completar el checklist y enviar, el proceso pasa a `in_review`, se crea una notificación interna y se registra auditoría.

### Archivos principales

| Archivo | Cambio |
|---|---|
| `server/hrDomain.ts` | Tokens, expiración, portal, carga, normalización, eliminación y URLs firmadas |
| `server/routers.ts` | Procedimientos públicos limitados por token y descargas protegidas |
| `client/src/pages/CandidatePortalPage.tsx` | Portal mobile-first del candidato |
| `client/src/pages/HiringDetailPage.tsx` | Expediente y enlace seguro |
| `server/hrDomain.test.ts` | Tests de token, tenant, RBAC, MIME y normalización |

## Seguridad y multi-tenancy

El portal no acepta `companyId` desde el cliente. El token se transforma en hash y resuelve internamente empresa, proceso y candidato. Cada consulta administrativa combina `companyId` con el identificador del recurso. El storage utiliza claves privadas y URLs firmadas. Los nombres proporcionados por el usuario no controlan la clave lógica ni el nombre normalizado.

La validación de archivo se ejecuta en backend y frontend: tamaño, MIME declarado, extensión compatible y firma mágica de PDF/JPEG/PNG. El sistema no ejecuta archivos ni implementa OCR, clasificación, análisis inteligente, WhatsApp, Teams ni HR Assistant productivo.

## Validación

| Comando | Resultado |
|---|---|
| `pnpm test` | 3 archivos, 9 pruebas exitosas |
| `pnpm check` | TypeScript sin errores |
| `pnpm build` | Build de cliente y servidor exitoso |
| Verificación visual | HR, cargos y contrataciones revisados en escritorio; portal responsive preparado |

El listado de contrataciones incluye filtros por estado y cargo y columnas de candidato, cargo, progreso, estado y fecha. Las notificaciones internas se exponen por tRPC y enlazan al expediente. Las mutaciones administrativas implementadas registran `AuditLog` con el usuario actor.

El build muestra una advertencia de chunk JavaScript superior a 500 KB, pero no falla. Es una optimización posterior, no un error funcional.

## Pendientes declarados

El correo real y OTP requieren un proveedor externo configurado; no se simuló ningún envío. La generación de ZIP organizado requiere una decisión de streaming/runtime y no se presenta como funcional. La revisión administrativa avanzada con estados explícitos `verified` o `rejected`, así como botones administrativos completos de reemplazo/eliminación, queda para una iteración operativa posterior. La auditoría de enlace, carga, eliminación y envío está conectada; la auditoría con usuario actor para cada mutation administrativa debe ampliarse cuando se formalice el contexto de actor.

## Flujo verificable

El flujo implementado es: analista selecciona cargo y plantilla; crea contratación; backend copia requisitos; abre detalle; genera enlace seguro; candidato accede sin cuenta; ve su checklist; adjunta, reemplaza o elimina documentos; observa progreso; el backend bloquea envío incompleto; al completar, cambia el proceso a `in_review`, crea notificación y deja metadata privada disponible para revisión administrativa.

La Fase 4 debe comenzar solo después de decidir OTP/correo, ZIP y revisión documental administrativa. No se activó ningún proveedor de IA ni se procesó el contenido de los archivos.
