CREATE TABLE `ai_analysis_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`requestedByUserId` int NOT NULL,
	`providerMode` enum('demo','real') NOT NULL DEFAULT 'demo',
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`sourceDocumentId` int,
	`summary` text,
	`errorMessage` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `ai_analysis_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`model` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`processId` int,
	`title` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_document_findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`analysisRunId` int NOT NULL,
	`documentId` int,
	`requirementId` int,
	`sourcePageStart` int,
	`sourcePageEnd` int,
	`detectedType` varchar(180) NOT NULL,
	`suggestedName` varchar(255),
	`confidence` int NOT NULL,
	`status` enum('identified','review_required','confirmed','corrected','rejected') NOT NULL DEFAULT 'identified',
	`issueType` varchar(80),
	`issueMessage` varchar(500),
	`extractedData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_document_findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_hiring_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`summary` text NOT NULL,
	`dataFingerprint` varchar(128) NOT NULL,
	`model` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_hiring_summaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_summaries_process_idx` UNIQUE(`companyId`,`processId`)
);
--> statement-breakpoint
CREATE TABLE `ai_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int,
	`type` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`severity` enum('info','warning','critical','success') NOT NULL DEFAULT 'info',
	`status` enum('unread','read','reviewed','resolved') NOT NULL DEFAULT 'unread',
	`dedupeKey` varchar(220) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `ai_insights_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_insights_company_dedupe_idx` UNIQUE(`companyId`,`dedupeKey`)
);
--> statement-breakpoint
CREATE INDEX `ai_runs_company_idx` ON `ai_analysis_runs` (`companyId`);--> statement-breakpoint
CREATE INDEX `ai_runs_process_idx` ON `ai_analysis_runs` (`processId`);--> statement-breakpoint
CREATE INDEX `ai_messages_company_idx` ON `ai_conversation_messages` (`companyId`);--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_idx` ON `ai_conversation_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `ai_conversations_company_idx` ON `ai_conversations` (`companyId`);--> statement-breakpoint
CREATE INDEX `ai_conversations_user_idx` ON `ai_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `ai_conversations_process_idx` ON `ai_conversations` (`processId`);--> statement-breakpoint
CREATE INDEX `ai_findings_company_idx` ON `ai_document_findings` (`companyId`);--> statement-breakpoint
CREATE INDEX `ai_findings_process_idx` ON `ai_document_findings` (`processId`);--> statement-breakpoint
CREATE INDEX `ai_findings_run_idx` ON `ai_document_findings` (`analysisRunId`);--> statement-breakpoint
CREATE INDEX `ai_summaries_company_idx` ON `ai_hiring_summaries` (`companyId`);--> statement-breakpoint
CREATE INDEX `ai_insights_company_idx` ON `ai_insights` (`companyId`);--> statement-breakpoint
CREATE INDEX `ai_insights_process_idx` ON `ai_insights` (`processId`);