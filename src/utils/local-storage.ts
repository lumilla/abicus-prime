/**
 * Tiny helpers that eliminate the repetitive
 * `if (typeof window === "undefined") … try { localStorage.getItem … } catch { … }` pattern.
 */

/** Read a string value from localStorage (returns `null` when unavailable or on error). */
export function loadString(key: string): string | null {
	if (typeof window === "undefined") return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

/** Write a string value to localStorage, silently swallowing errors. */
export function saveString(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Ignore storage errors (e.g. quota exceeded, SSR)
	}
}

/** Remove a key from localStorage, silently swallowing errors. */
export function removeKey(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore storage errors
	}
}

/**
 * Read a JSON-serialised value from localStorage.
 * Returns the parsed value, or `fallback` on any error / missing key.
 */
export function loadJSON<T>(key: string, fallback: T): T {
	const raw = loadString(key);
	if (raw === null) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

/** Write a JSON-serialisable value to localStorage. */
export function saveJSON(key: string, value: unknown): void {
	saveString(key, JSON.stringify(value));
}
