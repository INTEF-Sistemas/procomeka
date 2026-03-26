export interface FilterOption {
	label: string;
	value: string;
}

export const RESOURCE_TYPE_OPTIONS: FilterOption[] = [
	{ value: "", label: "Todos los tipos" },
	{ value: "documento", label: "Documento" },
	{ value: "presentacion", label: "Presentacion" },
	{ value: "video", label: "Video" },
	{ value: "audio", label: "Audio" },
	{ value: "imagen", label: "Imagen" },
	{ value: "actividad-interactiva", label: "Actividad interactiva" },
	{ value: "secuencia-didactica", label: "Secuencia didactica" },
	{ value: "ejercicio", label: "Ejercicio" },
	{ value: "evaluacion", label: "Evaluacion" },
	{ value: "proyecto", label: "Proyecto" },
] as const;

export const LANGUAGE_OPTIONS: FilterOption[] = [
	{ value: "", label: "Todos los idiomas" },
	{ value: "es", label: "Espanol" },
	{ value: "en", label: "Ingles" },
	{ value: "ca", label: "Catalan" },
	{ value: "eu", label: "Euskera" },
	{ value: "gl", label: "Gallego" },
	{ value: "fr", label: "Frances" },
	{ value: "pt", label: "Portugues" },
	{ value: "de", label: "Aleman" },
	{ value: "it", label: "Italiano" },
] as const;

export const LICENSE_OPTIONS: FilterOption[] = [
	{ value: "", label: "Todas las licencias" },
	{ value: "cc-by", label: "CC BY" },
	{ value: "cc-by-sa", label: "CC BY-SA" },
	{ value: "cc-by-nc", label: "CC BY-NC" },
	{ value: "cc-by-nc-sa", label: "CC BY-NC-SA" },
	{ value: "cc-by-nc-nd", label: "CC BY-NC-ND" },
	{ value: "cc-by-nd", label: "CC BY-ND" },
	{ value: "cc0", label: "CC0" },
] as const;
