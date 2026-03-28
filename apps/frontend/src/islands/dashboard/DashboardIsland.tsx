import { startTransition, useEffect, useState } from "react";
import { canAccessSection } from "../../lib/backoffice-nav.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";

interface DashboardSummary {
	resources: string;
	collections: string;
	taxonomies: string;
	users: string;
}

const INITIAL_SUMMARY: DashboardSummary = {
	resources: "Cargando…",
	collections: "Cargando…",
	taxonomies: "Cargando…",
	users: "Cargando…",
};

export function DashboardIsland() {
	const [summary, setSummary] = useState<DashboardSummary>(INITIAL_SUMMARY);
	const [role, setRole] = useState<string>("reader");
	const [showDevTools, setShowDevTools] = useState(false);
	const [seedCount, setSeedCount] = useState("10");
	const [seedStatus, setSeedStatus] = useState("");
	const [seedStatusClass, setSeedStatusClass] = useState("status-msg");
	const [seedBusy, setSeedBusy] = useState<false | "run" | "clean">(false);

	useEffect(() => {
		void (async () => {
			try {
				const api = await getApiClient();
				const session = await api.getSession();
				const nextRole = session?.user?.role ?? "reader";

				if (nextRole === "reader") {
					window.location.href = url("login");
					return;
				}

				const resourcesPromise = api.listAdminResources({ limit: 5, offset: 0 });
				const collectionsPromise = api.listCollections({ limit: 5, offset: 0 });
				const taxonomiesPromise = canAccessSection(nextRole, "curator")
					? api.listTaxonomies({ limit: 5, offset: 0 })
					: Promise.resolve(null);
				const usersPromise = canAccessSection(nextRole, "admin")
					? api.listUsers({ limit: 5, offset: 0 })
					: Promise.resolve(null);

				const [resources, collections, taxonomies, users] = await Promise.all([
					resourcesPromise,
					collectionsPromise,
					taxonomiesPromise,
					usersPromise,
				]);

				const isDev =
					window.location.hostname === "localhost" ||
					(window as Window & { __PREVIEW_MODE__?: boolean }).__PREVIEW_MODE__ === true;

				startTransition(() => {
					setRole(nextRole);
					setSummary({
						resources: `${resources.total} recursos visibles`,
						collections: `${collections.total} colecciones visibles`,
						taxonomies: taxonomies ? `${taxonomies.total} categorías visibles` : "No disponible",
						users: users ? `${users.total} usuarios` : "No disponible",
					});
					setShowDevTools(isDev && canAccessSection(nextRole, "admin"));
				});
			} catch {
				window.location.href = url("login");
			}
		})();
	}, []);

	async function runSeed(clean: boolean) {
		const prompt = clean ? "¿Borrar recursos generados y crear nuevos?" : "¿Generar recursos aleatorios?";
		if (!window.confirm(prompt)) return;

		setSeedBusy(clean ? "clean" : "run");
		setSeedStatus("Generando…");
		setSeedStatusClass("status-msg loading");

		try {
			const api = await getApiClient();
			const result = await api.seedResources(Number(seedCount), clean);
			setSeedStatus(`Creados ${result.count} recursos en ${result.durationMs}ms.`);
			setSeedStatusClass("status-msg success");

			const [resources, collections, taxonomies, users] = await Promise.all([
				api.listAdminResources({ limit: 5, offset: 0 }),
				api.listCollections({ limit: 5, offset: 0 }),
				canAccessSection(role, "curator") ? api.listTaxonomies({ limit: 5, offset: 0 }) : Promise.resolve(null),
				canAccessSection(role, "admin") ? api.listUsers({ limit: 5, offset: 0 }) : Promise.resolve(null),
			]);

			setSummary({
				resources: `${resources.total} recursos visibles`,
				collections: `${collections.total} colecciones visibles`,
				taxonomies: taxonomies ? `${taxonomies.total} categorías visibles` : "No disponible",
				users: users ? `${users.total} usuarios` : "No disponible",
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "Error al generar recursos";
			setSeedStatus(message);
			setSeedStatusClass("status-msg error");
		} finally {
			setSeedBusy(false);
		}
	}

	return (
		<>
			<section className="summary-grid" aria-live="polite">
				<article className="summary-card">
					<h2>Recursos</h2>
					<p>{summary.resources}</p>
					<a href={url("admin/recursos")}>Gestionar recursos</a>
				</article>
				<article className="summary-card">
					<h2>Colecciones</h2>
					<p>{summary.collections}</p>
					<a href={url("admin/colecciones")}>Gestionar colecciones</a>
				</article>
				{canAccessSection(role, "curator") ? (
					<article className="summary-card">
						<h2>Categorías</h2>
						<p>{summary.taxonomies}</p>
						<a href={url("admin/categorias")}>Gestionar categorías</a>
					</article>
				) : null}
				{canAccessSection(role, "admin") ? (
					<article className="summary-card">
						<h2>Usuarios</h2>
						<p>{summary.users}</p>
						<a href={url("admin/usuarios")}>Gestionar usuarios</a>
					</article>
				) : null}
			</section>

			{showDevTools ? (
				<section className="dev-tools">
					<h2>Herramientas de desarrollo</h2>
					<div className="seed-controls">
						<label htmlFor="seed-count">Generar recursos:</label>
						<select
							id="seed-count"
							value={seedCount}
							onChange={(event) => setSeedCount(event.currentTarget.value)}
							disabled={seedBusy !== false}
						>
							<option value="10">10</option>
							<option value="100">100</option>
							<option value="1000">1.000</option>
							<option value="10000">10.000</option>
						</select>
						<button
							type="button"
							className="btn-secondary"
							onClick={() => void runSeed(false)}
							disabled={seedBusy !== false}
						>
							{seedBusy === "run" ? "Generando..." : "Ejecutar"}
						</button>
						<button
							type="button"
							className="btn-danger"
							onClick={() => void runSeed(true)}
							disabled={seedBusy !== false}
						>
							{seedBusy === "clean" ? "Limpiando..." : "Limpiar y ejecutar"}
						</button>
					</div>
					<p className={seedStatusClass} aria-live="polite">{seedStatus}</p>
				</section>
			) : null}
		</>
	);
}
