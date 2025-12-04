import { useState } from "preact/hooks";
import { translations, LanguageCode, DEFAULT_LANGUAGE, supportedLanguages } from "./translations";

const STORAGE_KEY = "abicus-language";

// Get the translation for a specific key and language
function getTranslation(key: string, language: LanguageCode, params?: Record<string, string | number>): string {
	const langTable = translations[language];
	const defaultTable = translations[DEFAULT_LANGUAGE];

	let result: string;

	// Prefer the language table value when present and a string.
	if (langTable && typeof langTable[key] === "string") {
		result = langTable[key];
	} else if (defaultTable && typeof defaultTable[key] === "string") {
		// Fallback to default language table if present.
		result = defaultTable[key];
	} else {
		// Final fallback: return the key itself.
		result = String(key);
	}

	// Interpolate parameters like {{name}} or {{count}}
	if (params) {
		for (const [paramKey, paramValue] of Object.entries(params)) {
			result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue));
		}
	}

	return result;
}

// Get the stored language preference or default
function getStoredLanguage(): LanguageCode {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && stored in translations) {
			return stored;
		}
	} catch {
		// localStorage might not be available
	}
	return DEFAULT_LANGUAGE;
}

// Store the language preference
function setStoredLanguage(language: LanguageCode): void {
	try {
		localStorage.setItem(STORAGE_KEY, language);
	} catch {
		// localStorage might not be available
	}
}

export function useTranslation() {
	const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(getStoredLanguage);

	// Translation function with type safety and parameter interpolation
	const t = (key: string, params?: Record<string, string | number>): string => {
		return getTranslation(key, currentLanguage, params);
	};

	// Function to change language
	const setLanguage = (language: LanguageCode): void => {
		if (!(language in translations)) return;
		setCurrentLanguage(language);
		setStoredLanguage(language);
	};

	return {
		t,
		currentLanguage,
		setLanguage,
		supportedLanguages: Object.values(supportedLanguages).map(s => ({ code: s.code, nameKey: s.name })),
	};
}
