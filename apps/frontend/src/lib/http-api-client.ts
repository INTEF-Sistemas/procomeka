import type {
	ApiClient,
	Resource,
	ResourceListResult,
	SessionData,
	AppConfig,
	SignInResult,
	CreateResourceInput,
	UpdateResourceInput,
} from "./api-client.ts";

/**
 * Cliente HTTP que llama al servidor API real.
 * Usado en modo normal (desarrollo y producción).
 */
export class HttpApiClient implements ApiClient {
	async listResources(opts?: { q?: string; limit?: number; offset?: number }): Promise<ResourceListResult> {
		const params = new URLSearchParams();
		if (opts?.q) params.set("q", opts.q);
		if (opts?.limit) params.set("limit", String(opts.limit));
		if (opts?.offset) params.set("offset", String(opts.offset));
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

	async listAdminResources(opts?: { limit?: number; offset?: number; status?: string }): Promise<ResourceListResult> {
		const params = new URLSearchParams();
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

	async deleteResource(id: string): Promise<void> {
		await fetch(`/api/admin/resources/${id}`, {
			method: "DELETE",
			credentials: "include",
		});
	}
}
