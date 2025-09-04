// Translation keys and messages for the calculator
// This approach provides compile-time type safety and zero runtime overhead

export const translations = {
	fi: {
		// Settings
		"settings.title": "Asetukset",
		"settings.angleUnit": "Kulman yksikkö",
		"settings.radians": "Radiaanit",
		"settings.degrees": "Asteet",
		"settings.interfaceMode": "Käyttöliittymätila",
		"settings.pocket": "Tasku",
		"settings.terminal": "Pääte",
		"settings.theme": "Teema",
		"settings.light": "Vaalea",
		"settings.dark": "Tumma",
		"settings.language": "Kieli",
		"settings.clear": "Tyhjennä",
		"settings.version": "Abicus Prime Laskin",

		// Error boundary
		"error.title": "Jotain meni pieleen!",
		"error.description": "Välitäthän alla olevan virheviestin Abitti-tukeen.",
		"error.restart": "Uudelleenkäynnistä",
		"error.imageAlt": "Virhe",

		// Languages
		"language.finnish": "Suomi",
		"language.swedish": "Ruotsi",
		"language.english": "Englanti",
		"language.northernsami": "Pohjoissaame",

		// Terminal
		"terminal.title": "Abicus Prime Pääte",
		"terminal.placeholder": "Syötä laskutoimitus...",
		"terminal.error": "Virhe",

		// Common
		"common.close": "Sulje",
	},
	sv: {
		// Settings
		"settings.title": "Inställningar",
		"settings.angleUnit": "Vinkelenhet",
		"settings.radians": "Radianer",
		"settings.degrees": "Grader",
		"settings.interfaceMode": "Gränssnitt",
		"settings.pocket": "Miniräknare",
		"settings.terminal": "Terminal",
		"settings.theme": "Tema",
		"settings.light": "Ljus",
		"settings.dark": "Mörk",
		"settings.language": "Språk",
		"settings.clear": "Rensa",
		"settings.version": "Abicus Prime Kalkylator",

		// Error boundary
		"error.title": "Något gick fel!",
		"error.description": "Vänligen lämna feluppgifterna nedan till Abitti-support.",
		"error.restart": "Omstarta",
		"error.imageAlt": "Fel",

		// Languages
		"language.finnish": "Finska",
		"language.swedish": "Svenska",
		"language.english": "Engelska",
		"language.northernsami": "Nordsamiska",

		// Terminal
		"terminal.title": "Abicus Prime Terminal",
		"terminal.placeholder": "Ange beräkning...",
		"terminal.error": "Fel",

		// Common
		"common.close": "Stäng",
	},
	en: {
		// Settings
		"settings.title": "Settings",
		"settings.angleUnit": "Angle Unit",
		"settings.radians": "Radians",
		"settings.degrees": "Degrees",
		"settings.interfaceMode": "Interface Mode",
		"settings.pocket": "Pocket",
		"settings.terminal": "Terminal",
		"settings.theme": "Theme",
		"settings.light": "Light",
		"settings.dark": "Dark",
		"settings.language": "Language",
		"settings.clear": "Clear",
		"settings.version": "Abicus Prime Calculator",

		// Error boundary
		"error.title": "Something went wrong!",
		"error.description": "Please report the error details below to Abitti support.",
		"error.restart": "Restart",
		"error.imageAlt": "Error",

		// Languages
		"language.finnish": "Finnish",
		"language.swedish": "Swedish",
		"language.english": "English",
		"language.northernsami": "Northern Sami",

		// Terminal
		"terminal.title": "Abicus Prime Terminal",
		"terminal.placeholder": "Enter calculation...",
		"terminal.error": "Error",

		// Common
		"common.close": "Close",
	},
	se: {
		// PLACEHOLDER: Northern Sami (Davvisámegiella) translations
		// These translations are placeholders created using a dictionary
		// and should be reviewed by a native Northern Sami speaker
		// Settings
		"settings.title": "Ásahusat",
		"settings.angleUnit": "Čiehka ovttadat",
		"settings.radians": "Rádiánat",
		"settings.degrees": "Grádat",
		"settings.interfaceMode": "Čájehanvuogi",
		"settings.pocket": "Lumma",
		"settings.terminal": "Terminal",
		"settings.theme": "Ivdnitema",
		"settings.light": "Čuovgat",
		"settings.dark": "Seavdnjat",
		"settings.language": "Giella",
		"settings.clear": "Sihko",
		"settings.version": "Abicus Prime Rehkenastin",

		// Error boundary
		"error.title": "Juoga manai boastut!",
		"error.description": "Dieđit meattáhusa birra Abitti doarjagii!",
		"error.restart": "Álggahit ođđasit",
		"error.imageAlt": "Meattáhus",

		// Languages
		"language.finnish": "Suomagiella",
		"language.swedish": "Ruoŧagiella",
		"language.english": "Eŋgelasgiella",
		"language.northernsami": "Davvisámegiella",

		// Terminal
		"terminal.title": "Abicus Prime Terminála",
		"terminal.placeholder": "Čális rehkenastima...",
		"terminal.error": "Meattáhus",

		// Common
		"common.close": "Gidde",
	},
} as const;

// Extract the translation keys from the Finnish translations for type safety
export type TranslationKey = keyof typeof translations.fi;

// Supported language codes
export type LanguageCode = keyof typeof translations;

// Language options for the settings dropdown
export const supportedLanguages: Record<LanguageCode, { name: TranslationKey; code: LanguageCode }> = {
	fi: { name: "language.finnish", code: "fi" },
	sv: { name: "language.swedish", code: "sv" },
	en: { name: "language.english", code: "en" },
	se: { name: "language.northernsami", code: "se" },
};

// Default language (Finnish for Finnish matriculation exams)
export const DEFAULT_LANGUAGE: LanguageCode = "fi";
