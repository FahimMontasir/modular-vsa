CREATE TABLE "notification_announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by_id" text NOT NULL,
	"message_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"action_url" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_announcement_target" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"kind" text NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "notification_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"source" text,
	"created_by_id" text,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_conversation_participant" (
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_conversation_participant_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_device_registration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"fid" text NOT NULL,
	"platform" text DEFAULT 'web' NOT NULL,
	"user_agent" text,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"disabled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_id" text,
	"kind" text NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"action_url" text,
	"deleted_at" timestamp,
	"deleted_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_message_recipient" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp,
	"hidden_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_message_recipient_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notification_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_announcement" ADD CONSTRAINT "notification_announcement_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_announcement" ADD CONSTRAINT "notification_announcement_message_id_notification_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."notification_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_announcement_target" ADD CONSTRAINT "notification_announcement_target_announcement_id_notification_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."notification_announcement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_conversation" ADD CONSTRAINT "notification_conversation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_conversation_participant" ADD CONSTRAINT "notification_conversation_participant_conversation_id_notification_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."notification_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_conversation_participant" ADD CONSTRAINT "notification_conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_device_registration" ADD CONSTRAINT "notification_device_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_message" ADD CONSTRAINT "notification_message_conversation_id_notification_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."notification_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_message" ADD CONSTRAINT "notification_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_message" ADD CONSTRAINT "notification_message_deleted_by_id_user_id_fk" FOREIGN KEY ("deleted_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_message_recipient" ADD CONSTRAINT "notification_message_recipient_message_id_notification_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."notification_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_message_recipient" ADD CONSTRAINT "notification_message_recipient_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_message_id_notification_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."notification_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_announcement_schedule_idx" ON "notification_announcement" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "notification_announcement_target_idx" ON "notification_announcement_target" USING btree ("announcement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_conversation_key_uidx" ON "notification_conversation" USING btree ("key");--> statement-breakpoint
CREATE INDEX "notification_conversation_last_idx" ON "notification_conversation" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "notification_participant_user_idx" ON "notification_conversation_participant" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_device_fid_uidx" ON "notification_device_registration" USING btree ("fid");--> statement-breakpoint
CREATE INDEX "notification_device_user_idx" ON "notification_device_registration" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_message_conversation_idx" ON "notification_message" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_recipient_unread_idx" ON "notification_message_recipient" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_message_user_uidx" ON "notification_delivery" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_pending_idx" ON "notification_delivery" USING btree ("status","next_attempt_at");