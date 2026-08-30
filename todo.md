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
