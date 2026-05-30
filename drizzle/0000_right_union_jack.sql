CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'editor',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "form_collaborators_form_id_user_id_unique" UNIQUE("form_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "form_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"form_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"checked_in" boolean DEFAULT false,
	"device_id" text,
	CONSTRAINT "form_responses_form_id_device_id_unique" UNIQUE("form_id","device_id")
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text,
	"user_id" text NOT NULL,
	"slug" text,
	"published" boolean DEFAULT false,
	"closed" boolean DEFAULT false,
	"background_type" text,
	"background_color" text,
	"background_image" text,
	"theme" jsonb,
	"global_text_color" text,
	"thank_you_page" jsonb,
	"enable_checkin" boolean DEFAULT false,
	"checkin_name_field_id" text,
	"enable_device_tracking" boolean DEFAULT false,
	"anonymous_voting" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "ip_rate_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ip_rate_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ip_hash" text NOT NULL,
	"form_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"icon" text,
	"thumbnail_url" text,
	"questions_template" jsonb NOT NULL,
	"background_color" text,
	"theme_id" text,
	"use_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"username" text,
	"display_name" text,
	"bio" text,
	"location" text,
	"website" text,
	"twitter_url" text,
	"linkedin_url" text,
	"github_url" text,
	"theme_preference" text DEFAULT 'light',
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_collaborators" ADD CONSTRAINT "form_collaborators_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_collaborators" ADD CONSTRAINT "form_collaborators_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_id_created_idx" ON "form_responses" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "user_slug_idx" ON "forms" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "ip_hash_created_idx" ON "ip_rate_log" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "form_id_order_idx" ON "questions" USING btree ("form_id","order_index");