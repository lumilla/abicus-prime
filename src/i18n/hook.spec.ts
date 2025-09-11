import { translations, supportedLanguages, DEFAULT_LANGUAGE, LanguageCode } from "./translations";

// Mock localStorage for testing
const mockLocalStorage = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
		removeItem: (key: string) => {
			delete store[key];
		},
	};
})();

// Helper function to simulate the translation logic from the hook
function getTranslation(key: string, language: LanguageCode): string {
	return translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? key;
}

function getStoredLanguage(): LanguageCode {
	try {
		const stored = mockLocalStorage.getItem("abicus-language");
		if (stored && stored in translations) {
			return stored;
		}
	} catch {
		// localStorage might not be available
	}
	return DEFAULT_LANGUAGE;
}

function setStoredLanguage(language: LanguageCode): void {
	try {
		mockLocalStorage.setItem("abicus-language", language);
	} catch {
		// localStorage might not be available
	}
}

describe("i18n translations", () => {
	beforeEach(() => {
		mockLocalStorage.clear();
	});

	describe("translation completeness", () => {
		test("all languages have the same translation keys", () => {
			const finnishKeys = Object.keys(translations["fi"] ?? translations[Object.keys(translations)[0] || ""] ?? {});
			const languages = Object.keys(translations);

			for (const lang of languages) {
				const langKeys = Object.keys(translations[lang] ?? {});
				const sortedLangKeys = [...langKeys].sort((a, b) => a.localeCompare(b));
				const sortedFinnishKeys = [...finnishKeys].sort((a, b) => a.localeCompare(b));
				expect(sortedLangKeys).toEqual(sortedFinnishKeys);
			}
		});

		test("no translation values are empty", () => {
			for (const translationMap of Object.values(translations)) {
				for (const [key, value] of Object.entries(translationMap ?? {})) {
					expect(value.trim()).not.toBe("");
					expect(value).not.toBe(key);
				}
			}
		});
	});

	describe("translation retrieval", () => {
		test("returns correct translation for default language", () => {
			expect(getTranslation("settings.title", DEFAULT_LANGUAGE)).toBe("Asetukset");
			expect(getTranslation("error.title", DEFAULT_LANGUAGE)).toBe("Jotain meni pieleen!");
			expect(getTranslation("common.close", DEFAULT_LANGUAGE)).toBe("Sulje");
		});

		test("returns correct translation for English", () => {
			expect(getTranslation("settings.title", "en")).toBe("Settings");
			expect(getTranslation("error.title", "en")).toBe("Something went wrong!");
			expect(getTranslation("common.close", "en")).toBe("Close");
		});

		test("returns correct translation for Swedish", () => {
			expect(getTranslation("settings.title", "sv")).toBe("Inställningar");
			expect(getTranslation("error.title", "sv")).toBe("Något gick fel!");
			expect(getTranslation("common.close", "sv")).toBe("Stäng");
		});

		test("returns correct translation for Northern Sami", () => {
			expect(getTranslation("settings.title", "se")).toBe("Ásahusat");
			expect(getTranslation("error.title", "se")).toBe("Juoga manai boastut!");
			expect(getTranslation("common.close", "se")).toBe("Gidde");
		});

		test("falls back to default language for missing key", () => {
			// Create a modified translations object for testing
			const modifiedTranslations: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(translations));
			if (modifiedTranslations["en"]) {
				delete modifiedTranslations["en"]["settings.title"];
			}

			// Simulate the fallback behavior
			const fallback = modifiedTranslations["en"]?.["settings.title"] ?? modifiedTranslations["fi"]?.["settings.title"];
			expect(fallback).toBe("Asetukset");
		});
	});

	describe("language storage", () => {
		test("returns default language when no stored preference", () => {
			expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
		});

		test("returns stored language preference", () => {
			mockLocalStorage.setItem("abicus-language", "en");
			expect(getStoredLanguage()).toBe("en");
		});

		test("falls back to default for invalid stored language", () => {
			mockLocalStorage.setItem("abicus-language", "invalid-lang");
			expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);
		});

		test("stores language preference", () => {
			setStoredLanguage("sv");
			expect(mockLocalStorage.getItem("abicus-language")).toBe("sv");
		});

		test("handles localStorage errors gracefully", () => {
			// Mock localStorage to throw errors
			const originalGetItem = mockLocalStorage.getItem;
			const originalSetItem = mockLocalStorage.setItem;

			mockLocalStorage.getItem = () => {
				throw new Error("localStorage error");
			};
			mockLocalStorage.setItem = () => {
				throw new Error("localStorage error");
			};

			// Should not throw and should return default language
			expect(() => getStoredLanguage()).not.toThrow();
			expect(getStoredLanguage()).toBe(DEFAULT_LANGUAGE);

			// Should not throw when setting language
			expect(() => setStoredLanguage("en")).not.toThrow();

			// Restore original methods
			mockLocalStorage.getItem = originalGetItem;
			mockLocalStorage.setItem = originalSetItem;
		});
	});

	describe("supported languages configuration", () => {
		test("all supported languages exist in translations", () => {
			for (const langCode of Object.keys(supportedLanguages)) {
				expect(langCode in translations).toBe(true);
			}
		});

		test("all supported languages have valid translation keys for names", () => {
			for (const [langCode, config] of Object.entries(supportedLanguages)) {
				expect(config.code).toBe(langCode);
				const ref = translations["fi"] ?? translations[Object.keys(translations)[0] ?? ""];
				expect(config.name in (ref ?? {})).toBe(true);
			}
		});

		test("default language is supported", () => {
			expect(DEFAULT_LANGUAGE in supportedLanguages).toBe(true);
			expect(DEFAULT_LANGUAGE in translations).toBe(true);
		});
	});

	describe("specific translation categories", () => {
		test("key translation samples work correctly", () => {
			// Test a few key translations directly
			expect(getTranslation("settings.language", "fi")).toBe("Kieli");
			expect(getTranslation("settings.language", "en")).toBe("Language");
			expect(getTranslation("settings.language", "sv")).toBe("Språk");
			expect(getTranslation("settings.language", "se")).toBe("Giella");

			expect(getTranslation("error.title", "fi")).toBe("Jotain meni pieleen!");
			expect(getTranslation("error.title", "en")).toBe("Something went wrong!");

			expect(getTranslation("common.close", "fi")).toBe("Sulje");
			expect(getTranslation("common.close", "en")).toBe("Close");
		});

		test("all translation categories are present", () => {
			const expectedCategories = ["settings", "error", "language", "terminal", "common"];
			const allKeys = Object.keys(translations["fi"] ?? ({} as Record<string, string>));

			for (const category of expectedCategories) {
				const hasCategory = allKeys.some(key => key.startsWith(category + "."));
				expect(hasCategory).toBe(true);
			}
		});
	});
});
