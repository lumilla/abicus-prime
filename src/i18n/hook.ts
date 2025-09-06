import { useState } from "preact/hooks";
import { translations, TranslationKey, LanguageCode, DEFAULT_LANGUAGE, supportedLanguages } from "./translations";

const STORAGE_KEY = "abicus-language";

// Get the translation for a specific key and language
function getTranslation(key: TranslationKey, language: LanguageCode): string {
	const langTable = translations[language] as Record<string, string> | undefined;
	const defaultTable = translations[DEFAULT_LANGUAGE] as Record<string, string>;

	if (langTable && key in langTable) {
		return langTable[key] || key;
	}
	if (key in defaultTable) {
		return defaultTable[key] || key;
	}
	return key;
}

// Get the stored language preference or default
function getStoredLanguage(): LanguageCode {
	try {
		const stored = localStorage.getItem(STORAGE_KEY) as string | null;
		if (stored && stored in translations) {
			return stored as LanguageCode;
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
	const t = (key: TranslationKey): string => {
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
