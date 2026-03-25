/**
 * Crea todas las tablas del esquema en una instancia PGlite.
 * Reutilizable por: API (dev local), CLI (seed), preview (navegador).
 */
export async function createTables(pglite: { exec: (sql: string) => Promise<unknown> }) {
	await pglite.exec(`
		CREATE TABLE IF NOT EXISTS "user" (
			id TEXT PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE,
			email_verified BOOLEAN NOT NULL DEFAULT false,
			name TEXT,
			image TEXT,
			role VARCHAR(50) NOT NULL DEFAULT 'reader',
			is_active BOOLEAN NOT NULL DEFAULT true,
			banned BOOLEAN DEFAULT false,
			ban_reason TEXT,
			ban_expires TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
			last_login_at TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS "session" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			expires_at TIMESTAMP NOT NULL,
			token TEXT NOT NULL UNIQUE,
			ip_address TEXT,
			user_agent TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS "account" (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
			account_id TEXT NOT NULL,
			provider_id TEXT NOT NULL,
			access_token TEXT,
			refresh_token TEXT,
			access_token_expires_at TIMESTAMP,
			refresh_token_expires_at TIMESTAMP,
			scope TEXT,
			id_token TEXT,
			password TEXT,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS "verification" (
			id TEXT PRIMARY KEY,
			identifier TEXT NOT NULL,
			value TEXT NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS "resources" (
			id TEXT PRIMARY KEY,
			slug VARCHAR(512) NOT NULL UNIQUE,
			external_id TEXT,
			source_uri TEXT,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			language VARCHAR(10) NOT NULL,
			license VARCHAR(50) NOT NULL,
			resource_type VARCHAR(100) NOT NULL,
			keywords TEXT,
			author TEXT,
			publisher TEXT,
			duration INTEGER,
			accessibility_features TEXT,
			accessibility_hazards TEXT,
			access_mode TEXT,
			editorial_status VARCHAR(50) NOT NULL DEFAULT 'draft',
			assigned_curator_id TEXT REFERENCES "user"(id),
			curated_at TIMESTAMP,
			featured_at TIMESTAMP,
			imported_at TIMESTAMP,
			import_source TEXT,
			deleted_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS "media_items" (
			id TEXT PRIMARY KEY,
			resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
			type VARCHAR(50) NOT NULL,
			mime_type VARCHAR(255),
			url TEXT NOT NULL,
			file_size INTEGER,
			filename TEXT,
			is_primary INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS "resource_subjects" (
			resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
			subject VARCHAR(255) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS "resource_levels" (
			resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
			level VARCHAR(100) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS "collections" (
			id TEXT PRIMARY KEY,
			slug VARCHAR(512) NOT NULL UNIQUE,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			cover_image_url TEXT,
			is_ordered INTEGER NOT NULL DEFAULT 0,
			editorial_status VARCHAR(50) NOT NULL DEFAULT 'borrador',
			curator_id TEXT NOT NULL REFERENCES "user"(id),
			created_at TIMESTAMP NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP NOT NULL DEFAULT NOW()
		);

		CREATE TABLE IF NOT EXISTS "collection_resources" (
			collection_id TEXT NOT NULL REFERENCES "collections"(id) ON DELETE CASCADE,
			resource_id TEXT NOT NULL REFERENCES "resources"(id) ON DELETE CASCADE,
			position INTEGER NOT NULL DEFAULT 0
		);

		CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
		CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(editorial_status);
		CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
	`);
}
