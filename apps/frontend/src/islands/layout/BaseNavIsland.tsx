import { useEffect, useState } from "react";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";

export function BaseNavIsland() {
	const [userEmail, setUserEmail] = useState<string | null>(null);

	useEffect(() => {
		void (async () => {
			try {
				const api = await getApiClient();
				const session = await api.getSession();
				setUserEmail(session?.user?.email ?? null);
			} catch {
				setUserEmail(null);
			}
		})();
	}, []);

	return (
		<div className="nav-links">
			<a href={url("admin/recursos/nuevo")}>Crear recurso</a>
			{userEmail ? (
				<a href={url("dashboard")}>{userEmail}</a>
			) : (
				<a href={url("login")}>Iniciar sesion</a>
			)}
		</div>
	);
}
