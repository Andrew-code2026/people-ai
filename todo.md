# Project TODO

- [x] Definir el modelo relacional multi-tenant para empresas, usuarios, empleados, departamentos, roles, permisos y auditoría.
- [x] Mantener el usuario base de autenticación compatible con Manus OAuth y extenderlo con pertenencia empresarial y rol de plataforma.
- [x] Implementar aislamiento obligatorio por empresa en helpers de base de datos y procedimientos tRPC del backend.
- [x] Implementar RBAC backend para SUPER_ADMIN, COMPANY_ADMIN, HR, FINANCE, MANAGER y EMPLOYEE.
- [x] Dejar permisos granulares y membresías multiempresa preparados para una fase futura.
- [x] Implementar protección de rutas, sesión, logout y redirección por rol.
- [x] Evaluar y reutilizar DashboardLayout y componentes UI preconstruidos.
- [x] Crear sidebar y topbar responsive adaptadas al rol activo.
- [x] Crear dashboards iniciales por rol con datos estrictamente ficticios.
- [x] Mostrar módulos no implementados como Próximamente, sin páginas falsas.
- [x] Crear tres empresas demo aisladas: Bivien Demo, NovaTech Colombia y Andina Retail.
- [x] Crear departamentos, usuarios, managers y empleados ficticios para cada empresa demo.
- [x] Añadir estados de carga, vacío, error y feedback de acciones en la interfaz.
- [x] Preparar contratos desacoplados para IA, base de conocimiento, integraciones y almacenamiento de documentos.
- [x] Documentar arquitectura, carpetas, base de datos, seguridad, multi-tenancy, roles, extensibilidad y datos demo.
- [x] Añadir pruebas Vitest para autenticación, autorización por rol y aislamiento entre empresas.
- [x] Ejecutar validación de tipos, pruebas y verificación visual responsive.
- [x] Revisar todo el alcance y entregar instrucciones de prueba de cada rol.

## Historial

- [x] Analizar el archivo de requisitos proporcionado por el usuario.
- [x] Inicializar el proyecto full-stack PEOPLE AI.

- [x] Crear vistas o rutas de dashboard diferenciadas por rol, reutilizando layout común pero con contenido realmente específico.
- [x] Conectar la UI a procedimientos tRPC reales y añadir estados explícitos de carga, vacío y error, además de feedback de acciones.
- [x] Implementar contratos de código desacoplados para proveedor LLM, knowledge base por empresa, integraciones y metadata de documentos/storage.

- [x] Crear rutas protegidas reales para /platform, /company, /hr, /finance, /manager y /employee.
- [x] Refactorizar dashboards para reutilizar DashboardLayout como layout común autenticado.
- [x] Conectar una lista empresarial real vía tRPC con estados loading, empty y error visibles.

## Reestructuración de experiencia demo HR

- [x] Cambiar la experiencia visible a una demo exclusiva para la analista HR Alexa Torres sin eliminar roles internos.
- [x] Crear o utilizar el tenant ficticio Empresa Demo — Talento Humano y asociar sus datos a companyId.
- [x] Crear navegación HR exclusiva: Inicio, Contratación, HR Assistant, Base de conocimiento, Notificaciones y Configuración.
- [x] Implementar dashboard HR con saludo, KPIs demo y propuestas de valor de contratación y HR Assistant.
- [x] Crear sección demo de Contratación con procesos ficticios y acciones claramente preparadas para fase posterior.
- [x] Crear preview demo de HR Assistant usando el contrato desacoplado, sin IA real.
- [x] Crear sección demo de Base de conocimiento con documentos ficticios y carga marcada como futura.
- [x] Crear Configuración con estado real de canales Web, WhatsApp y Microsoft Teams.
- [x] Añadir datos demo de candidatos y procesos de contratación aislados por companyId.
- [x] Mantener roles, RBAC, multi-tenancy, auditoría, rutas protegidas y pruebas existentes.
- [x] Validar TypeScript, Vitest y experiencia responsive de la demo HR.
- [x] Actualizar documentación y preparar checkpoint de la reestructuración.

- [x] Crear navegación HR funcional con subrutas o secciones ancladas reales para Inicio, Contratación, HR Assistant, Base de conocimiento, Notificaciones y Configuración.
- [x] Implementar un adapter stub de HR Assistant que consuma explícitamente el contrato LlmProvider.
- [x] Mover Canales e integraciones a una vista real de Configuración accesible desde la navegación HR.
- [x] Guardar un nuevo checkpoint después de validar la reestructuración HR.

- [x] Crear contenido diferenciado para cada subruta HR o anchors reales con navegación visible.
- [x] Separar Canales e integraciones en una vista específica de /hr/settings.
- [x] Guardar un checkpoint nuevo posterior a la validación de esta reestructuración.

- [x] Guardar checkpoint final tras la reestructuración HR y la validación de TypeScript, Vitest y las vistas HR específicas.

## Fase 2 — análisis y planificación

- [x] Leer y analizar completamente pasted_content_3.txt.
- [x] Comparar los requisitos de la Fase 2 con la arquitectura y funcionalidades actuales.
- [x] Identificar dependencias, riesgos de seguridad, datos, integraciones y escalabilidad.
- [x] Separar funcionalidades implementables ahora de extensiones que requieren preparación o decisiones del usuario.
- [x] Definir un plan técnico priorizado para implementar la Fase 2 sin romper la Fase 1.
- [x] Entregar un documento de análisis de la Fase 2 con criterios de aceptación y próximos pasos.

## Fase 3 — análisis del portal del candidato

- [x] Analizar completamente pasted_content_4.txt como especificación de la Fase 3.
- [x] Comparar el portal del candidato con la arquitectura y el MVP existentes.
- [x] Evaluar seguridad de enlaces, identidad, expiración, archivos y aislamiento multi-tenant.
- [x] Definir el modelo de datos y los contratos necesarios para documentos y expedientes.
- [x] Separar implementación de esta fase frente a IA documental, WhatsApp, Teams y otras exclusiones.
- [x] Preparar un plan técnico priorizado y criterios de aceptación ejecutables.
- [x] Documentar y entregar el análisis de la Fase 3 sin implementarla todavía.

## Implementación acumulada Fases 2 y 3

- [x] Implementar cargos, plantillas y documentos de plantilla por empresa.
- [x] Implementar snapshot editable de requisitos por contratación.
- [x] Implementar creación, listado filtrable y detalle de contrataciones.
- [x] Implementar auditoría de las mutaciones administrativas existentes y validaciones backend para Fase 2.
- [x] Implementar enlaces seguros con hash, expiración, revocación y auditoría.
- [x] Implementar portal público de candidato sin cuenta normal.
- [x] Implementar carga individual privada con validación de MIME, extensión y tamaño.
- [x] Implementar reemplazo, eliminación, progreso y envío final bloqueado por faltantes.
- [x] Implementar renombrado normalizado conservando nombre original y metadata.
- [x] Implementar expediente administrativo base y descarga segura mediante URL firmada.
- [x] Implementar notificaciones internas por documentación completa.
- [x] Añadir pruebas unitarias críticas de Fase 2 y Fase 3 para helpers, seguridad y aislamiento.
- [x] Ejecutar TypeScript, tests y build y corregir errores.
- [x] Documentar implementación, pendientes reales y límites técnicos sin avanzar a Fase 4.

## Pendientes declarados de Fases 2 y 3

- [x] Documentar y diferir la integración de proveedor real de correo y OTP hasta contar con credenciales y proveedor aprobado.
- [x] Documentar y diferir la descarga ZIP organizada del expediente hasta definir la estrategia de streaming del runtime.
- [x] Añadir revisión administrativa explícita con estado verificado y apertura segura de documentos desde el expediente; rechazo avanzado queda para una iteración posterior.
- [x] Documentar que las futuras mutaciones de edición de cargos/procesos deberán registrar AuditLog con actor; las mutaciones actuales ya lo registran.

## Correcciones obligatorias detectadas antes del checkpoint

- [x] Implementar filtros reales y columnas completas en el listado de contrataciones (candidato, cargo, progreso, estado, fecha).
- [x] Registrar AuditLog con actor para las mutaciones administrativas implementadas; ediciones de cargos/procesos quedan declaradas como pendientes.
- [x] Endurecer la validación backend de archivos con extensión, MIME, tamaño y firmas mágicas de contenido.
- [x] Completar el expediente administrativo con abrir mediante URL firmada y revisión controlada verificando requisitos.
- [x] Exponer notificaciones internas vía tRPC y mostrarlas en la UI con enlace a la contratación.
- [x] Añadir pruebas de contrato para flujo público, tokens inválidos y límites de acceso, complementando RBAC y aislamiento existentes.

## Ajustes finales de precisión y seguridad

- [x] Verificar firmas mágicas del contenido del archivo en backend, además de extensión, MIME declarado y tamaño.
- [x] Acotar la auditoría a mutaciones implementadas y dejar pendiente la auditoría de edición de cargos/procesos hasta crear esas mutaciones.

## Cobertura crítica adicional

- [x] Probar límites reales de acceso en contratación/documentos: rol insuficiente y aislamiento cross-tenant.
- [x] Probar portal público con enlace expirado/revocado y envío incompleto con documentos faltantes.

## Fase 3.1 — análisis e implementación

- [x] Leer y analizar completamente pasted_content_6.txt.
- [x] Comparar la Fase 3.1 con las funcionalidades existentes de Fases 1, 2 y 3.
- [x] Definir migraciones, contratos y reglas de seguridad sin romper el aislamiento multi-tenant.
- [x] Implementar backend y persistencia de los nuevos flujos de Fase 3.1.
- [x] Implementar las vistas y acciones frontend requeridas por Fase 3.1.
- [x] Reutilizar datos demo ficticios existentes y mantener los roles y permisos existentes; los eventos de Fase 3.1 se generan bajo demanda.
- [x] Añadir pruebas de seguridad, flujo, errores y aislamiento mediante helpers y procedimientos tRPC sin sesión.
- [x] Validar TypeScript, Vitest y build; responsive de rutas protegidas queda pendiente de sesión manual.
- [x] Documentar la implementación, límites y pendientes reales de Fase 3.1.
- [x] Guardar checkpoint final de Fase 3.1.

## Cierre y verificación solicitada de Fase 3.1

- [x] Auditar cada requisito de enlaces, seguimiento, comunicaciones, recordatorios, alertas, ZIP, auditoría, RBAC, multi-tenancy y OTP.
- [x] Completar o verificar apertura, revocación, regeneración y expiración del enlace con actividad y auditoría.
- [x] Completar o verificar envío, recordatorio, cooldown, estado no configurado y plantillas de correo sin falsos éxitos.
- [x] Implementar alertas visuales de enlaces próximos a expirar en dashboard y notificaciones internas para documentación enviada; la alerta específica de expiración permanece visual.
- [x] Implementar descarga ZIP privada del expediente con auditoría.
- [x] Completar preparación OTP con hash, expiración, intentos e invalidación sin fingir proveedor.
- [x] Añadir pruebas para correo no configurado, cooldown, ZIP, auditoría y alertas.
- [x] Ejecutar validación automatizada del flujo con contratos y datos demo; documentar qué requiere sesión, storage y configuración externa.
- [x] Guardar checkpoint final sin avanzar a Fase 4.

## Validación sin sesión real

- [x] Ejecutar pruebas automatizadas de OTP, correo no configurado/configurado mock, plantillas, ZIP, enlaces y estados.
- [x] Ejecutar TypeScript y build sin enviar correos ni invocar proveedores externos reales.
- [x] Documentar como pendiente manual la navegación autenticada y la descarga ZIP contra objetos reales de storage.

## Pruebas faltantes detectadas por auditoría

- [x] Añadir prueba Vitest para el cooldown de recordatorios.
- [x] Añadir pruebas de contrato y helpers para confirmar acciones de correo, OTP y descarga ZIP; la persistencia se mantiene auditada en el dominio.
- [x] Añadir prueba para los helpers de expiración y alertas de enlaces próximos a expirar.

## Trazabilidad final de enlaces

- [x] Registrar AuditLog explícito cuando el candidato abre un enlace válido y cuando se detecta expiración.
- [x] Documentar formalmente que la alerta de expiración es visual; las notificaciones internas se generan para documentación enviada.

## Brechas de evidencia antes del checkpoint

- [x] Documentar formalmente que Fase 3.1 reutiliza procesos demo previos y genera comunicaciones/actividad/alertas/OTP bajo demanda, sin seed ficticio adicional.
- [x] Añadir pruebas de procedimientos tRPC Fase 3.1 para guards de comunicación, alertas, ZIP y tokens inválidos; los flujos con DB/storage quedan cubiertos por helpers y pendientes manuales.
- [x] Dejar marcada como pendiente manual la responsive de las rutas protegidas mientras el login del navegador siga bloqueado.

## Corrección de correo Fase 3.1 — mailto

- [x] Auditar el flujo actual de Resend y confirmar qué debe conservarse o retirarse.
- [x] Crear contrato de correo preparado con destinatario, asunto, cuerpo, candidato, cargo, empresa y enlace seguro.
- [x] Sustituir el envío automático por apertura de cliente mediante mailto, sin afirmar envío exitoso.
- [x] Añadir acción protegida “Marcar como enviado” con historial, actividad y AuditLog.
- [x] Eliminar la dependencia visible de Resend del flujo demo sin afectar otras arquitecturas.
- [x] Añadir pruebas de mailto, marcado manual, no falsos éxitos y efectos de dominio simulados.
- [x] Ejecutar la suite heredada y la nueva cobertura mailto y dominio, con 27 pruebas totales, TypeScript y build.
- [x] Verificar regresiones de ZIP, OTP, enlaces, recordatorios, notificaciones, auditoría, RBAC y multi-tenancy mediante suite completa y guards.
- [x] Documentar que la navegación responsive autenticada queda pendiente manual si no puede verificarse sin login.
- [x] Guardar checkpoint final sin avanzar a Fase 4.

## Validación específica mailto

- [x] Añadir prueba tRPC de bloqueo para marcar comunicación como enviada sin sesión.
- [x] Dejar como pendiente manual la verificación de Gmail/Outlook y responsive de rutas autenticadas, sin bloquear la entrega.

## Cobertura adicional del cambio mailto

- [x] Añadir prueba de dominio para preparar correo sin registro exitoso y para registrar manualmente comunicación, actividad y auditoría.
- [x] Ajustar documentación y checklist para reflejar 27 pruebas totales con cobertura mailto y de dominio.

## Pruebas de dominio de comunicación mailto

- [x] Añadir prueba de dominio para prepareCandidateEmail/prepareCandidateReminder confirmando que preparar no inserta comunicación exitosa ni auditoría.
- [x] Añadir prueba de dominio para markCommunicationSent verificando communicationLogs, processActivities y AuditLog con actor correcto.

- [x] Añadir prueba de dominio para prepareCandidateReminder confirmando que no inserta comunicación, actividad ni auditoría.

## Fase 4A — IA documental y People AI Assistant

- [x] Documentar el análisis de la especificación de Fase 4A y su integración incremental con Fases 1–3.1.
- [x] Diseñar entidades tenant-scoped para análisis documental, hallazgos, revisiones humanas, alertas, resúmenes y conversaciones.
- [x] Extender la abstracción AIProvider/servicio AI sin exponer credenciales ni acoplar la aplicación a un proveedor.
- [x] Implementar análisis documental estructurado con modo DEMO explícito y proveedor real configurable, sin inventar resultados.
- [x] Implementar identificación, clasificación, confianza, requisitos faltantes, inconsistencias y solicitud de revisión humana.
- [x] Preparar separación de PDF cuando sea técnicamente posible, conservando siempre el original y sin destruir storage.
- [x] Implementar revisión humana, corrección manual y auditoría de resultados de IA.
- [x] Implementar People AI Assistant con consultas reales tenant-scoped sobre contrataciones, documentos, estados y pendientes.
- [x] Implementar asistente contextual por contratación con respuestas transparentes y sin datos fuera del contexto autorizado.
- [x] Implementar acciones sugeridas con confirmación explícita para cualquier mutación sensible.
- [x] Implementar alertas AI Insights con estados de lectura, revisión y resolución sin spam.
- [x] Implementar resumen inteligente de contratación y actualización cuando cambien los datos relevantes.
- [x] Integrar las experiencias en HR y HiringDetailPage usando componentes existentes y diseño responsive.
- [x] Mantener preparados los contratos para Knowledge Base, WhatsApp y Teams sin implementar esos canales.
- [x] Añadir pruebas de IA documental, asistente DEMO, transparencia y no invención de datos.
- [x] Ejecutar TypeScript, suite completa de tests y build; corregir regresiones sin avanzar a Fase 5.
- [x] Documentar proveedor/modelo disponible, modo DEMO, datos procesados, privacidad, configuración externa y límites reales de Fase 4A.
- [x] Guardar checkpoint final de Fase 4A sin avanzar a WhatsApp, Teams ni otros módulos.

## Correcciones de cobertura Fase 4A

- [x] Añadir en HiringDetailPage un asistente contextual por proceso que llame a trpc.ai.ask con processId.
- [x] Implementar en la UI de revisión un flujo de corrección manual real para editar requisito asociado y/o tipo detectado.
- [x] Crear un diálogo de confirmación explícita para acciones sensibles sugeridas por la IA, con confirmar/cancelar y sin ejecución automática.
- [x] Volver a validar HR + detalle de contratación y añadir pruebas de estas superficies.

## Cobertura UI verificable Fase 4A

- [x] Añadir pruebas de contrato para asistente contextual, corrección manual y diálogo de confirmación explícita.
- [x] Reejecutar TypeScript, suite y build; actualizar el conteo real de pruebas.

## Exportación GitHub — PEOPLE AI Fase 4A

- [x] Revisar código, historial y archivos generados para detectar secretos, tokens, credenciales y documentos privados.
- [x] Verificar exclusión de .env; no existe .env local ni fue necesario un .env.example.
- [x] Verificar que no existan PDFs ni documentos reales de candidatos dentro del repositorio.
- [x] Ejecutar TypeScript, tests y build sin modificar funcionalidades de Fase 4A.
- [x] Revisar el diff final y conservar exactamente el estado actual.
- [ ] Crear repositorio privado people-ai y exportar el commit inicial solicitado.
- [ ] Confirmar la exportación y no avanzar a ninguna fase nueva.
