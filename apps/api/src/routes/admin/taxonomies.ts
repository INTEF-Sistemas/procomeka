import { buildCrudRoutes } from "../crud-builder.ts";
import { validateTaxonomy } from "@procomeka/db/validation";
import * as repo from "@procomeka/db/repository";

const taxonomyRoutes = buildCrudRoutes({
	baseRole: "curator",
	list: (db, opts) => repo.listTaxonomies(db, opts as Parameters<typeof repo.listTaxonomies>[1]),
	getById: repo.getTaxonomyById,
	create: (db, data) => repo.createTaxonomy(db, data as Parameters<typeof repo.createTaxonomy>[1]),
	update: (db, id, data) => repo.updateTaxonomy(db, id, data as Parameters<typeof repo.updateTaxonomy>[2]),
	remove: repo.deleteTaxonomy,
	validateCreate: validateTaxonomy,
	validateUpdate: validateTaxonomy,
	mergeOnUpdate: true,
	listFilters: (_user, params) => ({ type: params.type }),
	roles: { create: "admin", update: "admin", remove: "admin" },
	notFoundMessage: "Categoría no encontrada",
});

export { taxonomyRoutes };
