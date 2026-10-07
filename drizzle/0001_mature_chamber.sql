CREATE UNIQUE INDEX `members_space_user_unique` ON `members` (`space_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `members_user` ON `members` (`user_id`);--> statement-breakpoint
CREATE INDEX `plans_space` ON `plans` (`space_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `spaces_owner_unique` ON `spaces` (`owner_id`);