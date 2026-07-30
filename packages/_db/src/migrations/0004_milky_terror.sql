CREATE TABLE "notification_delivery_target" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"device_registration_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_delivery_target" ADD CONSTRAINT "notification_delivery_target_delivery_id_notification_delivery_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."notification_delivery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_delivery_target" ADD CONSTRAINT "notification_delivery_target_device_registration_id_notification_device_registration_id_fk" FOREIGN KEY ("device_registration_id") REFERENCES "public"."notification_device_registration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_target_device_uidx" ON "notification_delivery_target" USING btree ("delivery_id","device_registration_id");--> statement-breakpoint
CREATE INDEX "notification_delivery_target_pending_idx" ON "notification_delivery_target" USING btree ("status","next_attempt_at");