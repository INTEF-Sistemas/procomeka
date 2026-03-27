/**
 * Interfaz estable para todas las operaciones de datos del frontend.
 * Dos implementaciones: HttpApiClient (servidor) y PreviewApiClient (PGlite en navegador).
 */

export interface Resource {
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
	createdBy: string | null;
	createdByName: string | null;
	assignedCuratorId?: string | null;
	createdAt: string | number | Date | null;
	updatedAt: string | number | Date | null;
	deletedAt: unknown;
	subjects?: string[];
	levels?: string[];
}

export interface ResourceListResult {
	data: Resource[];
	total: number;
	limit: number;
	offset: number;
}

export interface UserRecord {
	id: string;
	email: string;
	name: string | null;
	role: string;
	isActive: boolean;
	createdAt?: string | number | Date | null;
	updatedAt?: string | number | Date | null;
}

export interface CollectionRecord {
	id: string;
	slug: string;
	title: string;
	description: string;
	editorialStatus: string;
	curatorId: string;
	isOrdered?: number;
	createdAt?: string | number | Date | null;
	updatedAt?: string | number | Date | null;
}

export interface TaxonomyRecord {
	id: string;
	slug: string;
	name: string;
	type: string;
	parentId?: string | null;
	createdAt?: string | number | Date | null;
	updatedAt?: string | number | Date | null;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}

export interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: string;
}

export interface SessionData {
	user: SessionUser;
}

export interface AppConfig {
	oidcEnabled: boolean;
	oidcEndSessionUrl: string | null;
}

export interface SignInResult {
	ok: boolean;
	error?: string;
	redirectUrl?: string;
}

export interface CreateResourceInput {
	title: string;
	description: string;
	language: string;
	license: string;
	resourceType: string;
	author?: string;
	keywords?: string;
	publisher?: string;
	subjects?: string[];
	levels?: string[];
}

export type UpdateResourceInput = Partial<CreateResourceInput>;

export interface ApiClient {
	// Public
	listResources(opts?: {
		q?: string;
		limit?: number;
		offset?: number;
		resourceType?: string;
		language?: string;
		license?: string;
	}): Promise<ResourceListResult>;
	getResourceBySlug(slug: string): Promise<Resource | null>;
	getConfig(): Promise<AppConfig>;

	// Auth
	getSession(): Promise<SessionData | null>;
	signIn(email: string, password: string): Promise<SignInResult>;
	signInOidc(): Promise<SignInResult>;
	signOut(): Promise<void>;

	// Admin
	listAdminResources(opts?: { q?: string; limit?: number; offset?: number; status?: string }): Promise<ResourceListResult>;
	getResourceById(id: string): Promise<Resource | null>;
	createResource(data: CreateResourceInput): Promise<{ id: string; slug: string }>;
	updateResource(id: string, data: UpdateResourceInput): Promise<{ ok: boolean; error?: string; details?: { field: string; message: string }[] }>;
	updateResourceStatus(id: string, status: string): Promise<{ id: string; status: string }>;
	deleteResource(id: string): Promise<void>;

	listUsers(opts?: { q?: string; role?: string; limit?: number; offset?: number }): Promise<PaginatedResult<UserRecord>>;
	getUserById(id: string): Promise<UserRecord | null>;
	updateUser(id: string, data: Partial<Pick<UserRecord, "name" | "role" | "isActive">>): Promise<{ ok: boolean; error?: string }>;

	listCollections(opts?: { q?: string; limit?: number; offset?: number }): Promise<PaginatedResult<CollectionRecord>>;
	getCollectionById(id: string): Promise<CollectionRecord | null>;
	createCollection(data: { title: string; description: string; editorialStatus?: string; isOrdered?: boolean }): Promise<{ id: string; slug: string }>;
	updateCollection(id: string, data: Partial<{ title: string; description: string; editorialStatus: string; isOrdered: boolean }>): Promise<{ ok: boolean; error?: string; details?: { field: string; message: string }[] }>;
	deleteCollection(id: string): Promise<void>;

	listTaxonomies(opts?: { q?: string; type?: string; limit?: number; offset?: number }): Promise<PaginatedResult<TaxonomyRecord>>;
	getTaxonomyById(id: string): Promise<TaxonomyRecord | null>;
	createTaxonomy(data: { name: string; slug?: string; type?: string; parentId?: string | null }): Promise<{ id: string; slug: string }>;
	updateTaxonomy(id: string, data: Partial<{ name: string; slug: string; type: string; parentId: string | null }>): Promise<{ ok: boolean; error?: string; details?: { field: string; message: string }[] }>;
	deleteTaxonomy(id: string): Promise<void>;

	// Dev
	seedResources(count: number, clean?: boolean): Promise<{ count: number; durationMs: number }>;
}
