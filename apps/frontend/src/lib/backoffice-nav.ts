export type BackofficeRole = "reader" | "author" | "curator" | "admin";

export type BackofficeSection = {
	id: string;
	label: string;
	href: string;
	minRole: BackofficeRole;
};

const ROLE_LEVELS: Record<BackofficeRole, number> = {
	reader: 0,
	author: 1,
	curator: 2,
	admin: 3,
};

export const BACKOFFICE_SECTIONS: BackofficeSection[] = [
	{ id: "dashboard", label: "Panel", href: "dashboard", minRole: "author" },
	{ id: "resources", label: "Recursos", href: "admin/recursos", minRole: "author" },
	{ id: "collections", label: "Colecciones", href: "admin/colecciones", minRole: "author" },
	{ id: "taxonomies", label: "Categorías", href: "admin/categorias", minRole: "curator" },
	{ id: "users", label: "Usuarios", href: "admin/usuarios", minRole: "admin" },
];

export function canAccessSection(role: string | null | undefined, minRole: BackofficeRole): boolean {
	const normalized = (role ?? "reader") as BackofficeRole;
	return (ROLE_LEVELS[normalized] ?? 0) >= ROLE_LEVELS[minRole];
}

export function getVisibleSections(role: string | null | undefined): BackofficeSection[] {
	return BACKOFFICE_SECTIONS.filter((section) => canAccessSection(role, section.minRole));
}
