import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://procomeka.es",
	vite: {
		server: {
			proxy: {
				"/api": {
					target: "http://localhost:3000",
					changeOrigin: true,
				},
				"/mock-oidc": {
					target: "http://localhost:3000",
					changeOrigin: true,
				},
			},
		},
	},
});
