import Decimal from "decimal.js";
import { createContext, ComponentChildren } from "preact";
import { useContext, useState, useEffect } from "preact/hooks";
import { AngleUnit, calculate } from "#/calculator";
import { formatResult } from "#/utils/format-result";

import useBuffer, { BufferHandle } from "./internal-buffer";
import useMemory, { MemoryHandle } from "./internal-memory";
import { UserFunction, UserFunctionsMap, parseFunctionDefinition } from "./user-functions";

type InterfaceMode = "pocket" | "terminal";
type Language = "fi" | "sv" | "en";

export type TerminalHistoryItem = { expression: string; result: string; timestamp: number };
export type { UserFunction } from "./user-functions";

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
	const [angleUnit, setAngleUnit] = useState<AngleUnit>(() => {
		if (typeof window === "undefined") return "deg";
		const saved = localStorage.getItem("abicus-angle-unit");
		return (saved as AngleUnit) || "deg";
	});
	const [interfaceMode, setInterfaceModeState] = useState<InterfaceMode>(() => {
		if (typeof window === "undefined") return "pocket";
		const saved = localStorage.getItem("abicus-interface-mode");
		return (saved as InterfaceMode) || "pocket";
	});

	// Initialize language with saved preference or default to Finnish
	const [language, setLanguageState] = useState<Language>(() => {
		if (typeof window === "undefined") return "fi";
		const saved = localStorage.getItem("abicus-language");
		return (saved as Language) || "fi";
	});

	// Initialize dark mode with OS preference or saved preference
	const [isDarkMode, setIsDarkMode] = useState(() => {
		if (typeof window === "undefined") return false;

		const saved = localStorage.getItem("abicus-dark-mode");
		if (saved !== null) {
			return JSON.parse(saved);
		}

		// Use OS preference if no saved preference
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
	});

	const [showSettings, setShowSettings] = useState(false);
	const [terminalHistory, setTerminalHistory] = useState<{ expression: string; result: string; timestamp: number }[]>(
		[],
	);
	const [sharedHistory, setSharedHistory] = useState<{ expression: string; result: string; timestamp: number }[]>([]);
	const [userFunctions, setUserFunctions] = useState<UserFunctionsMap>(() => {
		if (typeof window === "undefined") return new Map();
		try {
			const saved = localStorage.getItem("abicus-user-functions");
			if (saved) {
				const parsed = JSON.parse(saved) as [string, UserFunction][];
				return new Map(parsed);
			}
		} catch {
			// Ignore parse errors
		}
		return new Map();
	});
	const buffer = useBuffer();
	const memory = useMemory();

	// Persist user functions to localStorage
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const entries = Array.from(userFunctions.entries());
			localStorage.setItem("abicus-user-functions", JSON.stringify(entries));
		} catch {
			// Ignore storage errors
		}
	}, [userFunctions]);

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

		const savedPreference = localStorage.getItem("abicus-dark-mode");
		if (savedPreference !== null) return; // Don't listen if user has saved preference

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			setIsDarkMode(e.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []); // Run once on mount

	function clearAll() {
		buffer.empty();
		memory.empty();
		clearSharedHistory();
		clearFunctions();
	}

	function pushTerminalHistory(item: { expression: string; result: string; timestamp: number }) {
		setTerminalHistory(prev => [...prev, item]);
	}

	function clearTerminalHistory() {
		setTerminalHistory([]);
	}

	function pushSharedHistory(item: { expression: string; result: string; timestamp: number }) {
		setSharedHistory(prev => [...prev, item]);
		// Also update terminal history for backward compatibility
		setTerminalHistory(prev => [...prev, item]);
	}

	function clearSharedHistory() {
		setSharedHistory([]);
		setTerminalHistory([]);
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

	function setLanguage(value: Language) {
		setLanguageState(value);
		localStorage.setItem("abicus-language", value);
	}

	function crunch(saveToInd = false) {
		buffer.clean();

		const result = calculate(buffer.value, memory.ans, memory.ind, angleUnit, userFunctions);
		if (result.isErr()) {
			buffer.setErr(true);
			return;
		}

		const { value } = result;

		memory.setAns(value);
		if (saveToInd) memory.setInd(value);

		// Add to shared history when in pocket mode
		if (interfaceMode === "pocket" && buffer.value.trim()) {
			const resultString = "= " + formatResult(value);
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
				crunch,

				angleUnit,
				radsOn() {
					buffer.makeDirty();
					setAngleUnit("rad");
					localStorage.setItem("abicus-angle-unit", "rad");
				},
				degsOn() {
					buffer.makeDirty();
					setAngleUnit("deg");
					localStorage.setItem("abicus-angle-unit", "deg");
				},

				interfaceMode,
				setInterfaceMode(mode: InterfaceMode) {
					setInterfaceModeState(mode);
					localStorage.setItem("abicus-interface-mode", mode);
				},

				isDarkMode,
				setDarkMode: (value: boolean) => {
					setIsDarkMode(value);
					// Save preference to localStorage when manually set
					localStorage.setItem("abicus-dark-mode", JSON.stringify(value));
				},

				language,
				setLanguage,

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
