import type {
	ApiClient,
	Resource,
	ResourceListResult,
	SessionData,
	AppConfig,
	SignInResult,
	CreateResourceInput,
	UpdateResourceInput,
	PaginatedResult,
	UserRecord,
	CollectionRecord,
	TaxonomyRecord,
} from "./api-client.ts";

/**
 * Cliente HTTP que llama al servidor API real.
 * Usado en modo normal (desarrollo y producción).
 */
export class HttpApiClient implements ApiClient {
	async listResources(opts?: {
		q?: string;
		limit?: number;
		offset?: number;
		resourceType?: string;
		language?: string;
		license?: string;
	}): Promise<ResourceListResult> {
		const params = new URLSearchParams();
		if (opts?.q) params.set("q", opts.q);
		if (opts?.limit) params.set("limit", String(opts.limit));
		if (opts?.offset) params.set("offset", String(opts.offset));
		if (opts?.resourceType) params.set("resourceType", opts.resourceType);
		if (opts?.language) params.set("language", opts.language);
		if (opts?.license) params.set("license", opts.license);
		const qs = params.toString();
		const res = await fetch(`/api/v1/resources${qs ? `?${qs}` : ""}`);
		return res.json();
	}

	async getResourceBySlug(slug: string): Promise<Resource | null> {
		const res = await fetch(`/api/v1/resources/${slug}`);
		if (!res.ok) return null;
		return res.json();
	}

	async getConfig(): Promise<AppConfig> {
		const res = await fetch("/api/v1/config");
		return res.json();
	}

	async getSession(): Promise<SessionData | null> {
		try {
			const res = await fetch("/api/auth/get-session", { credentials: "include" });
			if (!res.ok) return null;
			const data = await res.json();
			if (!data?.user) return null;
			return data;
		} catch {
			return null;
		}
	}

	async signIn(email: string, password: string): Promise<SignInResult> {
		const res = await fetch("/api/auth/sign-in/email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ email, password }),
		});
		if (res.ok) return { ok: true };
		const data = await res.json().catch(() => null);
		return { ok: false, error: data?.message ?? "Credenciales incorrectas" };
	}

	async signInOidc(): Promise<SignInResult> {
		const res = await fetch("/api/auth/sign-in/oauth2", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ providerId: "oidc", callbackURL: "/dashboard" }),
			redirect: "manual",
		});
		const location = res.headers.get("location");
		if (location) return { ok: true, redirectUrl: location };
		if (res.ok) {
			const data = await res.json().catch(() => null);
			if (data?.url) return { ok: true, redirectUrl: data.url };
		}
		return { ok: false, error: "No se pudo iniciar el login institucional" };
	}

	async signOut(): Promise<void> {
		await fetch("/api/auth/sign-out", { method: "POST", credentials: "include" });
	}

	async listAdminResources(opts?: { q?: string; limit?: number; offset?: number; status?: string }): Promise<ResourceListResult> {
		const params = new URLSearchParams();
		if (opts?.q) params.set("q", opts.q);
		if (opts?.limit) params.set("limit", String(opts.limit));
		if (opts?.offset) params.set("offset", String(opts.offset));
		if (opts?.status) params.set("status", opts.status);
		const qs = params.toString();
		const res = await fetch(`/api/admin/resources${qs ? `?${qs}` : ""}`, { credentials: "include" });
		return res.json();
	}

	async getResourceById(id: string): Promise<Resource | null> {
		const res = await fetch(`/api/admin/resources/${id}`, { credentials: "include" });
		if (!res.ok) return null;
		return res.json();
	}

	async createResource(data: CreateResourceInput): Promise<{ id: string; slug: string }> {
		const res = await fetch("/api/admin/resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw err;
		}
		return res.json();
	}

	async updateResource(id: string, data: UpdateResourceInput) {
		const res = await fetch(`/api/admin/resources/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return { ok: false, error: err.error, details: err.details };
		}
		return { ok: true };
	}

	async updateResourceStatus(id: string, status: string): Promise<{ id: string; status: string }> {
		const res = await fetch(`/api/admin/resources/${id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ status }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw err;
		}
		return res.json();
	}

	async deleteResource(id: string): Promise<void> {
		await fetch(`/api/admin/resources/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
	}

	async listUsers(opts?: { q?: string; role?: string; limit?: number; offset?: number }): Promise<PaginatedResult<UserRecord>> {
		const params = new URLSearchParams();
		if (opts?.q) params.set("q", opts.q);
		if (opts?.role) params.set("role", opts.role);
		if (opts?.limit) params.set("limit", String(opts.limit));
		if (opts?.offset) params.set("offset", String(opts.offset));
		const qs = params.toString();
		const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ""}`, { credentials: "include" });
		return res.json();
	}

	async getUserById(id: string): Promise<UserRecord | null> {
		const res = await fetch(`/api/admin/users/${id}`, { credentials: "include" });
		if (!res.ok) return null;
		return res.json();
	}

	async updateUser(id: string, data: Partial<Pick<UserRecord, "name" | "role" | "isActive">>) {
		const res = await fetch(`/api/admin/users/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return { ok: false, error: err.error ?? "Error al actualizar usuario" };
		}
		return { ok: true };
	}

	async listCollections(opts?: { q?: string; limit?: number; offset?: number }): Promise<PaginatedResult<CollectionRecord>> {
		const params = new URLSearchParams();
		if (opts?.q) params.set("q", opts.q);
		if (opts?.limit) params.set("limit", String(opts.limit));
		if (opts?.offset) params.set("offset", String(opts.offset));
		const qs = params.toString();
		const res = await fetch(`/api/admin/collections${qs ? `?${qs}` : ""}`, { credentials: "include" });
		return res.json();
	}

	async getCollectionById(id: string): Promise<CollectionRecord | null> {
		const res = await fetch(`/api/admin/collections/${id}`, { credentials: "include" });
		if (!res.ok) return null;
		return res.json();
	}

	async createCollection(data: { title: string; description: string; editorialStatus?: string; isOrdered?: boolean }) {
		const res = await fetch("/api/admin/collections", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw err;
		}
		return res.json();
	}

	async updateCollection(id: string, data: Partial<{ title: string; description: string; editorialStatus: string; isOrdered: boolean }>) {
		const res = await fetch(`/api/admin/collections/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return { ok: false, error: err.error, details: err.details };
		}
		return { ok: true };
	}

	async deleteCollection(id: string): Promise<void> {
		await fetch(`/api/admin/collections/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
	}

	async listTaxonomies(opts?: { q?: string; type?: string; limit?: number; offset?: number }): Promise<PaginatedResult<TaxonomyRecord>> {
		const params = new URLSearchParams();
		if (opts?.q) params.set("q", opts.q);
		if (opts?.type) params.set("type", opts.type);
		if (opts?.limit) params.set("limit", String(opts.limit));
		if (opts?.offset) params.set("offset", String(opts.offset));
		const qs = params.toString();
		const res = await fetch(`/api/admin/taxonomies${qs ? `?${qs}` : ""}`, { credentials: "include" });
		return res.json();
	}

	async getTaxonomyById(id: string): Promise<TaxonomyRecord | null> {
		const res = await fetch(`/api/admin/taxonomies/${id}`, { credentials: "include" });
		if (!res.ok) return null;
		return res.json();
	}

	async createTaxonomy(data: { name: string; slug?: string; type?: string; parentId?: string | null }) {
		const res = await fetch("/api/admin/taxonomies", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw err;
		}
		return res.json();
	}

	async updateTaxonomy(id: string, data: Partial<{ name: string; slug: string; type: string; parentId: string | null }>) {
		const res = await fetch(`/api/admin/taxonomies/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(data),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return { ok: false, error: err.error, details: err.details };
		}
		return { ok: true };
	}

	async deleteTaxonomy(id: string): Promise<void> {
		await fetch(`/api/admin/taxonomies/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
	}

	async seedResources(count: number, clean?: boolean): Promise<{ count: number; durationMs: number }> {
		const res = await fetch("/api/dev/seed-resources", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ count, clean }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.error || "Error al generar recursos");
		}
		return res.json();
	}
}
