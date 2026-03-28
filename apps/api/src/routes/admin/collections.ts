import { buildCrudRoutes } from "../crud-builder.ts";
import { validateCollection } from "@procomeka/db/validation";
import { hasMinRole, canManageCollection } from "../../auth/roles.ts";
import { ensureCurrentUser } from "../../helpers.ts";
import * as repo from "@procomeka/db/repository";

const collectionRoutes = buildCrudRoutes({
	baseRole: "author",
	list: (db, opts) => repo.listCollections(db, opts as Parameters<typeof repo.listCollections>[1]),
	getById: repo.getCollectionById,
	create: (db, data) => repo.createCollection(db, data as Parameters<typeof repo.createCollection>[1]),
	update: (db, id, data) => repo.updateCollection(db, id, data as Parameters<typeof repo.updateCollection>[2]),
	remove: repo.deleteCollection,
	validateCreate: validateCollection,
	validateUpdate: validateCollection,
	mergeOnUpdate: true,
	canManage: canManageCollection,
	listFilters: (user) => ({
		curatorId: hasMinRole(user.role, "admin") ? undefined : user.id,
	}),
	prepareCreate: async (body, user) => {
		await ensureCurrentUser(user);
		return {
			title: body.title,
			description: body.description,
			curatorId: user.id,
			editorialStatus: typeof body.editorialStatus === "string" ? body.editorialStatus : undefined,
			isOrdered: body.isOrdered ? 1 : 0,
		};
	},
	notFoundMessage: "Colección no encontrada",
});

export { collectionRoutes };
