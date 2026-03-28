import { useEffect, useState } from "react";

export function PreviewBannerIsland() {
	const [role, setRole] = useState("admin");
	const [resetting, setResetting] = useState(false);

	useEffect(() => {
		const savedRole = localStorage.getItem("procomeka-preview-role") ?? "admin";
		setRole(savedRole);
	}, []);

	async function handleRoleChange(nextRole: string) {
		setRole(nextRole);
		const { PreviewApiClient } = await import("../../lib/preview-api-client.ts");
		const client = await PreviewApiClient.getInstance();
		client.switchRole(nextRole);
		window.location.reload();
	}

	async function handleReset() {
		setResetting(true);
		try {
			const { PreviewApiClient } = await import("../../lib/preview-api-client.ts");
			const client = await PreviewApiClient.getInstance();
			await client.resetDatabase();
			window.location.reload();
		} finally {
			setResetting(false);
		}
	}

	return (
		<div className="preview-banner">
			<span className="preview-label">Vista previa</span>
			<span className="preview-role">
				Rol:{" "}
				<select value={role} onChange={(event) => void handleRoleChange(event.currentTarget.value)}>
					<option value="admin">Admin</option>
					<option value="curator">Curator</option>
					<option value="author">Author</option>
					<option value="reader">Reader</option>
				</select>
			</span>
			<button type="button" onClick={() => void handleReset()} disabled={resetting}>
				{resetting ? "Reiniciando..." : "Reiniciar datos"}
			</button>
		</div>
	);
}
