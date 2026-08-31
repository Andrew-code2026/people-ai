CREATE TABLE `knowledge_base_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('demo','draft','published') NOT NULL DEFAULT 'demo',
	`sourceRef` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_base_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruitment_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`candidateName` varchar(160) NOT NULL,
	`position` varchar(140) NOT NULL,
	`documentsReceived` int NOT NULL DEFAULT 0,
	`documentsRequired` int NOT NULL DEFAULT 9,
	`status` enum('pending','complete','review') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recruitment_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `knowledge_company_idx` ON `knowledge_base_documents` (`companyId`);--> statement-breakpoint
CREATE INDEX `recruitment_company_idx` ON `recruitment_candidates` (`companyId`);