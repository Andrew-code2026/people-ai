# PEOPLE AI — Análisis y plan de implementación de la Fase 2

**Autor:** Manus AI  
**Documento:** `pasted_content_3.txt`  
**Estado:** análisis completado; no se inicia todavía la implementación de la Fase 3.

## 1. Resumen ejecutivo

La Fase 2 convierte la base multi-tenant de PEOPLE AI en un MVP operativo para una analista de Talento Humano. El núcleo de valor está compuesto por dos flujos: **cargos y plantillas reutilizables** y **contrataciones con seguimiento documental**. El HR Assistant, la base de conocimiento, los enlaces seguros y el almacenamiento documental deben quedar preparados, pero no deben convertirse todavía en integraciones productivas.

La Fase 1 ya proporciona una base sólida: autenticación Manus OAuth, rutas protegidas, RBAC, `companyId`, registros de auditoría, contratos desacoplados, navegación HR, tenant demo, candidatos demo y documentos de conocimiento demo. Sin embargo, la implementación actual todavía es principalmente de lectura y demostración. No existen aún entidades ni operaciones completas para cargos, plantillas, procesos de contratación, requisitos documentales por proceso, detalle de expediente o modificación aislada de documentos.

La recomendación es implementar la Fase 2 incrementalmente en cuatro bloques: **modelo de dominio**, **cargos y plantillas**, **contratación y seguimiento**, y **experiencia HR con validación**. No conviene construir todavía portal de candidato, carga real, OCR, separación de PDF, WhatsApp, Teams, chatbot productivo ni módulos de nómina o analítica.

## 2. Requisitos funcionales interpretados

| Área | Resultado esperado en Fase 2 | Alcance recomendado |
|---|---|---|
| Panel HR | Dashboard especializado para Alexa Torres con KPIs demo y acciones rápidas | Implementar y conectar a datos reales demo |
| Cargos | Crear, editar y consultar cargos por empresa | Implementar |
| Plantillas | Definir documentos reutilizables por cargo, con orden, obligatoriedad y tipo permitido | Implementar |
| Nueva contratación | Crear candidato y proceso seleccionando un cargo existente | Implementar |
| Requisitos por proceso | Copiar la plantilla al proceso y permitir modificaciones sin alterar la plantilla original | Implementar |
| Seguimiento | Listado filtrable, progreso, estado y detalle de contratación | Implementar |
| Portal candidato | Modelo de enlace seguro y expiración, sin portal completo | Preparar modelo; no construir UI completa |
| Documentos | Metadata, referencias y estados; no bytes ni carga real del candidato | Preparar contrato; S3 en fase posterior |
| HR Assistant | Chat demo conectado al puerto desacoplado, sin modelo real obligatorio | Mantener stub honesto y conectado |
| Knowledge base | Datos demo y contrato preparado | Mantener demo; no RAG productivo |
| Canales | Web disponible; WhatsApp y Teams como próximos | Mantener estados, sin integraciones reales |

## 3. Comparación con el estado actual

| Requisito de la Fase 2 | Estado actual | Brecha principal |
|---|---|---|
| Multi-tenancy y `companyId` | Implementado en helpers y procedimientos protegidos | Debe repetirse en todas las nuevas mutaciones y consultas |
| RBAC | Implementado para `SUPER_ADMIN`, `COMPANY_ADMIN`, `HR`, `FINANCE`, `MANAGER` y `EMPLOYEE` | Definir permisos de negocio concretos para cargos y contrataciones |
| Dashboard HR | Implementado con KPIs y navegación HR | Parte de los valores demo tienen fallback; conviene derivarlos completamente de agregaciones |
| Contrataciones | Existe `recruitment_candidates` y listado demo | Falta separar candidato, proceso y requisitos documentales |
| Cargos y plantillas | No existe modelo específico | Es la brecha estructural más importante |
| Nueva contratación | Botón placeholder | Falta formulario, selección de cargo, copia de plantilla y mutation |
| Seguimiento | Listado parcial | Faltan estados completos, filtros, fecha, progreso calculado y detalle |
| Modificación por proceso | No existe | Requiere snapshot de requisitos por proceso, no referencia mutable a la plantilla |
| Enlace seguro | No existe modelo | Requiere token aleatorio hashable, expiración, revocación y estado |
| Documentos | Existe `knowledge_base_documents` | No confundir conocimiento corporativo con documentos de candidatos |
| HR Assistant | Stub `LlmProvider` conectado por tRPC | Debe ampliarse para consultar contexto de contratación sin fingir IA real |
| Navegación | Subrutas HR diferenciadas | Debe añadir Cargos y plantillas y acciones rápidas coherentes |
| Pruebas | Auth, RBAC y aislamiento básico | Faltan pruebas de plantilla, snapshot, CRUD y rechazo cross-tenant |

## 4. Modelo de datos propuesto

La nueva capa debe conservar `companyId` en toda entidad de negocio. Las relaciones lógicas recomendadas son las siguientes:

| Entidad | Campos esenciales | Regla de aislamiento |
|---|---|---|
| `job_positions` | `id`, `companyId`, `name`, `description`, `status`, timestamps | Todas las lecturas y mutaciones requieren el tenant del contexto |
| `document_templates` | `id`, `companyId`, `positionId`, `name`, `version`, `status` | Una plantilla solo puede reutilizarse dentro de su empresa |
| `document_template_items` | `id`, `companyId`, `templateId`, `title`, `description`, `required`, `sortOrder`, `allowedMimeTypes` | `companyId` se valida contra la plantilla |
| `hiring_processes` | `id`, `companyId`, `candidateId`, `positionId`, `templateId`, `createdByUserId`, `status`, timestamps | El cargo, candidato y usuario deben pertenecer al mismo tenant |
| `hiring_requirements` | `id`, `companyId`, `processId`, `sourceTemplateItemId`, `title`, `required`, `sortOrder`, `status` | Es un snapshot editable por proceso; nunca muta la plantilla |
| `candidate_profiles` | `id`, `companyId`, `fullName`, `identificationNumber`, `email` | La identificación no es autenticación suficiente |
| `candidate_access_links` | `id`, `companyId`, `processId`, `tokenHash`, `expiresAt`, `revokedAt`, `status` | El token se valida por proceso y tenant; nunca se almacena en claro |
| `candidate_documents` | `id`, `companyId`, `processId`, `requirementId`, `originalName`, `normalizedName`, `fileKey`, `mimeType`, `sizeBytes`, `status` | Solo metadata en DB; bytes futuros en S3 |

La tabla actualmente llamada `recruitment_candidates` puede migrarse gradualmente hacia `candidate_profiles` y `hiring_processes`, o conservarse temporalmente como compatibilidad de demo. No conviene duplicar información indefinidamente: la separación debe ocurrir antes de agregar mutations productivas.

### Decisión clave: snapshot de requisitos

Al crear una contratación, el backend debe copiar los ítems activos de la plantilla a `hiring_requirements`. De esta manera, agregar un documento a “Practicante SENA” no cambia retroactivamente el expediente de Carlos Pérez. Una edición específica del proceso solo modifica sus requisitos propios. Esta decisión satisface simultáneamente la reutilización de plantillas y la independencia de cada contratación.

## 5. Estados y reglas de negocio

Los estados de contratación recomendados son `draft`, `pending`, `in_progress`, `complete`, `in_review` y `finalized`. El progreso debe calcularse desde `hiring_requirements`, contando requisitos recibidos frente al total obligatorio. Un proceso no debe marcarse como `complete` si falta un requisito obligatorio, salvo que exista una acción explícita de excepción registrada en `audit_logs`.

Cada mutation debe validar, en este orden, sesión, rol, pertenencia empresarial de la entidad relacionada, datos de entrada y transición de estado. Las operaciones administrativas de HR y Company Admin deben registrar resultado, módulo, usuario, empresa y metadata no sensible en auditoría.

## 6. Arquitectura de backend y contratos

La arquitectura existente debe extenderse sin reemplazarse. Se recomienda dividir los procedimientos en routers de dominio: `positions`, `templates`, `hiring`, `candidateLinks` y `hrAssistant`. Los helpers de DB deben recibir siempre `companyId` explícito o un contexto tenant derivado del usuario; no deben aceptar consultas globales para entidades de negocio.

Los procedimientos mínimos serían:

| Router | Procedimientos mínimos |
|---|---|
| `positions` | `list`, `get`, `create`, `update`, `archive` |
| `templates` | `list`, `getWithItems`, `create`, `update`, `cloneForPosition`, `archive` |
| `hiring` | `list`, `getDetail`, `create`, `updateStatus`, `addRequirement`, `updateRequirement`, `removeRequirement` |
| `candidateLinks` | `prepare`, `revoke`, `getStatus` |
| `hrAssistant` | `preview`, luego `ask` cuando exista proveedor configurado |

`LlmProvider`, `KnowledgeBasePort`, `IntegrationAdapter` y `DocumentStoragePort` deben mantenerse como puertos. El stub del asistente debe declarar que usa datos demo y no debe reportar un modelo productivo inexistente. La futura capa documental debe guardar solo metadata y referencias; nunca debe almacenar bytes en MySQL.

## 7. Experiencia de usuario propuesta

La navegación HR de la Fase 2 debe quedar así: **Inicio**, **Contrataciones**, **Cargos y plantillas**, **Asistente de Talento Humano**, **Base de conocimiento**, **Notificaciones** y **Configuración**. La pantalla de Cargos y plantillas debe ofrecer listado, búsqueda, estado, cantidad de documentos y acción de crear. El formulario de plantilla debe permitir agregar, ordenar, editar y eliminar documentos antes de guardar.

La pantalla Nueva contratación debe solicitar nombre, identificación, correo y cargo. Al elegir un cargo, debe mostrar los documentos copiados desde la plantilla y permitir editar esa lista antes de confirmar. El botón de creación debe mostrar validación, loading y resultado; después debe redirigir al detalle del proceso.

El detalle debe mostrar candidato, cargo, fecha, creador, progreso, estado y tabla de requisitos. Las acciones de enlace seguro, carga documental y renombrado deben mostrarse como preparadas o futuras, no como funcionalidades activas. Los filtros del listado deben ser combinables por cargo, estado, fecha y progreso.

## 8. Seguridad y multi-tenancy

El aislamiento no puede depender de la ruta ni de un `companyId` enviado por el navegador. El backend debe resolver el alcance desde `app_profiles` y permitir un `companyId` solicitado únicamente cuando `assertCompanyScope` lo autorice. Para usuarios con capacidad multiempresa futura, el tenant activo debe validarse contra membresías vigentes.

Las identificaciones de candidatos y los tokens de enlace son datos sensibles. La identificación debe almacenarse solo cuando sea necesaria y con controles de acceso. Los tokens deben generarse con suficiente entropía, almacenarse como hash y expirar o revocarse. Los errores de acceso deben ser genéricos y no revelar si existe un candidato en otra empresa.

## 9. Datos demo y pruebas obligatorias

El tenant `Empresa Demo — Talento Humano` debe contener al menos los cargos “Practicante SENA”, “Analista Administrativo” y “Auxiliar Administrativo”, con plantillas de seis, ocho y una cantidad coherente de documentos ficticios. Los candidatos Carlos Pérez, Laura Gómez, Andrés Rodríguez y María Torres deben estar asociados exclusivamente al mismo `companyId` demo.

| Caso | Validación |
|---|---|
| Crear cargo y plantilla | Se guardan seis documentos ordenados y obligatorios según el ejemplo |
| Crear contratación | Seleccionar “Practicante SENA” copia automáticamente sus seis requisitos |
| Reutilizar plantilla | Un segundo candidato recibe la misma configuración sin recrearla |
| Editar proceso | Agregar un requisito a un proceso no modifica la plantilla original |
| Cross-tenant | Un usuario HR no puede leer, modificar ni listar entidades de otra empresa |
| Detalle | El progreso y pendientes se calculan desde los requisitos del proceso |
| RBAC | Finance, Manager y Employee no pueden ejecutar mutations de HR |
| UI | El usuario HR solo ve los módulos de su experiencia demo |
| Calidad | `pnpm check`, `pnpm test` y `pnpm build` terminan correctamente |

Las pruebas Vitest deben cubrir tanto casos positivos como rechazos. Además de probar `assertCompanyScope`, conviene probar que un `templateId` de otra empresa no puede utilizarse al crear una contratación y que un proceso de otra empresa no puede abrirse por ID.

## 10. Priorización de implementación

| Prioridad | Entregable | Razón |
|---|---|---|
| P0 | Modelo de cargos, plantillas, ítems, candidatos, procesos y requisitos snapshot | Sin esto no existe el MVP real |
| P0 | Helpers y routers CRUD con RBAC y tenant scope | Protege los datos antes de exponer UI |
| P0 | Pantallas Cargos y plantillas, Nueva contratación y detalle | Entrega el flujo de valor principal |
| P1 | Listado con filtros, estados y progreso | Hace usable el seguimiento diario |
| P1 | Auditoría de mutations HR | Aumenta trazabilidad y seguridad operacional |
| P1 | Enlace seguro como metadata preparada | Permite Fase 3 sin rehacer el proceso |
| P2 | Preview más contextual del HR Assistant | Mejora la demostración sin activar IA productiva |
| P2 | Metadata documental y adapter S3 | Debe coincidir con la fase de documentos real |

## 11. Elementos explícitamente fuera de alcance

No se deben implementar en esta fase el portal completo del candidato, autenticación definitiva por cédula, carga real de archivos por candidatos, OCR, separación automática de PDF, renombrado automático, WhatsApp, Microsoft Teams, chatbot productivo, payroll, vacaciones, desempeño, beneficios, People Analytics ni Talent Intelligence. Implementar cualquiera de ellos ahora aumentaría riesgo y desviaría el MVP del problema de contratación documental.

## 12. Conclusión

La Fase 2 es viable sobre la arquitectura existente y no requiere reconstruir PEOPLE AI. La principal decisión técnica es separar la plantilla reutilizable del snapshot de requisitos de cada contratación. Con esa separación, el producto puede soportar cargos reutilizables, excepciones por candidato, progreso confiable y futura carga documental sin romper el aislamiento multi-tenant.

El siguiente paso recomendado es implementar P0 completo, empezando por el esquema y las pruebas de aislamiento, luego los procedimientos tRPC y finalmente las pantallas. La Fase 3 debe comenzar únicamente cuando los casos de aceptación de esta especificación estén automatizados y el flujo HR pueda ejecutarse de punta a punta con datos ficticios.
