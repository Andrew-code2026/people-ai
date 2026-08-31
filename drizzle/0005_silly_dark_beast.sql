CREATE TABLE `candidate_otp_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`processId` int NOT NULL,
	`codeHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 5,
	`invalidatedAt` timestamp,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_otp_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `otp_company_idx` ON `candidate_otp_challenges` (`companyId`);--> statement-breakpoint
CREATE INDEX `otp_process_idx` ON `candidate_otp_challenges` (`processId`);