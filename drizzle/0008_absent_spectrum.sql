CREATE TABLE `invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('SUPER_ADMIN','COMPANY_ADMIN','HR','FINANCE','MANAGER','EMPLOYEE') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`invitedByUserId` int NOT NULL,
	`status` enum('active','accepted','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `activeCompanyId` int;--> statement-breakpoint
CREATE INDEX `invitations_company_idx` ON `invitations` (`companyId`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);