import Decimal from "decimal.js";
import { createContext, ComponentChildren } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import { AngleUnit, calculate } from "#/calculator";
import { formatResult } from "#/utils/format-result";
import { loadString, saveString, loadJSON, saveJSON, removeKey } from "#/utils/local-storage";

import useBuffer, { BufferHandle } from "./internal-buffer";
import useMemory, { MemoryHandle } from "./internal-memory";
import {
	UserFunction,
	UserFunctionsMap,
	parseFunctionDefinition,
	UserConstant,
	UserConstantsMap,
	parseConstantDefinition,
} from "./user-functions";
import type { DecimalSeparator } from "./types";

type InterfaceMode = "pocket" | "terminal";
type Language = "fi" | "sv" | "en" | "se";
type FontSize = number;
type WindowSize = "small" | "medium" | "large";
export type { DecimalSeparator } from "./types";
export type { UserFunction, UserConstant } from "./user-functions";

// Font size limits (in points)
const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_DEFAULT = 16;

export type TerminalHistoryItem = {
	expression: string;
	result: string;
	timestamp: number;
	isFunction?: boolean; // Mark function definitions for special styling
	isNumericResult?: boolean; // True if the result is a numeric value that can be reused
};

type CalculatorContext = {
	/** Handle to the calculator's input buffer */
	buffer: BufferHandle;
	/** Handle to the calculator's memory registers */
	memory: MemoryHandle;

	/** Clear the input buffer and all memory registers */
	clearAll(): void;
	/** Shared history between pocket and terminal modes */
	sharedHistory: TerminalHistoryItem[];
	/** Push an item into shared history */
	pushSharedHistory(item: TerminalHistoryItem): void;
	/** Clear shared history */
	clearSharedHistory(): void;
	/** Terminal history persisted across mounts (legacy - keeping for compatibility) */
	terminalHistory: TerminalHistoryItem[];
	/** Push an item into terminal history (legacy - keeping for compatibility) */
	pushTerminalHistory(item: TerminalHistoryItem): void;
	/** Clear terminal history (legacy - keeping for compatibility) */
	clearTerminalHistory(): void;

	/** User-defined functions */
	userFunctions: UserFunctionsMap;
	/** Define a new user function */
	defineFunction(func: UserFunction): void;
	/** Remove a user function by name */
	removeFunction(name: string): void;
	/** Clear all user-defined functions */
	clearFunctions(): void;
	/** Try to parse and define a function from an expression. Returns the function if defined, null otherwise */
	tryDefineFunction(expression: string): UserFunction | null;

	/** User-defined constants */
	userConstants: UserConstantsMap;
	/** Define a new user constant */
	defineConstant(constant: UserConstant): void;
	/** Remove a user constant by name */
	removeConstant(name: string): void;
	/** Clear all user-defined constants */
	clearConstants(): void;
	/** Try to parse and define a constant from an expression. Returns the constant if defined, null otherwise */
	tryDefineConstant(expression: string): UserConstant | null;

	/** Unit to use in trigonometric functions */
	angleUnit: AngleUnit;
	/** Switch to using radians */
	radsOn(): void;
	/** Switch to using degrees */
	degsOn(): void;

	/** Interface mode - pocket or terminal */
	interfaceMode: InterfaceMode;
	/** Set interface mode */
	setInterfaceMode(mode: InterfaceMode): void;

	/** Dark mode preference */
	isDarkMode: boolean;
	/** Set dark mode to a specific value */
	setDarkMode: (value: boolean) => void;

	/** Font size preference */
	fontSize: FontSize;
	/** Set font size */
	setFontSize: (size: FontSize) => void;

	/** Window size preference (Tauri only) */
	windowSize: WindowSize;
	/** Set window size */
	setWindowSize: (size: WindowSize) => void;

	/** Decimal separator preference */
	decimalSeparator: DecimalSeparator;
	/** Set decimal separator */
	setDecimalSeparator: (separator: DecimalSeparator) => void;

	/** Current language */
	language: Language;
	/** Set language */
	setLanguage: (language: Language) => void;

	/** Settings page visibility */
	showSettings: boolean;
	/** Show settings page */
	openSettings(): void;
	/** Hide settings page */
	closeSettings(): void;

	/**
	 * Crunch the numbers!
	 *
	 * - Evaluates the expression in the input buffer.
	 * - Stores the result in the answer memory register.
	 * - Marks the input buffer as "clean" to signal that *the current answer matches the value of the input buffer*.
	 *
	 * @param `saveToInd` Whether the result should be saved **also** to the independent memory register. Default `false`.
	 * @returns The result of the expression in the input buffer or `undefined` if the input could not be evaluated.
	 */
	crunch(saveToInd?: boolean): Decimal | undefined;
};

const CalculatorContextObject = createContext<CalculatorContext | null>(null);

/**
 * Returns a handle to the app-global memory registers and user input buffer
 * as well as methods to clear the state and to actually perform the user-given calculation.
 */
export function useCalculator() {
	const handle = useContext(CalculatorContextObject);
	if (!handle) throw Error("Programmer Error: Calculator Context was used outside its Provider");
	return handle;
}

export default function CalculatorProvider({ children }: { children: ComponentChildren }) {
	const [angleUnit, setAngleUnit] = useState<AngleUnit>(() => (loadString("abicus-angle-unit") as AngleUnit) || "deg");
	const [interfaceMode, setInterfaceModeState] = useState<InterfaceMode>(
		() => (loadString("abicus-interface-mode") as InterfaceMode) || "pocket",
	);
	const [language, setLanguageState] = useState<Language>(() => (loadString("abicus-language") as Language) || "fi");

	const [isDarkMode, setIsDarkMode] = useState(() => {
		const saved = loadString("abicus-dark-mode");
		if (saved !== null) return JSON.parse(saved) as boolean;
		if (typeof window === "undefined") return false;
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
	});

	const [fontSize, setFontSizeState] = useState<FontSize>(() => {
		const saved = loadString("abicus-font-size");
		if (saved) {
			const parsed = parseInt(saved, 10);
			if (!isNaN(parsed) && parsed >= FONT_SIZE_MIN && parsed <= FONT_SIZE_MAX) return parsed;
		}
		return FONT_SIZE_DEFAULT;
	});
	const [windowSize, setWindowSizeState] = useState<WindowSize>(
		() => (loadString("abicus-window-size") as WindowSize) || "medium",
	);
	const [decimalSeparator, setDecimalSeparatorState] = useState<DecimalSeparator>(
		() => (loadString("abicus-decimal-separator") as DecimalSeparator) || ",",
	);

	const [showSettings, setShowSettings] = useState(false);
	const [terminalHistory, setTerminalHistory] = useState<{ expression: string; result: string; timestamp: number }[]>(
		() => loadJSON<{ expression: string; result: string; timestamp: number }[]>("abicus-terminal-history", []),
	);
	const [sharedHistory, setSharedHistory] = useState<{ expression: string; result: string; timestamp: number }[]>(() =>
		loadJSON<{ expression: string; result: string; timestamp: number }[]>("abicus-shared-history", []),
	);
	const [userFunctions, setUserFunctions] = useState<UserFunctionsMap>(
		() => new Map(loadJSON<[string, UserFunction][]>("abicus-user-functions", [])),
	);
	const [userConstants, setUserConstants] = useState<UserConstantsMap>(
		() => new Map(loadJSON<[string, UserConstant][]>("abicus-user-constants", [])),
	);
	const buffer = useBuffer();
	const memory = useMemory();

	useEffect(() => saveJSON("abicus-user-functions", Array.from(userFunctions.entries())), [userFunctions]);
	useEffect(() => saveJSON("abicus-user-constants", Array.from(userConstants.entries())), [userConstants]);
	useEffect(() => saveJSON("abicus-terminal-history", terminalHistory), [terminalHistory]);
	useEffect(() => saveJSON("abicus-shared-history", sharedHistory), [sharedHistory]);

	// Apply dark mode class to document
	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [isDarkMode]);

	// Listen for OS color scheme changes (only if no saved preference exists)
	useEffect(() => {
		if (typeof window === "undefined") return;
		if (loadString("abicus-dark-mode") !== null) return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			setIsDarkMode(e.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []); // Run once on mount

	// Apply font size via CSS custom property (unitless for CSS calc to work)
	useEffect(() => {
		document.documentElement.style.setProperty("--app-font-size", String(fontSize));
		document.documentElement.setAttribute("data-font-size", String(fontSize));
	}, [fontSize]);

	// Apply window size - via Tauri API for desktop, CSS variable for browser
	useEffect(() => {
		// Always set the data attribute for CSS
		document.documentElement.setAttribute("data-window-size", windowSize);

		// Also apply via Tauri API for desktop app
		const applyTauriWindowSize = async () => {
			if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;

			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				const { LogicalSize } = await import("@tauri-apps/api/dpi");
				const currentWindow = getCurrentWindow();

				const windowSizeMap: Record<WindowSize, { width: number; height: number }> = {
					small: { width: 340, height: 520 },
					medium: { width: 420, height: 620 },
					large: { width: 520, height: 760 },
				};

				const size = windowSizeMap[windowSize];
				await currentWindow.setSize(new LogicalSize(size.width, size.height));
			} catch {
				// Ignore errors if Tauri API is not available
			}
		};

		applyTauriWindowSize();
	}, [windowSize]);

	function clearAll() {
		buffer.empty();
		memory.empty();
		clearSharedHistory();
		clearFunctions();
		clearConstants();
	}

	function pushTerminalHistory(item: { expression: string; result: string; timestamp: number }) {
		setTerminalHistory(prev => [...prev, item]);
	}

	function clearTerminalHistory() {
		setTerminalHistory([]);
		removeKey("abicus-terminal-history");
	}

	function pushSharedHistory(item: { expression: string; result: string; timestamp: number }) {
		setSharedHistory(prev => [...prev, item]);
		// Also update terminal history for backward compatibility
		setTerminalHistory(prev => [...prev, item]);
	}

	function clearSharedHistory() {
		setSharedHistory([]);
		setTerminalHistory([]);
		removeKey("abicus-shared-history");
		removeKey("abicus-terminal-history");
	}

	function defineFunction(func: UserFunction) {
		setUserFunctions(prev => {
			const newMap = new Map(prev);
			newMap.set(func.name, func);
			return newMap;
		});
	}

	function removeFunction(name: string) {
		setUserFunctions(prev => {
			const newMap = new Map(prev);
			newMap.delete(name);
			return newMap;
		});
	}

	function clearFunctions() {
		setUserFunctions(new Map());
	}

	function tryDefineFunction(expression: string): UserFunction | null {
		const func = parseFunctionDefinition(expression);
		if (func) {
			defineFunction(func);
		}
		return func;
	}

	function defineConstant(constant: UserConstant) {
		setUserConstants(prev => {
			const newMap = new Map(prev);
			newMap.set(constant.name, constant);
			return newMap;
		});
	}

	function removeConstant(name: string) {
		setUserConstants(prev => {
			const newMap = new Map(prev);
			newMap.delete(name);
			return newMap;
		});
	}

	function clearConstants() {
		setUserConstants(new Map());
	}

	function tryDefineConstant(expression: string): UserConstant | null {
		const constant = parseConstantDefinition(expression);
		if (constant) {
			defineConstant(constant);
		}
		return constant;
	}

	function setLanguage(value: Language) {
		setLanguageState(value);
		saveString("abicus-language", value);
	}

	function crunch(saveToInd = false) {
		buffer.clean(decimalSeparator);

		const result = calculate(buffer.value, memory.ans, memory.ind, angleUnit, userFunctions, userConstants);
		if (result.isErr()) {
			buffer.setErr(true);
			return;
		}

		const { value } = result;

		memory.setAns(value);
		if (saveToInd) memory.setInd(value);

		// Add to shared history when in pocket mode
		if (interfaceMode === "pocket" && buffer.value.trim()) {
			const resultString = "= " + formatResult(value, decimalSeparator);
			pushSharedHistory({
				expression: buffer.value,
				result: resultString,
				timestamp: Date.now(),
			});
		}

		return value;
	}

	return (
		<CalculatorContextObject.Provider
			value={{
				buffer,
				memory,
				clearAll,
				sharedHistory,
				pushSharedHistory,
				clearSharedHistory,
				terminalHistory,
				pushTerminalHistory,
				clearTerminalHistory,
				userFunctions,
				defineFunction,
				removeFunction,
				clearFunctions,
				tryDefineFunction,
				userConstants,
				defineConstant,
				removeConstant,
				clearConstants,
				tryDefineConstant,

				angleUnit,
				radsOn() {
					buffer.makeDirty();
					setAngleUnit("rad");
					saveString("abicus-angle-unit", "rad");
				},
				degsOn() {
					buffer.makeDirty();
					setAngleUnit("deg");
					saveString("abicus-angle-unit", "deg");
				},

				interfaceMode,
				setInterfaceMode(mode: InterfaceMode) {
					setInterfaceModeState(mode);
					saveString("abicus-interface-mode", mode);
				},

				isDarkMode,
				setDarkMode: (value: boolean) => {
					setIsDarkMode(value);
					saveJSON("abicus-dark-mode", value);
				},

				fontSize,
				setFontSize: (size: FontSize) => {
					const clampedSize = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, size));
					setFontSizeState(clampedSize);
					saveString("abicus-font-size", String(clampedSize));
				},

				windowSize,
				setWindowSize: (size: WindowSize) => {
					setWindowSizeState(size);
					saveString("abicus-window-size", size);
				},

				decimalSeparator,
				setDecimalSeparator: (separator: DecimalSeparator) => {
					setDecimalSeparatorState(separator);
					saveString("abicus-decimal-separator", separator);
				},

				language,
				setLanguage,
				crunch,

				showSettings,
				openSettings() {
					setShowSettings(true);
				},
				closeSettings() {
					setShowSettings(false);
				},
			}}
		>
			{children}
		</CalculatorContextObject.Provider>
	);
}
