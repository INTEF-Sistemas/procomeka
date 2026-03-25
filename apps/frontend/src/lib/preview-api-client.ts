import type {
	ApiClient,
	Resource,
	ResourceListResult,
	SessionData,
	AppConfig,
	SignInResult,
	CreateResourceInput,
	UpdateResourceInput,
	SessionUser,
} from "./api-client.ts";

interface SeedData {
	users: { id: string; email: string; name: string; role: string }[];
	resources: {
		id: string;
		slug: string;
		title: string;
		description: string;
		language: string;
		license: string;
		resourceType: string;
		keywords: string | null;
		author: string | null;
		publisher: string | null;
		editorialStatus: string;
	}[];
	resourceSubjects: { resourceId: string; subject: string }[];
	resourceLevels: { resourceId: string; level: string }[];
}

const ROLE_KEY = "procomeka-preview-role";
const LOGGED_IN_KEY = "procomeka-preview-logged-in";

/**
 * Cliente de preview: PGlite en el navegador + usuarios demo en memoria.
 */
export class PreviewApiClient implements ApiClient {
	private static _instance: PreviewApiClient | null = null;
	private static _initPromise: Promise<PreviewApiClient> | null = null;

	// biome-ignore lint: dynamic pglite types
	private pglite: any;
	// biome-ignore lint: dynamic drizzle types
	private db: any;
	private currentUser: SessionUser;
	private loggedIn: boolean;
	private seedData: SeedData | null = null;

	private constructor() {
		const savedRole = typeof localStorage !== "undefined" ? localStorage.getItem(ROLE_KEY) : null;
		const role = savedRole ?? "admin";
		this.currentUser = this.userForRole(role);
		this.loggedIn = typeof localStorage !== "undefined"
			? localStorage.getItem(LOGGED_IN_KEY) !== "false"
			: true;
	}

	static async getInstance(): Promise<PreviewApiClient> {
		if (PreviewApiClient._instance) return PreviewApiClient._instance;
		if (PreviewApiClient._initPromise) return PreviewApiClient._initPromise;

		PreviewApiClient._initPromise = (async () => {
			const client = new PreviewApiClient();
			await client.init();
			PreviewApiClient._instance = client;
			return client;
		})();

		return PreviewApiClient._initPromise;
	}

	private userForRole(role: string): SessionUser {
		const users: Record<string, SessionUser> = {
			admin: { id: "demo-admin", email: "admin@example.com", name: "Admin", role: "admin" },
			curator: { id: "demo-curator", email: "curator@example.com", name: "Curator", role: "curator" },
			author: { id: "demo-author", email: "author@example.com", name: "Author", role: "author" },
			reader: { id: "demo-reader", email: "reader@example.com", name: "Reader", role: "reader" },
		};
		return users[role] ?? users.admin!;
	}

	private async init() {
		const { PGlite } = await import("@electric-sql/pglite");
		this.pglite = new PGlite("idb://procomeka-preview");

		const { drizzle } = await import("drizzle-orm/pglite");
		const schema = await import("@procomeka/db/schema");
		this.db = drizzle(this.pglite, { schema });

		const { createTables } = await import("@procomeka/db/setup");
		await createTables(this.pglite);

		// Verificar si ya tiene datos
		const check = await this.pglite.query(`SELECT count(*) as c FROM "resources"`);
		if (Number(check.rows[0]?.c) === 0) {
			await this.loadSeedData();
		}
	}

	private async loadSeedData() {
		if (!this.seedData) {
			const base = (window as unknown as { __BASE_URL__: string }).__BASE_URL__ ?? "/";
			const res = await fetch(`${base}preview/seed.json`);
			this.seedData = await res.json();
		}

		const seed = this.seedData!;
		const now = new Date().toISOString();

		for (const u of seed.users) {
			await this.pglite.query(
				`INSERT INTO "user" (id, email, email_verified, name, role, is_active, created_at, updated_at) VALUES ($1, $2, true, $3, $4, true, $5, $6) ON CONFLICT (id) DO NOTHING`,
				[u.id, u.email, u.name, u.role, now, now],
			);
		}

		for (const r of seed.resources) {
			await this.pglite.query(
				`INSERT INTO "resources" (id, slug, title, description, language, license, resource_type, keywords, author, publisher, editorial_status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
				[r.id, r.slug, r.title, r.description, r.language, r.license, r.resourceType, r.keywords, r.author, r.publisher, r.editorialStatus, now, now],
			);
		}

		for (const s of seed.resourceSubjects) {
			await this.pglite.query(
				`INSERT INTO "resource_subjects" (resource_id, subject) VALUES ($1, $2)`,
				[s.resourceId, s.subject],
			);
		}

		for (const l of seed.resourceLevels) {
			await this.pglite.query(
				`INSERT INTO "resource_levels" (resource_id, level) VALUES ($1, $2)`,
				[l.resourceId, l.level],
			);
		}
	}

	// --- Public API ---

	async listResources(opts?: { q?: string; limit?: number; offset?: number }): Promise<ResourceListResult> {
		const { listResources: list } = await import("@procomeka/db/repository");
		return list(this.db, {
			limit: opts?.limit,
			offset: opts?.offset,
			search: opts?.q,
			status: "published",
		});
	}

	async getResourceBySlug(slug: string): Promise<Resource | null> {
		const { getResourceBySlug: get } = await import("@procomeka/db/repository");
		return get(this.db, slug);
	}

	async getConfig(): Promise<AppConfig> {
		return { oidcEnabled: false, oidcEndSessionUrl: null };
	}

	// --- Auth ---

	async getSession(): Promise<SessionData | null> {
		if (!this.loggedIn) return null;
		return { user: this.currentUser };
	}

	async signIn(email: string, _password: string): Promise<SignInResult> {
		const roles = ["admin", "curator", "author", "reader"];
		const match = roles.find((r) => this.userForRole(r).email === email);
		if (match) {
			this.switchRole(match);
			this.loggedIn = true;
			if (typeof localStorage !== "undefined") {
				localStorage.setItem(LOGGED_IN_KEY, "true");
			}
			return { ok: true };
		}
		return { ok: false, error: "Usuario de demostración no encontrado" };
	}

	async signInOidc(): Promise<SignInResult> {
		return { ok: false, error: "OIDC no disponible en modo preview" };
	}

	async signOut(): Promise<void> {
		this.loggedIn = false;
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(LOGGED_IN_KEY, "false");
		}
	}

	// --- Admin ---

	async listAdminResources(opts?: { limit?: number; offset?: number; status?: string }): Promise<ResourceListResult> {
		const { listResources: list } = await import("@procomeka/db/repository");
		return list(this.db, {
			limit: opts?.limit,
			offset: opts?.offset,
			status: opts?.status,
		});
	}

	async getResourceById(id: string): Promise<Resource | null> {
		const { getResourceById: get } = await import("@procomeka/db/repository");
		return get(this.db, id);
	}

	async createResource(data: CreateResourceInput): Promise<{ id: string; slug: string }> {
		const { validateCreateResource } = await import("@procomeka/db/validation");
		const validation = validateCreateResource(data);
		if (!validation.valid) {
			throw { error: "Validación fallida", details: validation.errors };
		}
		const { createResource: create } = await import("@procomeka/db/repository");
		return create(this.db, data);
	}

	async updateResource(id: string, data: UpdateResourceInput) {
		const { validateUpdateResource } = await import("@procomeka/db/validation");
		const validation = validateUpdateResource(data);
		if (!validation.valid) {
			return { ok: false, error: "Validación fallida", details: validation.errors };
		}
		const { updateResource: update } = await import("@procomeka/db/repository");
		await update(this.db, id, data);
		return { ok: true };
	}

	async deleteResource(id: string): Promise<void> {
		const { deleteResource: del } = await import("@procomeka/db/repository");
		await del(this.db, id);
	}

	// --- Preview-specific ---

	switchRole(role: string) {
		this.currentUser = this.userForRole(role);
		this.loggedIn = true;
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(ROLE_KEY, role);
			localStorage.setItem(LOGGED_IN_KEY, "true");
		}
	}

	getCurrentRole(): string {
		return this.currentUser.role;
	}

	async resetDatabase() {
		// Borrar todas las tablas y recargar seed
		await this.pglite.exec(`
			DELETE FROM "resource_levels";
			DELETE FROM "resource_subjects";
			DELETE FROM "media_items";
			DELETE FROM "collection_resources";
			DELETE FROM "collections";
			DELETE FROM "resources";
			DELETE FROM "verification";
			DELETE FROM "session";
			DELETE FROM "account";
			DELETE FROM "user";
		`);
		this.seedData = null;
		await this.loadSeedData();
	}
}
