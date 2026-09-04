-- Auth local: hash de contrasena, versionado de sesion e identidad unica por correo.
--
-- Nota: `drizzle-kit generate` incluyo aqui tambien `job_positions.templateId`,
-- `document_templates.positionId` y `positions_template_idx`. Se retiraron a proposito:
-- las dos primeras ya las aplica `ensureSchema()` en caliente (server/db.ts:14,20), de modo
-- que la base viva ya las tiene y el ADD abortaria toda la migracion. Esa deriva de esquema
-- queda igual que antes de este cambio; no se corrige aqui.
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `sessionVersion` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_idx` UNIQUE(`email`);
