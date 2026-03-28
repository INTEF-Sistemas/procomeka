import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

type Listener = (event?: any) => any;

class FakeElement {
	innerHTML = "";
	textContent = "";
	className = "";
	value = "";
	files: File[] | null = null;
	listeners = new Map<string, Listener[]>();
	classList = {
		add: (...names: string[]) => {
			const classes = new Set(this.className.split(/\s+/).filter(Boolean));
			for (const name of names) classes.add(name);
			this.className = Array.from(classes).join(" ");
		},
		remove: (...names: string[]) => {
			const classes = new Set(this.className.split(/\s+/).filter(Boolean));
			for (const name of names) classes.delete(name);
			this.className = Array.from(classes).join(" ");
		},
	};

	addEventListener(type: string, listener: Listener) {
		const current = this.listeners.get(type) ?? [];
		current.push(listener);
		this.listeners.set(type, current);
	}

	async dispatch(type: string, event: any = {}) {
		for (const listener of this.listeners.get(type) ?? []) {
			await listener(event);
		}
	}

	querySelector() {
		return null;
	}

	getAttribute(name: string) {
		return (this as any)[`attr:${name}`] ?? null;
	}

	setAttribute(name: string, value: string) {
		(this as any)[`attr:${name}`] = value;
	}
}

class FakeRoot extends FakeElement {
	constructor(private readonly nodes: Record<string, FakeElement>) {
		super();
	}

	override querySelector(selector: string) {
		return this.nodes[selector] ?? null;
	}
}

class FakeWindow {
	listeners = new Map<string, Listener[]>();

	addEventListener(type: string, listener: Listener) {
		const current = this.listeners.get(type) ?? [];
		current.push(listener);
		this.listeners.set(type, current);
	}

	async dispatch(type: string, event: any = {}) {
		for (const listener of this.listeners.get(type) ?? []) {
			await listener(event);
		}
	}
}

let lastUppy: FakeUppy | null = null;

class FakeUppy {
	files: any[] = [];
	listeners = new Map<string, Listener[]>();
	pluginOptions: unknown[] = [];
	destroyed = false;

	constructor(public readonly options: unknown) {
		lastUppy = this;
	}

	use(_plugin: unknown, options: unknown) {
		this.pluginOptions.push(options);
		return this;
	}

	addFile(file: any) {
		const entry = {
			id: `file-${this.files.length + 1}`,
			name: file.name,
			size: file.data?.size ?? 0,
			progress: { percentage: 0, uploadComplete: false },
			response: { uploadURL: "/api/uploads/upload-1" },
		};
		this.files.push(entry);
		this.emit("file-added");
		return entry.id;
	}

	removeFile(id: string) {
		this.files = this.files.filter((file) => file.id !== id);
		this.emit("file-removed");
	}

	getFiles() {
		return this.files;
	}

	on(event: string, listener: Listener) {
		const current = this.listeners.get(event) ?? [];
		current.push(listener);
		this.listeners.set(event, current);
	}

	async emit(event: string, ...args: any[]) {
		for (const listener of this.listeners.get(event) ?? []) {
			await listener(...args);
		}
	}

	destroy() {
		this.destroyed = true;
	}
}

mock.module("@uppy/core", () => ({ default: FakeUppy }));
mock.module("@uppy/tus", () => ({ default: class FakeTus {} }));

const uploaderModule = import("./resource-uploader.ts");

describe("resource uploader init", () => {
	const originalWindow = (globalThis as any).window;

	beforeEach(() => {
		lastUppy = null;
		(globalThis as any).window = new FakeWindow();
	});

	afterEach(() => {
		(globalThis as any).window = originalWindow;
	});

	test("devuelve null si faltan nodos requeridos", async () => {
		const { initResourceUploader } = await uploaderModule;
		const api = {
			getUploadConfig: async () => ({
				maxFileSizeBytes: 1024,
				maxFilesPerBatch: 1,
				maxConcurrentPerUser: 1,
				chunkSizeBytes: 256,
				sessionTtlMs: 1000,
				allowedMimeTypes: ["application/pdf"],
				allowedExtensions: [".pdf"],
				storageDir: "/tmp/uploads",
			}),
		} as any;

		const result = await initResourceUploader({
			resourceId: "res-1",
			root: new FakeRoot({}),
			api,
		});

		expect(result).toBeNull();
	});

	test("inicializa uploader, renderiza listas y maneja eventos principales", async () => {
		const { initResourceUploader } = await uploaderModule;
		const picker = new FakeElement();
		const dropzone = new FakeElement();
		const queue = new FakeElement();
		const mediaList = new FakeElement();
		const persistedList = new FakeElement();
		const globalProgress = new FakeElement() as any;
		const globalLabel = new FakeElement();
		const feedback = new FakeElement();
		const cancelCalls: string[] = [];
		let uploads = [{
			id: "upload-1",
			resourceId: "res-1",
			ownerId: "user-1",
			status: "uploading",
			originalFilename: "guia.pdf",
			storageKey: "resource/res-1/upload-1/guia.pdf",
			receivedBytes: 50,
			declaredSize: 100,
		}];
		let mediaItems = [{
			id: "media-1",
			resourceId: "res-1",
			type: "file",
			url: "/api/v1/uploads/upload-1/content",
			filename: "guia.pdf",
			fileSize: 100,
			isPrimary: 0,
		}];
		const api = {
			getUploadConfig: async () => ({
				maxFileSizeBytes: 4096,
				maxFilesPerBatch: 1,
				maxConcurrentPerUser: 1,
				chunkSizeBytes: 256,
				sessionTtlMs: 1000,
				allowedMimeTypes: ["application/pdf"],
				allowedExtensions: [".pdf"],
				storageDir: "/tmp/uploads",
			}),
			listResourceUploads: async () => uploads,
			listResourceMediaItems: async () => mediaItems,
			cancelUpload: async (id: string) => {
				cancelCalls.push(id);
				uploads = [];
				return { id, cancelled: true };
			},
		} as any;

		const uploader = await initResourceUploader({
			resourceId: "res-1",
			root: new FakeRoot({
				"[data-upload-input]": picker,
				"[data-upload-dropzone]": dropzone,
				"[data-upload-queue]": queue,
				"[data-media-list]": mediaList,
				"[data-persisted-uploads]": persistedList,
				"[data-global-progress]": globalProgress,
				"[data-global-progress-label]": globalLabel,
				"[data-upload-feedback]": feedback,
			}) as any,
			api,
		});

		expect(uploader).not.toBeNull();
		expect(lastUppy).not.toBeNull();
		expect(persistedList.innerHTML).toContain("guia.pdf");
		expect(mediaList.innerHTML).toContain("/api/v1/uploads/upload-1/content");
		expect(queue.innerHTML).toContain("No hay archivos en cola.");
		expect(globalLabel.textContent).toBe("Sin subidas activas");

		picker.files = [new File(["pdf"], "tema.pdf", { type: "application/pdf" })];
		await picker.dispatch("change");
		expect(queue.innerHTML).toContain("tema.pdf");
		expect(globalLabel.textContent).toContain("% subido");

		const beforeUnloadWhileActive = {
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true;
			},
			returnValue: undefined as string | undefined,
		};
		await ((globalThis as any).window as FakeWindow).dispatch("beforeunload", beforeUnloadWhileActive);
		expect(beforeUnloadWhileActive.defaultPrevented).toBe(true);
		expect(beforeUnloadWhileActive.returnValue).toBe("");

		await dropzone.dispatch("dragover", { preventDefault() {} });
		expect(dropzone.className).toContain("is-dragover");
		await dropzone.dispatch("dragleave");
		expect(dropzone.className).not.toContain("is-dragover");

		await persistedList.dispatch("click", {
			target: {
				getAttribute(name: string) {
					return name === "data-cancel-upload" ? "upload-1" : null;
				},
			},
		});
		expect(cancelCalls).toEqual(["upload-1"]);
		expect(persistedList.innerHTML).toContain("No hay uploads recientes.");

		await queue.dispatch("click", {
			target: {
				getAttribute(name: string) {
					if (name === "data-remove-local") return "file-1";
					if (name === "data-upload-id") return "upload-1";
					return null;
				},
			},
		});
		expect(cancelCalls).toEqual(["upload-1", "upload-1"]);

		await lastUppy!.emit("upload-success");
		expect(feedback.textContent).toBe("Archivo subido correctamente.");
		expect(feedback.className).toBe("upload-feedback success");

		await lastUppy!.emit("upload-error", null, new Error("fallo upload"));
		expect(feedback.textContent).toBe("fallo upload");
		expect(feedback.className).toBe("upload-feedback error");

		const beforeUnloadEvent = {
			defaultPrevented: false,
			preventDefault() {
				this.defaultPrevented = true;
			},
			returnValue: undefined as string | undefined,
		};
		await ((globalThis as any).window as FakeWindow).dispatch("beforeunload", beforeUnloadEvent);
		expect(beforeUnloadEvent.defaultPrevented).toBe(false);
		expect(beforeUnloadEvent.returnValue).toBeUndefined();

		uploader!.destroy();
		expect(lastUppy!.destroyed).toBe(true);
	});
});
