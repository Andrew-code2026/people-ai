CREATE TABLE `communication_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`userId` int,
	`type` varchar(40) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(240) NOT NULL,
	`status` enum('not_sent','sent','error','delivered','opened') NOT NULL DEFAULT 'not_sent',
	`errorMessage` text,
	`sentAt` timestamp,
	`cooldownUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communication_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_communication_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`senderName` varchar(160) NOT NULL DEFAULT 'Equipo de Talento Humano',
	`senderEmail` varchar(320),
	`logoUrl` varchar(500),
	`signature` text,
	`subjectTemplate` varchar(240),
	`bodyTemplate` text,
	`reminderTemplate` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_communication_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_communication_settings_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `process_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`actorType` enum('analyst','candidate','system') NOT NULL,
	`actorUserId` int,
	`type` varchar(80) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `process_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `communications_company_idx` ON `communication_logs` (`companyId`);--> statement-breakpoint
CREATE INDEX `communications_process_idx` ON `communication_logs` (`processId`);--> statement-breakpoint
CREATE INDEX `communications_recipient_idx` ON `communication_logs` (`recipient`);--> statement-breakpoint
CREATE INDEX `activities_company_idx` ON `process_activities` (`companyId`);--> statement-breakpoint
CREATE INDEX `activities_process_idx` ON `process_activities` (`processId`);