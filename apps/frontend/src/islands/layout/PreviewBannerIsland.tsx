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

	const bannerStyle: React.CSSProperties = {
		position: "fixed", bottom: 0, left: 0, right: 0,
		background: "#1e40af", color: "white",
		padding: "0.4rem 1rem",
		display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem",
		fontSize: "0.8rem", zIndex: 9999,
	};
	const labelStyle: React.CSSProperties = { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" };
	const controlStyle: React.CSSProperties = {
		background: "rgba(255,255,255,0.2)", color: "white",
		border: "1px solid rgba(255,255,255,0.4)", borderRadius: 3,
		padding: "0.15rem 0.3rem", fontSize: "0.8rem", cursor: "pointer",
	};

	return (
		<div style={bannerStyle}>
			<span style={labelStyle}>Vista previa</span>
			<span>
				Rol:{" "}
				<select value={role} onChange={(event) => void handleRoleChange(event.currentTarget.value)} style={controlStyle}>
					<option value="admin" style={{ color: "#1f2937", background: "white" }}>Admin</option>
					<option value="curator" style={{ color: "#1f2937", background: "white" }}>Curator</option>
					<option value="author" style={{ color: "#1f2937", background: "white" }}>Author</option>
					<option value="reader" style={{ color: "#1f2937", background: "white" }}>Reader</option>
				</select>
			</span>
			<button type="button" onClick={() => void handleReset()} disabled={resetting} style={controlStyle}>
				{resetting ? "Reiniciando..." : "Reiniciar datos"}
			</button>
		</div>
	);
}
