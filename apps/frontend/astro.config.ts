import { defineConfig } from "astro/config";

const isPreview = process.env.PREVIEW_STATIC === "true";
const previewBase = process.env.PREVIEW_BASE ?? "/";

export default defineConfig({
	site: isPreview ? "https://intef-proyectos.github.io" : "https://procomeka.es",
	base: isPreview ? previewBase : "/",
	output: "static",
	vite: {
		define: {
			"import.meta.env.PUBLIC_PREVIEW_MODE": JSON.stringify(isPreview ? "true" : "false"),
		},
		server: isPreview
			? {}
			: {
					proxy: {
						"/api": {
							target: "http://localhost:3000",
							changeOrigin: true,
						},
					},
				},
		optimizeDeps: {
			exclude: ["@electric-sql/pglite"],
		},
	},
});
