# PEOPLE AI — Análisis y plan de implementación de la Fase 3

**Autor:** Manus AI  
**Fuente:** `pasted_content_4.txt`  
**Estado:** análisis completado; la Fase 3 no se implementa todavía.

## 1. Resumen ejecutivo

La Fase 3 añade el **Portal del Candidato**, la carga individual de documentos, el expediente digital para la analista, el renombrado normalizado y el seguimiento de estados. Es una evolución natural de la Fase 2, pero introduce superficies de riesgo mayores: enlaces bearer, documentos potencialmente sensibles, acceso sin cuenta tradicional, URLs protegidas y cambios de estado que deben quedar auditados.

La Fase 1 y la Fase 2 ya aportan multi-tenancy, `companyId`, RBAC, autenticación de la analista, contratos desacoplados, tenant demo, navegación HR, candidatos y conocimiento demo. No obstante, la base actual no contiene todavía un flujo de candidato ni un almacenamiento documental operacional. La especificación también presupone entidades de Fase 2 que deben estar realmente separadas: candidato, contratación, requisitos por proceso y plantilla reutilizable.

La Fase 3 es viable si se implementa como un **subdominio de acceso público controlado**, separado del panel administrativo. El candidato no debe convertirse en usuario normal ni entrar al dashboard. Su autorización debe derivarse de un token aleatorio de un solo propósito, validado contra contratación, candidato, empresa, estado y expiración. El backend debe operar siempre sobre el `companyId` resuelto internamente, nunca sobre uno recibido de forma confiable desde el cliente.

## 2. Alcance funcional

| Capacidad | Alcance de Fase 3 | Decisión |
|---|---|---|
| Generar enlace | La analista crea un enlace seguro desde el detalle | Implementar |
| Copiar enlace | Mostrar y copiar URL sin datos sensibles | Implementar |
| Enviar correo | Solo dejar preparado si no existe proveedor | No simular envío |
| Acceso candidato | Página pública por token con validación adicional demo/OTP preparada | Implementar token; OTP real opcional preparado |
| Bienvenida | Mostrar candidato, cargo y empresa mínima | Implementar |
| Checklist | Una fila por requisito con estado y carga individual | Implementar |
| Archivos | PDF, JPG/JPEG y PNG con MIME, extensión y tamaño validados | Implementar con almacenamiento seguro |
| Reemplazar/eliminar | Permitido antes del envío definitivo | Implementar con auditoría |
| Progreso | Actualización inmediata por proceso | Implementar |
| Envío final | Bloquear si faltan obligatorios y cambiar a `in_review` | Implementar |
| Expediente analista | Ver, revisar, reemplazar, eliminar y descargar documentos | Implementar según permisos |
| Renombrado | Guardar nombre original y normalizado basado en requisito | Implementar |
| ZIP | Descargar expediente organizado si la infraestructura lo soporta | P1; si no, botón no activo |
| Notificación interna | Crear evento cuando el candidato envía completo | Implementar usando mecanismo interno |
| OCR/IA documental | Analizar contenido automáticamente | Fuera de alcance |
| WhatsApp/Teams | Integraciones externas | Fuera de alcance |

## 3. Comparación con el estado actual

| Requisito | Estado actual de PEOPLE AI | Brecha |
|---|---|---|
| Panel HR | Existe dashboard especializado para Alexa Torres | Reutilizarlo como origen del enlace y expedientes |
| Candidatos | Existe `recruitment_candidates` con datos demo | Separar o extender hacia perfil de candidato y proceso |
| Contrataciones | Existe listado demo de lectura | Faltan proceso real, requisitos y detalle |
| Cargos/plantillas | Analizados para Fase 2, pero no aparecen en el esquema actual revisado | Deben existir antes de copiar requisitos al proceso |
| Documentos de conocimiento | Existe `knowledge_base_documents` | No debe reutilizarse para documentos personales del candidato |
| Storage | Existe contrato `DocumentStoragePort`, pero no flujo candidato operativo | Requiere adaptador S3 y URLs presignadas protegidas |
| Enlaces seguros | No hay tabla ni procedimientos | Requiere token hashable, expiración, revocación y auditoría |
| Portal público | No existe ruta de candidato | Requiere router público limitado por token |
| Identidad | OAuth protege a la analista | El candidato requiere acceso efímero, sin cuenta normal |
| Auditoría | Existe `audit_logs` | Añadir eventos de enlace, carga, reemplazo, eliminación y envío |
| Notificaciones | Hay arquitectura de notificación general | Añadir notificación interna asociada al proceso |
| Pruebas | Auth, RBAC y aislamiento básico | Faltan pruebas de token, archivo, progreso y envío final |

La Fase 3 no debe intentar resolver estas brechas improvisando campos dentro de `recruitment_candidates`. La decisión recomendada es hacer explícito el modelo de contratación de Fase 2 y agregar encima la capa de acceso y documentos de Fase 3.

## 4. Modelo de datos propuesto

| Entidad | Campos principales | Propósito |
|---|---|---|
| `candidate_profiles` | `id`, `companyId`, `fullName`, `identificationNumber`, `email` | Identidad de negocio del candidato, sin cuenta de usuario |
| `hiring_processes` | `id`, `companyId`, `candidateId`, `positionId`, `createdByUserId`, `status`, timestamps | Proceso de contratación independiente |
| `hiring_requirements` | `id`, `companyId`, `processId`, `title`, `description`, `required`, `sortOrder`, `status` | Snapshot editable de requisitos por contratación |
| `candidate_access_links` | `id`, `companyId`, `processId`, `candidateId`, `tokenHash`, `createdAt`, `expiresAt`, `revokedAt`, `status`, `lastUsedAt` | Acceso seguro sin cuenta tradicional |
| `candidate_documents` | `id`, `companyId`, `processId`, `requirementId`, `originalName`, `normalizedName`, `fileKey`, `mimeType`, `sizeBytes`, `checksum`, `status`, timestamps | Metadata de documentos y trazabilidad |
| `internal_notifications` | `id`, `companyId`, `recipientUserId`, `processId`, `type`, `title`, `readAt`, timestamps | Avisos internos para la analista |

El campo `fileKey` debe apuntar al almacenamiento de objetos, no contener bytes. `sourceRef` o referencias de conocimiento no deben mezclarse con documentos de contratación. Todos los registros de la tabla, incluidos índices y consultas, deben conservar `companyId`.

### Estado de los requisitos

Se recomienda un enum mínimo `pending`, `uploaded`, `replaced`, `removed` y `verified`. El estado `uploaded` indica presencia, no aprobación documental. La revisión de la analista debe ser una acción separada para no confundir recepción con validación.

### Estado de enlaces

Los enlaces deben soportar `active`, `expired`, `revoked` y `completed`. Regenerar un enlace debe revocar el anterior. Si el proceso ya fue enviado o cerrado, el backend debe aplicar una política explícita para permitir o impedir nuevos enlaces.

## 5. Seguridad del enlace y del acceso candidato

El enlace debe construirse con un token criptográficamente aleatorio de alta entropía. La URL solo puede incluir el token opaco, por ejemplo `/candidate/documents/<token>`. No debe incluir ID incremental, `companyId`, número de identificación, nombre, correo ni cargo.

El servidor debe guardar únicamente un hash del token. Al recibirlo, calcula el hash y busca el registro activo. La autorización efectiva debe comprobar la cadena completa:

> token válido → enlace activo → contratación válida → candidato asociado → empresa asociada → proceso no revocado ni expirado.

La respuesta de un token inválido, expirado o revocado debe ser genérica y no revelar si existió alguna vez. Deben aplicarse límites de intento y evitar registrar el token en logs, URLs analíticas o mensajes de error.

El número de identificación puede utilizarse como factor adicional de demostración, pero no como autenticación definitiva. La arquitectura debe dejar un puerto para OTP por correo y una tabla o mecanismo de desafío temporal, sin afirmar que el correo real está habilitado si no existe proveedor configurado.

## 6. Seguridad de archivos y almacenamiento

La carga debe validarse en servidor, no únicamente en el navegador. Las validaciones mínimas son extensión permitida, MIME declarado, detección razonable del tipo real, tamaño máximo y nombre sanitizado. Los nombres enviados por el candidato nunca deben controlar el nombre final ni la ruta lógica.

Los archivos deben almacenarse bajo claves no predecibles y no públicas, por ejemplo un prefijo interno que incluya identificadores opacos del tenant y proceso. La URL de descarga debe ser presignada, corta y generada solo después de validar permisos. Nunca debe exponerse una URL permanente pública para documentos personales.

El nombre normalizado debe generarse desde el título del requisito y la extensión validada: `Hoja de vida personal.pdf` o `Cédula de ciudadanía.jpg`. Deben conservarse simultáneamente `originalName` y `normalizedName`. Para evitar colisiones, la clave física puede incluir un UUID aunque el nombre presentado al usuario sea normalizado.

El sistema no debe ejecutar archivos, interpretar PDF con IA ni confiar ciegamente en contenido activo. OCR, clasificación, separación de PDF y detección documental se reservan para la Fase 4.

## 7. Flujos principales

### Flujo de la analista

La analista abre una contratación, revisa candidato, cargo y requisitos, y selecciona “Generar enlace para candidato”. El backend crea o regenera el enlace, revoca cualquier enlace activo anterior según la política definida, registra auditoría y devuelve una URL copiable. El panel debe mostrar expiración y estado sin revelar el token completo más tiempo del necesario.

Desde el detalle, la analista ve progreso, estado de cada requisito, nombre original, nombre normalizado, fecha y tamaño. Puede abrir una URL protegida, descargar, reemplazar o eliminar si su rol y permiso lo permiten. La eliminación no debe borrar la evidencia de auditoría.

### Flujo del candidato

El candidato abre el enlace y recibe una página móvil, sin sidebar administrativo ni información de otros candidatos. Tras la validación del enlace y, si está disponible, el factor adicional, ve bienvenida, cargo, empresa mínima, checklist y progreso. Cada requisito tiene su propio selector de archivo.

Antes del envío final puede reemplazar o eliminar cargas. Si faltan obligatorios, el botón de envío queda bloqueado y se enumeran los faltantes. Si todos están completos, se solicita confirmación y luego el proceso cambia a `in_review`; se registra auditoría y se crea notificación interna.

## 8. Rutas y contratos recomendados

| Contexto | Ruta/procedimiento | Protección |
|---|---|---|
| Analista | `/hr/contratacion/:id` | OAuth + RBAC + company scope |
| Analista | `hiring.generateCandidateLink` | OAuth + HR/Company Admin + scope |
| Candidato | `/candidate/documents/:token` | Token hash + estado + expiración |
| Candidato | `candidatePortal.getSession` | Token válido; respuesta mínima |
| Candidato | `candidatePortal.upload` | Token + requisito del mismo proceso + validación archivo |
| Candidato | `candidatePortal.replace` | Token + estado editable + archivo válido |
| Candidato | `candidatePortal.remove` | Token + estado editable |
| Candidato | `candidatePortal.submit` | Token + todos los obligatorios completos |
| Analista | `hiring.getDocumentMetadata` | OAuth + RBAC + company scope |
| Analista | `hiring.getDownloadUrl` | OAuth + RBAC + storage authorization |
| Interno | `notifications.list` | OAuth + recipient + company scope |

Los procedimientos de candidato no deben reutilizar `protectedProcedure` basado en usuario OAuth. Deben utilizar un contexto de portal específico que no exponga el objeto `user` administrativo ni permita convertir el token en sesión permanente.

## 9. Auditoría y notificaciones

Registrar, como mínimo, `candidate_link_generated`, `candidate_link_used`, `candidate_document_uploaded`, `candidate_document_replaced`, `candidate_document_removed`, `candidate_submission_sent`, `hiring_document_reviewed` y `candidate_link_revoked`. El registro debe incluir empresa, usuario cuando exista, proceso, resultado y metadata no sensible. Nunca deben guardarse bytes, tokens en claro ni documentos dentro de `audit_logs`.

Cuando el candidato envíe todos los documentos obligatorios, crear una notificación interna para la analista de la misma empresa. La notificación debe enlazar al proceso por una ruta administrativa protegida y no incluir enlaces públicos ni información excesiva en el texto de previsualización.

## 10. Pruebas obligatorias

| Prueba | Resultado esperado |
|---|---|
| Crear contratación con plantilla | Los requisitos quedan copiados como snapshot |
| Generar enlace | URL sin ID incremental, `companyId`, cédula ni datos personales |
| Token alterado | Acceso rechazado con respuesta genérica |
| Token expirado/revocado | Página de enlace no disponible; sin filtración interna |
| Acceso candidato | Solo ve su proceso y requisitos |
| MIME/extensión/tamaño inválido | Carga rechazada en backend |
| Carga válida | Guarda metadata, original, normalizado, tamaño y fecha |
| Reemplazo | Sustituye la versión activa y conserva auditoría |
| Eliminación | Cambia estado y actualiza progreso |
| Envío incompleto | Bloqueado y muestra requisitos obligatorios faltantes |
| Envío completo | Estado cambia a `in_review` y genera notificación |
| Cross-tenant por proceso | Rechazo aunque se conozca el ID |
| Cross-tenant por token | Rechazo si la cadena no coincide |
| Acceso analista sin permiso | No puede descargar, eliminar ni reemplazar |
| Responsive | Portal usable primero en celular, luego tablet y desktop |
| Calidad | TypeScript, tests y build exitosos |

## 11. Priorización

| Prioridad | Trabajo | Motivo |
|---|---|---|
| P0 | Separar candidato, contratación y requisitos snapshot | Base correcta para todo el flujo |
| P0 | Enlace seguro hashable con expiración y revocación | Superficie crítica de seguridad |
| P0 | Portal candidato de lectura + checklist | Entrega el flujo principal |
| P0 | Storage privado y carga individual validada | Maneja datos sensibles de forma segura |
| P0 | Envío final, progreso y auditoría | Cierra el ciclo con la analista |
| P1 | Expediente administrativo, descarga y reemplazo | Completa operación de HR |
| P1 | Notificaciones internas | Reduce seguimiento manual |
| P1 | ZIP organizado | Mejora operativa, pero puede depender de infraestructura adicional |
| P2 | OTP real por correo | Refuerzo de identidad cuando exista proveedor |
| P2 | IA documental, OCR, WhatsApp y Teams | Fase 4 o posteriores |

## 12. Decisiones y riesgos relevantes

El mayor riesgo es mezclar el acceso del candidato con la autenticación administrativa. La solución debe mantener dos contextos: sesión OAuth para la analista y sesión efímera de portal basada en token para el candidato. El segundo contexto debe tener menos datos y menos operaciones.

El segundo riesgo es guardar documentos como URLs públicas o en la base de datos. La solución debe usar storage privado, metadata en DB y URLs temporales. El tercer riesgo es cambiar una plantilla histórica al editarla. La contratación debe conservar un snapshot de requisitos para que sus expedientes no cambien retroactivamente.

El ZIP debe tratarse con honestidad operacional: si el runtime o el storage no permiten generarlo de forma segura dentro de la solicitud, se debe dejar la acción marcada como próxima y explicar la dependencia, nunca presentar un botón que no funciona.

## 13. Conclusión

La Fase 3 es viable, pero no es solo una pantalla de carga: requiere una frontera de seguridad pública, almacenamiento privado, trazabilidad y separación estricta entre usuario administrativo y candidato. La implementación debe comenzar por el modelo de contratación de Fase 2, continuar con enlaces hashables y storage privado, y terminar con el portal móvil y el expediente para la analista.

La Fase 4 debe iniciar únicamente después de automatizar los casos de token, archivo, progreso, envío, auditoría y aislamiento. OCR, clasificación, análisis inteligente, WhatsApp, Teams y HR Assistant productivo deben permanecer fuera del alcance de esta fase.
