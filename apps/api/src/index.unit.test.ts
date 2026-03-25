import { expect, test } from "bun:test";
import { app } from "./index.ts";

test("GET /health devuelve status ok", async () => {
	const res = await app.request("/health");
	expect(res.status).toBe(200);
	const body = await res.json();
	expect(body).toEqual({ status: "ok" });
});

test("GET / devuelve info de la API", async () => {
	const res = await app.request("/");
	expect(res.status).toBe(200);
	const body = await res.json();
	expect(body.name).toBe("Procomeka API");
});
