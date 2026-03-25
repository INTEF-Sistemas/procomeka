/**
 * Re-exporta validación desde el paquete compartido.
 */
export {
	validateCreateResource,
	validateUpdateResource,
	validateStatus,
	VALID_STATUSES,
	VALID_LANGUAGES,
	VALID_LICENSES,
	type EditorialStatus,
	type ValidationError,
	type ValidationResult,
} from "@procomeka/db/validation";
