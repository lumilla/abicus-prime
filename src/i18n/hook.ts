import { useState } from "preact/hooks";
import { translations, LanguageCode, DEFAULT_LANGUAGE, supportedLanguages } from "./translations";

const STORAGE_KEY = "abicus-language";

// Get the translation for a specific key and language
function getTranslation(key: string, language: LanguageCode): string {
	const langTable = translations[language];
	const defaultTable = translations[DEFAULT_LANGUAGE];

	// Prefer the language table value when present and a string.
	if (langTable && typeof langTable[key] === "string") {
		return langTable[key];
	}

	// Fallback to default language table if present.
	if (defaultTable && typeof defaultTable[key] === "string") {
		return defaultTable[key];
	}

	// Final fallback: return the key itself.
	return String(key);
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

	// Translation function with type safety
	const t = (key: string): string => {
		return getTranslation(key, currentLanguage);
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
