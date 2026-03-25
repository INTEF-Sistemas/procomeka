/**
 * Thin wrapper: delega al repositorio compartido inyectando la instancia de DB.
 */
import { getDb } from "../db.ts";
import * as repo from "@procomeka/db/repository";

export async function listResources(opts: {
	limit?: number;
	offset?: number;
	search?: string;
	status?: string;
}) {
	return repo.listResources(getDb().db, opts);
}

export async function getResourceById(id: string) {
	return repo.getResourceById(getDb().db, id);
}

export async function getResourceBySlug(slug: string) {
	return repo.getResourceBySlug(getDb().db, slug);
}

export async function createResource(data: {
	title: string;
	description: string;
	language: string;
	license: string;
	resourceType: string;
	keywords?: string;
	author?: string;
	publisher?: string;
	subjects?: string[];
	levels?: string[];
}) {
	return repo.createResource(getDb().db, data);
}

export async function updateResource(
	id: string,
	data: Partial<{
		title: string;
		description: string;
		language: string;
		license: string;
		resourceType: string;
		keywords: string;
		author: string;
		publisher: string;
	}>,
) {
	return repo.updateResource(getDb().db, id, data);
}

export async function deleteResource(id: string) {
	return repo.deleteResource(getDb().db, id);
}

export async function updateEditorialStatus(
	id: string,
	status: string,
	curatorId: string,
) {
	return repo.updateEditorialStatus(getDb().db, id, status, curatorId);
}
