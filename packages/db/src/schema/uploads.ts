import { pgTable, text, timestamp, varchar, bigint } from "drizzle-orm/pg-core";
import { resources, mediaItems } from "./resources.ts";
import { user } from "./auth.ts";

export const uploadSessions = pgTable("upload_sessions", {
	id: text("id").primaryKey(),
	resourceId: text("resource_id")
		.notNull()
		.references(() => resources.id, { onDelete: "cascade" }),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	mediaItemId: text("media_item_id").references(() => mediaItems.id, { onDelete: "set null" }),
	status: varchar("status", { length: 50 }).notNull().default("created"),
	originalFilename: text("original_filename").notNull(),
	mimeType: varchar("mime_type", { length: 255 }),
	storageKey: text("storage_key").notNull(),
	publicUrl: text("public_url"),
	checksumAlgorithm: varchar("checksum_algorithm", { length: 32 }),
	finalChecksum: text("final_checksum"),
	errorCode: varchar("error_code", { length: 100 }),
	errorMessage: text("error_message"),
	declaredSize: bigint("declared_size", { mode: "number" }),
	receivedBytes: bigint("received_bytes", { mode: "number" }).notNull().default(0),
	expiresAt: timestamp("expires_at"),
	completedAt: timestamp("completed_at"),
	cancelledAt: timestamp("cancelled_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
