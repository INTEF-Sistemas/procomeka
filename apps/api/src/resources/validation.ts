export const VALID_STATUSES = [
	"draft",
	"review",
	"published",
	"archived",
] as const;
export type EditorialStatus = (typeof VALID_STATUSES)[number];

export const VALID_LANGUAGES = [
	"es",
	"en",
	"ca",
	"eu",
	"gl",
	"fr",
	"pt",
	"de",
	"it",
] as const;

export const VALID_LICENSES = [
	"cc-by",
	"cc-by-sa",
	"cc-by-nc",
	"cc-by-nc-sa",
	"cc-by-nc-nd",
	"cc-by-nd",
	"cc0",
] as const;

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

function isNonEmptyString(v: unknown): v is string {
	return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown): v is string[] {
	return Array.isArray(v) && v.every((i) => typeof i === "string");
}

export function validateCreateResource(body: unknown): ValidationResult {
	const errors: ValidationError[] = [];
	if (!body || typeof body !== "object") {
		return { valid: false, errors: [{ field: "body", message: "El cuerpo de la petición es obligatorio" }] };
	}
	const b = body as Record<string, unknown>;

	if (!isNonEmptyString(b.title)) {
		errors.push({ field: "title", message: "El título es obligatorio" });
	} else if (b.title.length > 500) {
		errors.push({ field: "title", message: "El título no puede superar 500 caracteres" });
	}

	if (!isNonEmptyString(b.description)) {
		errors.push({ field: "description", message: "La descripción es obligatoria" });
	} else if (b.description.length > 5000) {
		errors.push({ field: "description", message: "La descripción no puede superar 5000 caracteres" });
	}

	if (!isNonEmptyString(b.language)) {
		errors.push({ field: "language", message: "El idioma es obligatorio" });
	} else if (!VALID_LANGUAGES.includes(b.language as (typeof VALID_LANGUAGES)[number])) {
		errors.push({ field: "language", message: `Idioma no válido. Valores permitidos: ${VALID_LANGUAGES.join(", ")}` });
	}

	if (!isNonEmptyString(b.license)) {
		errors.push({ field: "license", message: "La licencia es obligatoria" });
	} else if (!VALID_LICENSES.includes(b.license as (typeof VALID_LICENSES)[number])) {
		errors.push({ field: "license", message: `Licencia no válida. Valores permitidos: ${VALID_LICENSES.join(", ")}` });
	}

	if (!isNonEmptyString(b.resourceType)) {
		errors.push({ field: "resourceType", message: "El tipo de recurso es obligatorio" });
	}

	if (b.author !== undefined && typeof b.author !== "string") {
		errors.push({ field: "author", message: "El autor debe ser texto" });
	} else if (typeof b.author === "string" && b.author.length > 500) {
		errors.push({ field: "author", message: "El autor no puede superar 500 caracteres" });
	}

	if (b.keywords !== undefined && typeof b.keywords !== "string") {
		errors.push({ field: "keywords", message: "Las palabras clave deben ser texto" });
	} else if (typeof b.keywords === "string" && b.keywords.length > 1000) {
		errors.push({ field: "keywords", message: "Las palabras clave no pueden superar 1000 caracteres" });
	}

	if (b.publisher !== undefined && typeof b.publisher !== "string") {
		errors.push({ field: "publisher", message: "El editor debe ser texto" });
	}

	if (b.subjects !== undefined && !isStringArray(b.subjects)) {
		errors.push({ field: "subjects", message: "Las materias deben ser un array de texto" });
	}

	if (b.levels !== undefined && !isStringArray(b.levels)) {
		errors.push({ field: "levels", message: "Los niveles deben ser un array de texto" });
	}

	return { valid: errors.length === 0, errors };
}

export function validateUpdateResource(body: unknown): ValidationResult {
	const errors: ValidationError[] = [];
	if (!body || typeof body !== "object") {
		return { valid: false, errors: [{ field: "body", message: "El cuerpo de la petición es obligatorio" }] };
	}
	const b = body as Record<string, unknown>;
	const updatableFields = [
		"title",
		"description",
		"language",
		"license",
		"resourceType",
		"author",
		"keywords",
		"publisher",
	];
	const hasAtLeastOne = updatableFields.some((f) => b[f] !== undefined);
	if (!hasAtLeastOne) {
		return { valid: false, errors: [{ field: "body", message: "Se requiere al menos un campo para actualizar" }] };
	}

	if (b.title !== undefined) {
		if (!isNonEmptyString(b.title)) {
			errors.push({ field: "title", message: "El título no puede estar vacío" });
		} else if (b.title.length > 500) {
			errors.push({ field: "title", message: "El título no puede superar 500 caracteres" });
		}
	}

	if (b.description !== undefined) {
		if (!isNonEmptyString(b.description)) {
			errors.push({ field: "description", message: "La descripción no puede estar vacía" });
		} else if (b.description.length > 5000) {
			errors.push({ field: "description", message: "La descripción no puede superar 5000 caracteres" });
		}
	}

	if (b.language !== undefined) {
		if (!isNonEmptyString(b.language)) {
			errors.push({ field: "language", message: "El idioma no puede estar vacío" });
		} else if (!VALID_LANGUAGES.includes(b.language as (typeof VALID_LANGUAGES)[number])) {
			errors.push({ field: "language", message: `Idioma no válido. Valores permitidos: ${VALID_LANGUAGES.join(", ")}` });
		}
	}

	if (b.license !== undefined) {
		if (!isNonEmptyString(b.license)) {
			errors.push({ field: "license", message: "La licencia no puede estar vacía" });
		} else if (!VALID_LICENSES.includes(b.license as (typeof VALID_LICENSES)[number])) {
			errors.push({ field: "license", message: `Licencia no válida. Valores permitidos: ${VALID_LICENSES.join(", ")}` });
		}
	}

	if (b.resourceType !== undefined && !isNonEmptyString(b.resourceType)) {
		errors.push({ field: "resourceType", message: "El tipo de recurso no puede estar vacío" });
	}

	return { valid: errors.length === 0, errors };
}

export function validateStatus(status: unknown): ValidationResult {
	if (!isNonEmptyString(status)) {
		return { valid: false, errors: [{ field: "status", message: "El estado es obligatorio" }] };
	}
	if (!VALID_STATUSES.includes(status as EditorialStatus)) {
		return {
			valid: false,
			errors: [{ field: "status", message: `Estado no válido. Valores permitidos: ${VALID_STATUSES.join(", ")}` }],
		};
	}
	return { valid: true, errors: [] };
}
