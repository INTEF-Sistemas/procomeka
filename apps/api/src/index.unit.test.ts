import { expect, test } from "bun:test";
import { greet } from "./index";

test("greet returns correct string", () => {
	expect(greet("World")).toBe("Hello, World!");
});
