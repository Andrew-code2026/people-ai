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
