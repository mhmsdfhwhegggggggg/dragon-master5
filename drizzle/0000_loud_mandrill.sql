CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`account_id` integer,
	`action` text NOT NULL,
	`details` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`account_id`) REFERENCES `telegram_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `anti_ban_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`rule_type` text NOT NULL,
	`config` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`triggered_count` integer DEFAULT 0 NOT NULL,
	`last_triggered_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `telegram_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bulk_operations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_targets` integer DEFAULT 0 NOT NULL,
	`processed_targets` integer DEFAULT 0 NOT NULL,
	`success_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`config` text NOT NULL,
	`message_template` text,
	`delay_ms` integer DEFAULT 2000 NOT NULL,
	`auto_repeat` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`started_at` integer,
	`completed_at` integer,
	`error_message` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extracted_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`username` text,
	`first_name` text,
	`last_name` text,
	`phone_number` text,
	`is_bot` integer DEFAULT false,
	`is_premium` integer DEFAULT false,
	`source_group_id` text NOT NULL,
	`source_group_title` text,
	`extracted_at` integer,
	`last_seen_online` integer,
	`is_active` integer DEFAULT true,
	`metadata` text,
	FOREIGN KEY (`account_id`) REFERENCES `telegram_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `group_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` text NOT NULL,
	`title` text NOT NULL,
	`username` text,
	`member_count` integer,
	`description` text,
	`is_public` integer DEFAULT true,
	`last_scraped_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_metadata_group_id_unique` ON `group_metadata` (`group_id`);--> statement-breakpoint
CREATE TABLE `operation_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`operation_id` integer NOT NULL,
	`target_id` text NOT NULL,
	`target_type` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`processed_at` integer,
	`metadata` text,
	FOREIGN KEY (`operation_id`) REFERENCES `bulk_operations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `proxy_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer,
	`host` text NOT NULL,
	`port` integer NOT NULL,
	`type` text DEFAULT 'socks5' NOT NULL,
	`username` text,
	`password` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_checked_at` integer,
	`is_working` integer DEFAULT true,
	`created_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `telegram_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rate_limit_tracking` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`action_type` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL,
	`window_end` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `telegram_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`session_string` text NOT NULL,
	`is_valid` integer DEFAULT true NOT NULL,
	`invalidated_at` integer,
	`invalidation_reason` text,
	`created_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `telegram_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `statistics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`messages_sent` integer DEFAULT 0 NOT NULL,
	`messages_failed` integer DEFAULT 0 NOT NULL,
	`members_extracted` integer DEFAULT 0 NOT NULL,
	`groups_joined` integer DEFAULT 0 NOT NULL,
	`users_added` integer DEFAULT 0 NOT NULL,
	`accounts_restricted` integer DEFAULT 0 NOT NULL,
	`operations_completed` integer DEFAULT 0 NOT NULL,
	`operations_failed` integer DEFAULT 0 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `telegram_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`phone_number` text NOT NULL,
	`telegram_id` text,
	`first_name` text,
	`last_name` text,
	`username` text,
	`session_string` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_restricted` integer DEFAULT false NOT NULL,
	`restriction_reason` text,
	`warming_level` integer DEFAULT 0 NOT NULL,
	`messages_sent_today` integer DEFAULT 0 NOT NULL,
	`daily_limit` integer DEFAULT 100 NOT NULL,
	`last_activity_at` integer,
	`last_restricted_at` integer,
	`created_at` integer,
	`updated_at` integer,
	`api_id` integer,
	`api_hash` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_accounts_phone_number_unique` ON `telegram_accounts` (`phone_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_accounts_telegram_id_unique` ON `telegram_accounts` (`telegram_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);