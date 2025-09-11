// Translation keys and messages for the calculator
// Dynamic translations loader using Vite's import.meta.glob
// Locale files are JSON files placed under src/i18n/locales/*.json

type LocaleMeta = {
	code: string;
	nameKey: string;
	placeholder?: boolean;
};

export type TranslationsMap = Record<string, Record<string, string>>;

// Use Vite's glob to discover locale JSON files at build time.
// The glob below should be tree-shaken by the bundler; in dev it will dynamically import.
const modules = import.meta.glob("./locales/*.json", { eager: true });

// Build translations object and metadata
export const translations: TranslationsMap = {};
export const _localeMeta: Record<string, LocaleMeta> = {};

for (const [path, mod] of Object.entries(modules)) {
	// mod is the parsed JSON
	const locale = (mod as { default?: any; _meta?: LocaleMeta } & Record<string, any>).default ?? mod;
	const meta: LocaleMeta = locale._meta ?? { code: inferCodeFromPath(path), nameKey: "language.unknown" };
	const code = meta.code ?? inferCodeFromPath(path);
	const entries = { ...locale };
	delete entries._meta;

	translations[code] = entries;
	_localeMeta[code] = meta;
}

function inferCodeFromPath(path: string) {
	const regex = /([a-z]{2})\.json$/i;
	const match = regex.exec(path);
	return match ? match[1] : "en";
}

// Types derived from available locales
export type LanguageCode = keyof typeof translations;

// Use Finnish as default when available, otherwise first available
export const DEFAULT_LANGUAGE: LanguageCode = "fi" in translations ? "fi" : (Object.keys(translations)[0] ?? "en");

// Supported languages: build from discovered locale files to avoid code changes when adding files
export const supportedLanguages: Record<string, { name: string; code: string; meta?: LocaleMeta }> = {};
for (const code of Object.keys(translations)) {
	const meta = _localeMeta[code];
	supportedLanguages[code] = { name: meta?.nameKey ?? code, code, meta };
}
