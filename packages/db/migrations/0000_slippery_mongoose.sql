CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"role" varchar(50) DEFAULT 'reader' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"mime_type" varchar(255),
	"url" text NOT NULL,
	"file_size" integer,
	"filename" text,
	"is_primary" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_levels" (
	"resource_id" text NOT NULL,
	"level" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_subjects" (
	"resource_id" text NOT NULL,
	"subject" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(512) NOT NULL,
	"external_id" text,
	"source_uri" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"language" varchar(10) NOT NULL,
	"license" varchar(50) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"keywords" text,
	"author" text,
	"publisher" text,
	"duration" integer,
	"accessibility_features" text,
	"accessibility_hazards" text,
	"access_mode" text,
	"editorial_status" varchar(50) DEFAULT 'borrador' NOT NULL,
	"assigned_curator_id" text,
	"curated_at" timestamp,
	"featured_at" timestamp,
	"imported_at" timestamp,
	"import_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection_resources" (
	"collection_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(512) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cover_image_url" text,
	"is_ordered" integer DEFAULT 0 NOT NULL,
	"editorial_status" varchar(50) DEFAULT 'borrador' NOT NULL,
	"curator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_levels" ADD CONSTRAINT "resource_levels_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_subjects" ADD CONSTRAINT "resource_subjects_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_assigned_curator_id_user_id_fk" FOREIGN KEY ("assigned_curator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_resources" ADD CONSTRAINT "collection_resources_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_resources" ADD CONSTRAINT "collection_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_curator_id_user_id_fk" FOREIGN KEY ("curator_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;