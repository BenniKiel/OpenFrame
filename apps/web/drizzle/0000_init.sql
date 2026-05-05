CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`document_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);