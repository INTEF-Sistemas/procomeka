import { createAccessControl } from "better-auth/plugins/access";

/**
 * Definición declarativa de permisos por entidad y acción.
 * Referencia: ADR-0008
 */
export const statement = {
	resource: ["create", "read", "update", "delete", "curate", "moderate"],
	collection: ["create", "read", "update", "delete"],
	user: ["create", "read", "update", "delete", "ban"],
} as const;

export const ac = createAccessControl(statement);

export const reader = ac.newRole({
	resource: ["read"],
	collection: ["read"],
});

export const author = ac.newRole({
	resource: ["create", "read", "update"],
	collection: ["create", "read", "update"],
});

export const curator = ac.newRole({
	resource: ["create", "read", "update", "curate"],
	collection: ["create", "read", "update", "delete"],
});

export const admin = ac.newRole({
	resource: ["create", "read", "update", "delete", "curate", "moderate"],
	collection: ["create", "read", "update", "delete"],
	user: ["create", "read", "update", "delete", "ban"],
});
