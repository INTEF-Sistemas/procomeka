import { useEffect, useState } from "react";
import { BACKOFFICE_SECTIONS, canAccessSection } from "../../lib/backoffice-nav.ts";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";

interface AdminNavIslandProps {
	activeSection?: string;
}

export function AdminNavIsland({ activeSection = "dashboard" }: AdminNavIslandProps) {
	const [role, setRole] = useState("reader");
	const [open, setOpen] = useState(false);

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

				setRole(nextRole);
			} catch {
				window.location.href = url("login");
			}
		})();
	}, []);

	return (
		<>
			<button
				className="admin-nav-toggle"
				type="button"
				aria-expanded={open ? "true" : "false"}
				aria-controls="admin-sidebar"
				onClick={() => setOpen((current) => !current)}
			>
				<span className="admin-nav-toggle-icon" aria-hidden="true">|||</span>
				Menu
			</button>
			<aside
				id="admin-sidebar"
				className={`admin-sidebar${open ? " is-open" : ""}`}
				aria-label="Navegacion del backoffice"
			>
				<p className="admin-sidebar-title">Backoffice</p>
				<nav>
					<ul className="admin-nav-list">
						{BACKOFFICE_SECTIONS.filter((section) => canAccessSection(role, section.minRole)).map((section) => (
							<li key={section.id}>
								<a
									href={url(section.href)}
									className={section.id === activeSection ? "is-active" : undefined}
								>
									<span className="nav-icon" aria-hidden="true">{section.icon}</span>
									{section.label}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</aside>
		</>
	);
}
