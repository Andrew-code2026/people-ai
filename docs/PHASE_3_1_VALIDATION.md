# Validación de Fase 3.1

## Alcance de esta validación

La Fase 3.1 reutiliza los procesos de contratación demo creados en las fases anteriores. No se añadió un seed ficticio separado para comunicaciones, actividad, alertas u OTP: esos registros y estados se generan bajo demanda cuando la analista realiza una acción o cuando el sistema resuelve una consulta de seguimiento. De esta forma se evita duplicar eventos demo y se conserva el aislamiento por `companyId`.

La validación se ejecutó sin iniciar sesión manualmente en el navegador de verificación y sin enviar correos reales ni ejecutar acciones externas de comunicación. Se utilizaron pruebas unitarias deterministas, mocks de transporte y contratos del dominio. Los datos demo existentes permanecen ficticios y aislados por `companyId`.

## Resultado por capacidad

| Capacidad | Resultado | Evidencia |
|---|---|---|
| Generar, regenerar, copiar, abrir y revocar enlace | Implementada | Mutaciones HR protegidas, token opaco hashado, URL solo en la respuesta de generación y apertura desde UI |
| Expiración | Implementada | Vigencia comprobada en backend y estado `expired` visible en el detalle |
| Seguimiento | Implementada | Actividades para generación, envío, apertura, carga, documentación completa y envío final |
| Historial de comunicaciones | Implementada | `communication_logs` y consulta protegida por empresa/proceso |
| Recordatorios | Implementada | Mutación protegida con cooldown configurable por `REMINDER_COOLDOWN_HOURS` |
| Notificaciones internas | Implementada | Notificación al analista al enviar documentación y vista existente de notificaciones |
| Alertas próximas a expirar | Implementada como alerta visual | Consulta protegida `expiringLinks` y alerta visible en el dashboard HR; no se crea una notificación interna automática de expiración |
| Expediente ZIP | Implementada | JSZip, URLs firmadas por documento, descarga explícita y AuditLog |
| Auditoría | Implementada | Enlaces, comunicaciones, OTP, documentos, envío y descarga registran actor o contexto de candidato |
| RBAC y multi-tenancy | Implementada | Todas las rutas administrativas verifican rol y `companyId`; el portal usa el tenant resuelto por hash del enlace |
| OTP | Preparado, no activo | Hash, expiración, cinco intentos e invalidación persistidos; la solicitud devuelve `not_configured` sin mostrar ni fingir código |
| Correo sin proveedor | Sustituida por mailto | No se consultan credenciales ni proveedores; se prepara un borrador local y no se registra envío hasta la acción manual |
| Correo con proveedor | Fuera de alcance | No se utiliza ningún proveedor automático en esta modalidad; la analista envía desde Gmail, Outlook u otro cliente configurado. Resend ya no participa en este flujo |
| Plantilla de correo | Implementada como borrador mailto | Incluye candidato, cargo, empresa y URL `/candidate/documents/{token}`; HTML/text escapan contenido dinámico y el cliente local se abre con `mailto:` |

## Validaciones ejecutadas

`pnpm check` terminó correctamente sin errores de TypeScript. `pnpm test` terminó con **27 pruebas exitosas en 7 archivos**, incluyendo guards de procedimientos tRPC, construcción y codificación `mailto:`, el contrato de registro manual de comunicación y las pruebas de dominio que confirman que preparar documentación o recordatorios no persiste envíos exitosos. `pnpm build` terminó correctamente para frontend y servidor. El build muestra únicamente la advertencia informativa de chunks JavaScript mayores a 500 kB.

## Pruebas no ejecutables sin sesión real

No se pudo completar manualmente la navegación autenticada en el navegador porque el formulario no aceptó correctamente el carácter `@`. Por esa razón quedan pendientes de verificación manual la interacción real de la analista con el dashboard protegido, el clic sobre cada control desde una sesión OAuth persistida y la descarga ZIP contra objetos reales de storage. Ninguna de estas limitaciones altera el resultado de las pruebas automatizadas.

Las notificaciones internas se generan cuando el candidato envía documentación; las alertas de enlaces próximos a expirar son deliberadamente visuales en el dashboard y no simulan una notificación automática. Los procedimientos administrativos de comunicación, alertas y ZIP tienen cobertura de bloqueo sin sesión. El flujo de correo de la demo no requiere Resend, API keys ni `PUBLIC_APP_URL`: prepara un borrador local con `mailto:` y solo registra envío cuando la analista pulsa explícitamente “Marcar como enviado”.

## Pendientes reales

La entrega no avanza a la Fase 4. Permanecen diferidos la activación de OTP con proveedor de correo o SMS, la entrega ZIP mediante streaming si los expedientes crecen significativamente, la prueba manual autenticada del flujo completo y la verificación del comportamiento del cliente Gmail/Outlook en un dispositivo real. Resend ya no es necesario para el correo de la demo.
