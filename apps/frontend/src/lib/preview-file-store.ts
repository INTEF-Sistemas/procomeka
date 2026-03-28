const DB_NAME = "procomeka-files";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

let cachedDb: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
	if (cachedDb) return Promise.resolve(cachedDb);
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME);
		};
		request.onsuccess = () => {
			cachedDb = request.result;
			cachedDb.onclose = () => { cachedDb = null; };
			resolve(cachedDb);
		};
		request.onerror = () => reject(request.error);
	});
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
	return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

export async function storeFile(id: string, blob: Blob): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = tx(db, "readwrite").put(blob, id);
		req.onsuccess = () => resolve();
		req.onerror = () => reject(req.error);
	});
}

export async function getFile(id: string): Promise<Blob | null> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = tx(db, "readonly").get(id);
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => reject(req.error);
	});
}

export async function deleteFile(id: string): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = tx(db, "readwrite").delete(id);
		req.onsuccess = () => resolve();
		req.onerror = () => reject(req.error);
	});
}

export function getFileUrl(blob: Blob): string {
	return URL.createObjectURL(blob);
}

export function revokeFileUrl(url: string): void {
	URL.revokeObjectURL(url);
}
