import { useEffect, useState } from "react";
import { getApiClient } from "../../lib/get-api-client.ts";
import { url } from "../../lib/paths.ts";

export function LoginIsland() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [oidcSubmitting, setOidcSubmitting] = useState(false);
	const [oidcEnabled, setOidcEnabled] = useState(true);

	useEffect(() => {
		void (async () => {
			try {
				const api = await getApiClient();
				const [session, config] = await Promise.all([
					api.getSession().catch(() => null),
					api.getConfig().catch(() => null),
				]);

				if (session?.user) {
					window.location.href = url("dashboard");
					return;
				}

				if (config?.oidcEnabled === false) {
					setOidcEnabled(false);
				}
			} catch {
				// Sin sesión o sin config: mantener shell visible.
			}
		})();
	}, []);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			const api = await getApiClient();
			const result = await api.signIn(email, password);

			if (result.ok) {
				window.location.href = url("dashboard");
				return;
			}

			setError(result.error ?? "Credenciales incorrectas");
		} catch {
			setError("Error de conexión con el servidor");
		} finally {
			setSubmitting(false);
		}
	}

	async function handleOidc() {
		setError("");
		setOidcSubmitting(true);

		try {
			const api = await getApiClient();
			const result = await api.signInOidc();

			if (result.ok && result.redirectUrl) {
				window.location.href = result.redirectUrl;
				return;
			}

			setError(result.error ?? "No se pudo iniciar el login institucional");
		} catch {
			setError("Error de conexión con el servidor");
		} finally {
			setOidcSubmitting(false);
		}
	}

	return (
		<div className="login-container">
			<h1>Iniciar sesión</h1>

			{error ? <div className="error">{error}</div> : null}

			<form onSubmit={(event) => void handleSubmit(event)}>
				<div className="field">
					<label htmlFor="email">Correo electrónico</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						autoComplete="email"
						placeholder="admin@example.com"
						value={email}
						onChange={(event) => setEmail(event.currentTarget.value)}
					/>
				</div>

				<div className="field">
					<label htmlFor="password">Contraseña</label>
					<input
						type="password"
						id="password"
						name="password"
						required
						autoComplete="current-password"
						placeholder="password"
						value={password}
						onChange={(event) => setPassword(event.currentTarget.value)}
					/>
				</div>

				<button type="submit" disabled={submitting || oidcSubmitting}>
					{submitting ? "Entrando..." : "Entrar"}
				</button>
			</form>

			{oidcEnabled ? (
				<>
					<div className="separator">
						<span>o</span>
					</div>
					<button
						type="button"
						className="oidc-btn"
						disabled={oidcSubmitting || submitting}
						onClick={() => void handleOidc()}
					>
						{oidcSubmitting ? "Redirigiendo..." : "Acceder con cuenta institucional (SSO)"}
					</button>
				</>
			) : null}

			<div className="dev-info">
				<p><strong>Usuarios de desarrollo:</strong></p>
				<ul>
					<li><code>admin@example.com</code> / <code>password</code> - Admin</li>
					<li><code>author@example.com</code> / <code>password</code> - Author</li>
					<li><code>curator@example.com</code> / <code>password</code> - Curator</li>
					<li><code>reader@example.com</code> / <code>password</code> - Reader</li>
				</ul>
			</div>
		</div>
	);
}
