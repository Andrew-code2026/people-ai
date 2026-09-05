# PEOPLE AI — Arquitectura de la Fase 1

## Propósito y límites

PEOPLE AI es una aplicación SaaS empresarial para gestionar personas y procesos internos. Esta entrega implementa la fundación: autenticación compatible con Manus OAuth, perfiles de aplicación, multi-tenancy, RBAC, navegación y dashboards de demostración. **Los datos visibles en la interfaz son ficticios**. IA, documentos, integraciones y analítica avanzada quedan preparados como contratos, pero no se ejecutan en esta fase.

## Arquitectura general

La aplicación utiliza React 19 y Tailwind en el cliente, Express y tRPC en el servidor, y Drizzle ORM sobre MySQL/TiDB. tRPC mantiene contratos tipados entre cliente y servidor. La autenticación de identidad continúa siendo responsabilidad de Manus OAuth; el perfil de PEOPLE AI determina la empresa y el rol funcional.

```text
Cliente React → tRPC /api/trpc → procedimientos protegidos → helpers Drizzle → MySQL/TiDB
                                      ↓
                       resolveAccess + assertRole + assertCompanyScope
```

## Multi-tenancy y seguridad

Toda entidad empresarial contiene `companyId`, excepto los recursos globales como permisos. El contexto de acceso se resuelve desde `app_profiles`, que vincula el usuario autenticado, una empresa y un rol. Los procedimientos que consultan datos empresariales reciben un `companyId` validado con Zod y ejecutan `assertCompanyScope` antes del acceso a datos. Un usuario que no sea `SUPER_ADMIN` solo puede operar sobre el `companyId` de su perfil.

Ocultar enlaces en el cliente nunca se considera una medida de seguridad. La autorización se vuelve a ejecutar en cada procedimiento de backend. Las consultas de departamentos y empleados incluyen siempre un filtro `companyId`. Los registros de auditoría admiten resultados `success`, `denied` y `error`, además de metadata e IP para ampliar la trazabilidad.

## Modelo de datos

| Entidad | Propósito | Alcance |
|---|---|---|
| `users` | Identidad de autenticación de Manus | Global |
| `companies` | Empresas aisladas del SaaS | Plataforma |
| `app_profiles` | Membresía, empresa y rol funcional | Usuario/empresa |
| `departments` | Estructura organizacional | Empresa |
| `employees` | Información laboral | Empresa |
| `roles` | Roles del sistema o personalizados | Global/empresa |
| `permissions` | Catálogo de permisos granulares | Global |
| `role_permissions` | Relación de roles y permisos | Sistema |
| `audit_logs` | Trazabilidad de acciones | Global/empresa |

Las claves compuestas y los índices por `companyId` facilitan el aislamiento y las consultas. La tabla `app_profiles` ya permite que una identidad tenga más de un contexto empresarial en el futuro. En una siguiente etapa se recomienda añadir foreign keys explícitas y políticas de borrado después de confirmar la estrategia de archivado.

## Roles y permisos

Los roles de plataforma son `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR`, `FINANCE`, `MANAGER` y `EMPLOYEE`. La matriz inicial se encuentra en `server/authorization.ts`, donde cada rol tiene permisos base. `assertRole` valida las operaciones por rol y `hasPermission` permite migrar hacia permisos granulares sin cambiar los consumidores. Los roles personalizados de empresa se modelan en `roles` y `role_permissions` cuando se habilite esa funcionalidad.

## Autenticación y navegación

El flujo de login y logout utiliza la infraestructura de Manus OAuth y la cookie de sesión del template. `access.me` resuelve el dashboard correspondiente al perfil. La interfaz actual funciona como demostración de la experiencia de cada rol y muestra con claridad la etiqueta “Entorno demo”. En producción, las rutas privadas deben envolverse con `DashboardLayout` y resolver el acceso desde el servidor antes de renderizar cada módulo.

## Datos demo

La base de datos contiene tres empresas ficticias: Bivien Demo, NovaTech Colombia y Andina Retail. Cada una tiene departamentos, empleados y perfiles de prueba. Las identidades usan dominios `.test`, nombres Demo y no representan personas reales. No se deben presentar estos registros como clientes, testimonios o actividad real. Para autenticación real, las cuentas deben vincularse a identidades OAuth controladas en el entorno de desarrollo.

## Cómo agregar un módulo

Un módulo nuevo debe comenzar con tablas que incluyan `companyId` cuando el recurso sea empresarial. Después se agregan helpers en `server/db.ts`, procedimientos tRPC en un router separado y pruebas de aislamiento. La UI debe reutilizar componentes de `client/src/components/ui`, registrar navegación en un layout común y contemplar loading, vacío, error y “Próximamente” si la capacidad no está lista.

## Puntos de extensión futuros

Para documentos, utilizar `storagePut`/`storageGet` y persistir en la base de datos únicamente `fileKey`, URL, MIME, tamaño, propietario y `companyId`. Para IA, crear una interfaz de proveedor en servidor con operaciones como `generateAnswer`, `embed` y `classify`; el módulo de HR Assistant nunca debe importar directamente un SDK de proveedor. Para integraciones, definir adaptadores por sistema externo, credenciales por empresa y logs de sincronización. Estas capacidades no se habilitan en la Fase 1.

## Validación y continuidad

Ejecutar `pnpm check` y `pnpm test` antes de cada checkpoint. Las pruebas esenciales cubren logout, RBAC y aislamiento. La Fase 2 puede incorporar rutas autenticadas por rol, gestión CRUD de empresas y empleados, auditoría efectiva, permisos personalizados y el almacenamiento documental.

## Reestructuración de demo HR

La experiencia principal ahora está enfocada en una analista de Talento Humano llamada Alexa Torres y en el tenant ficticio `Empresa Demo — Talento Humano`, que `server/seed.ts` crea con el id 4. **Ese id es un detalle del seed, no un valor con el que programar.** Fijar `const companyId = 4` en una página hace que, con cuentas reales, se pidan datos de una empresa ajena y el servidor responda FORBIDDEN desde `assertCompanyScope`. La empresa activa se resuelve siempre desde el servidor, con `access.me` o el hook `client/src/hooks/useCompanyId.ts`; los commits `7cbda94` y `d7e3da5` retiraron esos literales del cliente. La ruta `/` y `/hr` muestran el dashboard especializado; las rutas `/platform`, `/company`, `/finance`, `/manager` y `/employee` conservan los contextos internos de la arquitectura aprobada.

El sidebar HR presenta únicamente Inicio, Contratación, HR Assistant, Base de conocimiento, Notificaciones y Configuración. Las acciones todavía no implementadas producen feedback explícito de próxima fase. Contratación y Base de conocimiento ya tienen tablas y consultas tRPC aisladas por empresa, pero no implementan carga documental, enlaces de candidatos, OCR ni IA real.

El asistente se modela como una lógica central independiente del canal. Web está disponible como experiencia de demo; WhatsApp y Microsoft Teams aparecen como canales futuros no conectados. `shared/extensions.ts` contiene los puertos `LlmProvider`, `KnowledgeBasePort`, `IntegrationAdapter` y `DocumentStoragePort` para que las siguientes fases agreguen proveedores sin acoplar el dashboard a un SDK específico.
