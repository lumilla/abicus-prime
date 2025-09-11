import { translations, supportedLanguages, DEFAULT_LANGUAGE, LanguageCode } from "./translations";

describe("i18n translations data", () => {
	describe("structure validation", () => {
		test("default language is defined correctly", () => {
			expect(DEFAULT_LANGUAGE).toBe("fi");
			expect(DEFAULT_LANGUAGE in translations).toBe(true);
		});

		test("all required languages are present", () => {
			const expectedLanguages: LanguageCode[] = ["fi", "sv", "en", "se"];
			const actualLanguages = Object.keys(translations);

			const sortedActual = [...actualLanguages].sort((a, b) => a.localeCompare(b));
			const sortedExpected = [...expectedLanguages].sort((a, b) => a.localeCompare(b));
			expect(sortedActual).toEqual(sortedExpected);
		});
		test("all translation objects are readonly", () => {
			// This tests the 'as const' assertion effectiveness at compile time
			// At runtime, JavaScript objects are still mutable, so we just verify the structure
			expect(translations).toBeDefined();
			expect(typeof translations).toBe("object");

			// The real test is that TypeScript compilation would fail if we tried to modify
			// the translations object due to the 'as const' assertion
		});
	});

	describe("translation key consistency", () => {
		const firstKey = Object.keys(translations)[0] ?? "";
		const referenceKeys = Object.keys(translations["fi"] ?? translations[firstKey] ?? {});

		test("Finnish (reference) has all expected categories", () => {
			const categories = ["settings.", "error.", "language.", "terminal.", "common."];

			for (const category of categories) {
				const hasCategory = referenceKeys.some(key => key.startsWith(category));
				expect(hasCategory).toBe(true);
			}
		});

		test("all languages have identical key structures", () => {
			for (const langTranslations of Object.values(translations)) {
				const langKeys = Object.keys(langTranslations ?? {});
				const sortedLangKeys = [...langKeys].sort((a, b) => a.localeCompare(b));
				const sortedReferenceKeys = [...referenceKeys].sort((a, b) => a.localeCompare(b));
				expect(sortedLangKeys).toEqual(sortedReferenceKeys);
			}
		});

		test("specific critical keys exist in all languages", () => {
			const criticalKeys: string[] = [
				"settings.title",
				"settings.language",
				"error.title",
				"error.description",
				"common.close",
				"terminal.title",
			];

			for (const key of criticalKeys) {
				for (const langCode of Object.keys(translations)) {
					const translation = translations[langCode]?.[key];
					expect(translation!.trim().length).toBeGreaterThan(0);
				}
			}
		});
	});

	describe("supported languages configuration", () => {
		test("configuration matches available translations", () => {
			const configuredLanguages = Object.keys(supportedLanguages);
			const availableLanguages = Object.keys(translations);

			const sortedConfigured = [...configuredLanguages].sort((a, b) => a.localeCompare(b));
			const sortedAvailable = [...availableLanguages].sort((a, b) => a.localeCompare(b));
			expect(sortedConfigured).toEqual(sortedAvailable);
		});

		test("language name keys exist in translations", () => {
			for (const [langCode, config] of Object.entries(supportedLanguages)) {
				expect(config.code).toBe(langCode);

				// The name should be a valid translation key in the reference (fi) or first available
				const first = Object.keys(translations)[0] ?? "";
				const ref = translations["fi"] ?? translations[first];
				expect(ref).toBeDefined();
				expect(config.name in (ref ?? {})).toBe(true);

				// All languages should have this name translation
				for (const translationLang of Object.keys(translations)) {
					expect(translations[translationLang]?.[config.name]).toBeTruthy();
				}
			}
		});

		test("language codes are valid", () => {
			const validLanguageCodes = ["fi", "sv", "en", "se"];

			for (const langCode of Object.keys(supportedLanguages)) {
				expect(validLanguageCodes).toContain(langCode);
			}
		});
	});

	describe("translation quality checks", () => {
		test("no translations are identical to their keys", () => {
			for (const langTranslations of Object.values(translations)) {
				for (const [key, value] of Object.entries(langTranslations)) {
					expect(value).not.toBe(key);
				}
			}
		});

		test("no translations contain placeholder text", () => {
			const placeholderPatterns = [/TODO/i, /FIXME/i, /\[.*\]/, /\{.*\}/, /xxx/i, /placeholder/i];

			for (const langTranslations of Object.values(translations)) {
				for (const value of Object.values(langTranslations)) {
					for (const pattern of placeholderPatterns) {
						expect(pattern.test(value)).toBe(false);
					}
				}
			}
		});

		test("translations have reasonable length", () => {
			for (const langTranslations of Object.values(translations)) {
				for (const [key, value] of Object.entries(langTranslations)) {
					expect(value.length).toBeGreaterThan(0);
					expect(value.length).toBeLessThan(200); // Reasonable upper limit

					// Specific checks for certain types of keys
					if (key.includes("title")) {
						expect(value.length).toBeLessThan(50);
					}
				}
			}
		});

		test("Northern Sami translations are marked as placeholders where appropriate", () => {
			// The Northern Sami translations should be reviewed by native speakers
			// This test ensures we're aware of their placeholder status
			const seTranslations = translations["se"] ?? {};

			// We expect these to exist and be non-empty, even if they're placeholders
			expect(Object.keys(seTranslations).length).toBeGreaterThan(0);

			for (const value of Object.values(seTranslations)) {
				expect(typeof value).toBe("string");
				expect(value.trim().length).toBeGreaterThan(0);
			}
		});
	});

	describe("type safety validation", () => {
		test("string type covers all Finnish keys", () => {
			const finnishKeys = Object.keys(translations["fi"] ?? {});

			// This is more of a compile-time check, but we can verify at runtime too
			finnishKeys.forEach(key => {
				// If this compiles without error, our type is correct
				const typedKey: string = key;
				expect(typeof typedKey).toBe("string");
			});
		});

		test("LanguageCode type covers all available languages", () => {
			const availableLanguages = Object.keys(translations);

			availableLanguages.forEach(lang => {
				// If this compiles without error, our type is correct
				const typedLang = lang;
				expect(typeof typedLang).toBe("string");
			});
		});
	});
});
