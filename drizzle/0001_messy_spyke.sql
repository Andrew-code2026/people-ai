CREATE TABLE `app_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`role` enum('SUPER_ADMIN','COMPANY_ADMIN','HR','FINANCE','MANAGER','EMPLOYEE') NOT NULL,
	`status` enum('active','invited','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_user_company_idx` UNIQUE(`userId`,`companyId`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`userId` int,
	`action` varchar(120) NOT NULL,
	`module` varchar(80) NOT NULL,
	`result` enum('success','denied','error') NOT NULL,
	`metadata` text,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`legalName` varchar(220) NOT NULL,
	`logo` varchar(500),
	`industry` varchar(120),
	`country` varchar(80) NOT NULL DEFAULT 'Colombia',
	`city` varchar(100),
	`timezone` varchar(80) NOT NULL DEFAULT 'America/Bogota',
	`status` enum('active','suspended','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`managerEmployeeId` int,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int,
	`departmentId` int,
	`managerId` int,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`employeeCode` varchar(50) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(40),
	`position` varchar(140),
	`hireDate` timestamp,
	`employmentStatus` enum('active','leave','terminated') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_company_code_idx` UNIQUE(`companyId`,`employeeCode`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(120) NOT NULL,
	`description` text,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`roleId` int NOT NULL,
	`permissionId` int NOT NULL,
	CONSTRAINT `role_permission_pair_idx` UNIQUE(`roleId`,`permissionId`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`key` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`isSystem` boolean NOT NULL DEFAULT false,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_scope_key_idx` UNIQUE(`companyId`,`key`)
);
--> statement-breakpoint
CREATE INDEX `profiles_company_idx` ON `app_profiles` (`companyId`);--> statement-breakpoint
CREATE INDEX `audit_company_idx` ON `audit_logs` (`companyId`);--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `departments_company_idx` ON `departments` (`companyId`);--> statement-breakpoint
CREATE INDEX `employees_company_idx` ON `employees` (`companyId`);