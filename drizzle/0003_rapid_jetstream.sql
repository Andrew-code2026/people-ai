CREATE TABLE `candidate_access_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`candidateId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`status` enum('active','expired','revoked','completed') NOT NULL DEFAULT 'active',
	CONSTRAINT `candidate_access_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidate_access_links_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `candidate_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`requirementId` int NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`normalizedName` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`checksum` varchar(128),
	`status` enum('active','removed','verified') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidate_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidate_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`fullName` varchar(180) NOT NULL,
	`identificationNumber` varchar(80) NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_template_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`templateId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`required` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`allowedMimeTypes` varchar(300) NOT NULL DEFAULT 'application/pdf,image/jpeg,image/png',
	CONSTRAINT `document_template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`positionId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hiring_processes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`candidateId` int NOT NULL,
	`positionId` int NOT NULL,
	`templateId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`status` enum('draft','pending','in_progress','complete','in_review','finalized') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hiring_processes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hiring_requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`sourceTemplateItemId` int,
	`title` varchar(180) NOT NULL,
	`description` text,
	`required` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('pending','uploaded','replaced','removed','verified') NOT NULL DEFAULT 'pending',
	CONSTRAINT `hiring_requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internal_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`recipientUserId` int NOT NULL,
	`processId` int,
	`type` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internal_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `links_company_idx` ON `candidate_access_links` (`companyId`);--> statement-breakpoint
CREATE INDEX `links_process_idx` ON `candidate_access_links` (`processId`);--> statement-breakpoint
CREATE INDEX `documents_company_idx` ON `candidate_documents` (`companyId`);--> statement-breakpoint
CREATE INDEX `documents_process_idx` ON `candidate_documents` (`processId`);--> statement-breakpoint
CREATE INDEX `documents_requirement_idx` ON `candidate_documents` (`requirementId`);--> statement-breakpoint
CREATE INDEX `candidates_company_idx` ON `candidate_profiles` (`companyId`);--> statement-breakpoint
CREATE INDEX `template_items_company_idx` ON `document_template_items` (`companyId`);--> statement-breakpoint
CREATE INDEX `template_items_template_idx` ON `document_template_items` (`templateId`);--> statement-breakpoint
CREATE INDEX `templates_company_idx` ON `document_templates` (`companyId`);--> statement-breakpoint
CREATE INDEX `templates_position_idx` ON `document_templates` (`positionId`);--> statement-breakpoint
CREATE INDEX `hiring_company_idx` ON `hiring_processes` (`companyId`);--> statement-breakpoint
CREATE INDEX `hiring_candidate_idx` ON `hiring_processes` (`candidateId`);--> statement-breakpoint
CREATE INDEX `requirements_company_idx` ON `hiring_requirements` (`companyId`);--> statement-breakpoint
CREATE INDEX `requirements_process_idx` ON `hiring_requirements` (`processId`);--> statement-breakpoint
CREATE INDEX `notifications_company_idx` ON `internal_notifications` (`companyId`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_idx` ON `internal_notifications` (`recipientUserId`);--> statement-breakpoint
CREATE INDEX `positions_company_idx` ON `job_positions` (`companyId`);