export const LANGUAGE_OPTIONS = [
	{ value: "es", label: "Español" },
	{ value: "en", label: "Inglés" },
	{ value: "ca", label: "Catalán" },
	{ value: "eu", label: "Euskera" },
	{ value: "gl", label: "Gallego" },
] as const;

export const LICENSE_OPTIONS = [
	{ value: "cc-by", label: "CC BY" },
	{ value: "cc-by-sa", label: "CC BY-SA" },
	{ value: "cc-by-nc", label: "CC BY-NC" },
	{ value: "cc-by-nc-sa", label: "CC BY-NC-SA" },
	{ value: "cc0", label: "CC0 (Dominio público)" },
] as const;

export const RESOURCE_TYPE_OPTIONS = [
	{ value: "documento", label: "Documento" },
	{ value: "presentacion", label: "Presentación" },
	{ value: "video", label: "Vídeo" },
	{ value: "audio", label: "Audio" },
	{ value: "imagen", label: "Imagen" },
	{ value: "actividad-interactiva", label: "Actividad interactiva" },
	{ value: "secuencia-didactica", label: "Secuencia didáctica" },
	{ value: "ejercicio", label: "Ejercicio" },
	{ value: "evaluacion", label: "Evaluación" },
	{ value: "proyecto", label: "Proyecto" },
] as const;
