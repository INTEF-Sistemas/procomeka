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
	UserRecord,
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

	private hasMinRole(minRole: "author" | "curator" | "admin"): boolean {
		const levels = { reader: 0, author: 1, curator: 2, admin: 3 };
		return (levels[this.currentUser.role as keyof typeof levels] ?? 0) >= levels[minRole];
	}

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

	async listResources(opts?: {
		q?: string;
		limit?: number;
		offset?: number;
		resourceType?: string;
		language?: string;
		license?: string;
	}): Promise<ResourceListResult> {
		const { listResources: list } = await import("@procomeka/db/repository");
		return list(this.db, {
			limit: opts?.limit,
			offset: opts?.offset,
			search: opts?.q,
			status: "published",
			resourceType: opts?.resourceType,
			language: opts?.language,
			license: opts?.license,
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

	async listAdminResources(opts?: { q?: string; limit?: number; offset?: number; status?: string }): Promise<ResourceListResult> {
		const { listResources: list } = await import("@procomeka/db/repository");
		if (!this.hasMinRole("author")) {
			return { data: [], total: 0, limit: opts?.limit ?? 20, offset: opts?.offset ?? 0 };
		}
		return list(this.db, {
			limit: opts?.limit,
			offset: opts?.offset,
			search: opts?.q,
			status: opts?.status,
			createdBy: this.currentUser.role === "author" ? this.currentUser.id : undefined,
			visibleToUserId: this.currentUser.role === "curator" ? this.currentUser.id : undefined,
		});
	}

	async getResourceById(id: string): Promise<Resource | null> {
		const { getResourceById: get } = await import("@procomeka/db/repository");
		const resource = await get(this.db, id);
		if (!resource) return null;
		if (this.currentUser.role === "admin") return resource;
		if (this.currentUser.role === "curator") {
			return resource.createdBy === this.currentUser.id || resource.assignedCuratorId === this.currentUser.id ? resource : null;
		}
		if (this.currentUser.role === "author") {
			return resource.createdBy === this.currentUser.id ? resource : null;
		}
		return null;
	}

	async createResource(data: CreateResourceInput): Promise<{ id: string; slug: string }> {
		const { validateCreateResource } = await import("@procomeka/db/validation");
		const validation = validateCreateResource(data);
		if (!validation.valid) {
			throw { error: "Validación fallida", details: validation.errors };
		}
		const { createResource: create } = await import("@procomeka/db/repository");
		return create(this.db, { ...data, createdBy: this.currentUser.id });
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

	async updateResourceStatus(id: string, status: string): Promise<{ id: string; status: string }> {
		const { getResourceById: get, updateEditorialStatus } = await import("@procomeka/db/repository");
		const existing = await get(this.db, id);
		if (!existing) throw { error: "Recurso no encontrado" };
		if (this.currentUser.role === "author" && existing.createdBy !== this.currentUser.id) {
			throw { error: "Permisos insuficientes" };
		}
		if (this.currentUser.role === "curator" && existing.createdBy !== this.currentUser.id && existing.assignedCuratorId !== this.currentUser.id) {
			throw { error: "Permisos insuficientes" };
		}

		const { validateTransition } = await import("@procomeka/db/validation");
		const check = validateTransition(existing.editorialStatus, status, this.currentUser.role);
		if (!check.valid) throw { error: "Transición no permitida", details: check.errors };

		await updateEditorialStatus(this.db, id, status, this.currentUser.id);
		return { id, status };
	}

	async deleteResource(id: string): Promise<void> {
		const resource = await this.getResourceById(id);
		if (!resource) throw new Error("Recurso no encontrado");
		const { deleteResource: del } = await import("@procomeka/db/repository");
		await del(this.db, id);
	}

	async listUsers(opts?: { q?: string; role?: string; limit?: number; offset?: number }) {
		const { listUsers } = await import("@procomeka/db/repository");
		const scope = this.currentUser.role === "admin" ? {} : { id: this.currentUser.id };
		return listUsers(this.db, { ...opts, ...scope, search: opts?.q });
	}

	async getUserById(id: string): Promise<UserRecord | null> {
		const { getUserById } = await import("@procomeka/db/repository");
		if (this.currentUser.role !== "admin" && this.currentUser.id !== id) return null;
		return getUserById(this.db, id);
	}

	async updateUser(id: string, data: Partial<Pick<UserRecord, "name" | "role" | "isActive">>) {
		if (this.currentUser.role !== "admin" && this.currentUser.id !== id) {
			return { ok: false, error: "Permisos insuficientes" };
		}
		const { updateUser } = await import("@procomeka/db/repository");
		const payload = this.currentUser.role === "admin" ? data : { name: data.name };
		await updateUser(this.db, id, payload);
		if (id === this.currentUser.id && typeof data.name === "string") {
			this.currentUser = { ...this.currentUser, name: data.name };
		}
		return { ok: true };
	}

	async listCollections(opts?: { q?: string; limit?: number; offset?: number }) {
		const { listCollections } = await import("@procomeka/db/repository");
		return listCollections(this.db, {
			limit: opts?.limit,
			offset: opts?.offset,
			search: opts?.q,
			curatorId: this.currentUser.role === "admin" ? undefined : this.currentUser.id,
		});
	}

	async getCollectionById(id: string) {
		const { getCollectionById } = await import("@procomeka/db/repository");
		const found = await getCollectionById(this.db, id);
		if (!found) return null;
		if (this.currentUser.role !== "admin" && found.curatorId !== this.currentUser.id) return null;
		return found;
	}

	async createCollection(data: { title: string; description: string; editorialStatus?: string; isOrdered?: boolean }) {
		const { createCollection } = await import("@procomeka/db/repository");
		return createCollection(this.db, {
			title: data.title,
			description: data.description,
			curatorId: this.currentUser.id,
			editorialStatus: data.editorialStatus,
			isOrdered: data.isOrdered ? 1 : 0,
		});
	}

	async updateCollection(id: string, data: Partial<{ title: string; description: string; editorialStatus: string; isOrdered: boolean }>) {
		const existing = await this.getCollectionById(id);
		if (!existing) return { ok: false, error: "Colección no encontrada" };
		const { updateCollection } = await import("@procomeka/db/repository");
		await updateCollection(this.db, id, {
			title: data.title,
			description: data.description,
			editorialStatus: data.editorialStatus,
			isOrdered: typeof data.isOrdered === "boolean" ? (data.isOrdered ? 1 : 0) : undefined,
		});
		return { ok: true };
	}

	async deleteCollection(id: string): Promise<void> {
		const existing = await this.getCollectionById(id);
		if (!existing) throw new Error("Colección no encontrada");
		const { deleteCollection } = await import("@procomeka/db/repository");
		await deleteCollection(this.db, id);
	}

	async listTaxonomies(opts?: { q?: string; type?: string; limit?: number; offset?: number }) {
		if (!this.hasMinRole("curator")) {
			return { data: [], total: 0, limit: opts?.limit ?? 20, offset: opts?.offset ?? 0 };
		}
		const { listTaxonomies } = await import("@procomeka/db/repository");
		return listTaxonomies(this.db, {
			limit: opts?.limit,
			offset: opts?.offset,
			search: opts?.q,
			type: opts?.type,
		});
	}

	async getTaxonomyById(id: string) {
		const { getTaxonomyById } = await import("@procomeka/db/repository");
		return getTaxonomyById(this.db, id);
	}

	async createTaxonomy(data: { name: string; slug?: string; type?: string; parentId?: string | null }) {
		if (!this.hasMinRole("admin")) throw new Error("Permisos insuficientes");
		const { createTaxonomy } = await import("@procomeka/db/repository");
		return createTaxonomy(this.db, data);
	}

	async updateTaxonomy(id: string, data: Partial<{ name: string; slug: string; type: string; parentId: string | null }>) {
		if (!this.hasMinRole("admin")) return { ok: false, error: "Permisos insuficientes" };
		const { updateTaxonomy } = await import("@procomeka/db/repository");
		await updateTaxonomy(this.db, id, data);
		return { ok: true };
	}

	async deleteTaxonomy(id: string): Promise<void> {
		if (!this.hasMinRole("admin")) throw new Error("Permisos insuficientes");
		const { deleteTaxonomy } = await import("@procomeka/db/repository");
		await deleteTaxonomy(this.db, id);
	}

	async seedResources(count: number, clean?: boolean): Promise<{ count: number; durationMs: number }> {
		const { seedRandomResources } = await import("@procomeka/db/seed-random");
		return seedRandomResources(this.db, count, { clean });
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
			DELETE FROM "taxonomies";
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
