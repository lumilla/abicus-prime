import Decimal from "decimal.js";
import { createContext, PropsWithChildren, useContext, useState, useEffect } from "react";
import { AngleUnit, calculate } from "#/calculator";

import useBuffer, { BufferHandle } from "./internal-buffer";
import useMemory, { MemoryHandle } from "./internal-memory";

type InterfaceMode = "pocket" | "terminal";

export type TerminalHistoryItem = { expression: string; result: string; timestamp: number };

type CalculatorContext = {
	/** Handle to the calculator's input buffer */
	buffer: BufferHandle;
	/** Handle to the calculator's memory registers */
	memory: MemoryHandle;

	/** Clear the input buffer and all memory registers */
	clearAll(): void;
	/** Terminal history persisted across mounts */
	terminalHistory: TerminalHistoryItem[];
	/** Push an item into terminal history */
	pushTerminalHistory(item: TerminalHistoryItem): void;
	/** Clear terminal history */
	clearTerminalHistory(): void;

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

export default function CalculatorProvider({ children }: PropsWithChildren) {
	const [angleUnit, setAngleUnit] = useState<AngleUnit>("deg");
	const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>("pocket");
	
	// Initialize dark mode with OS preference or saved preference
	const [isDarkMode, setIsDarkMode] = useState(() => {
		if (typeof window === 'undefined') return false;
		
		const saved = localStorage.getItem('abicus-dark-mode');
		if (saved !== null) {
			return JSON.parse(saved);
		}
		
		// Use OS preference if no saved preference
		return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
	});
	
	const [showSettings, setShowSettings] = useState(false);
	const [terminalHistory, setTerminalHistory] = useState<{ expression: string; result: string; timestamp: number }[]>([]);
	const buffer = useBuffer();
	const memory = useMemory();

	// Apply dark mode class to document
	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [isDarkMode]);

	// Listen for OS color scheme changes (only if no saved preference exists)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		
		const savedPreference = localStorage.getItem('abicus-dark-mode');
		if (savedPreference !== null) return; // Don't listen if user has saved preference
		
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			setIsDarkMode(e.matches);
		};
		
		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []); // Run once on mount

	function clearAll() {
		buffer.empty();
		memory.empty();
	}

	function pushTerminalHistory(item: { expression: string; result: string; timestamp: number }) {
		setTerminalHistory(prev => [...prev, item]);
	}

	function clearTerminalHistory() {
		setTerminalHistory([]);
	}

	function crunch(saveToInd = false) {
		buffer.clean();

		const result = calculate(buffer.value, memory.ans, memory.ind, angleUnit);
		if (result.isErr()) {
			buffer.setErr(true);
			return;
		}

		const { value } = result;

		memory.setAns(value);
		if (saveToInd) memory.setInd(value);

		return value;
	}

	return (
		<CalculatorContextObject.Provider
			value={{
				buffer,
				memory,
				clearAll,
				terminalHistory,
				pushTerminalHistory,
				clearTerminalHistory,
				crunch,

				angleUnit,
				radsOn() {
					buffer.makeDirty();
					setAngleUnit("rad");
				},
				degsOn() {
					buffer.makeDirty();
					setAngleUnit("deg");
				},

				interfaceMode,
				setInterfaceMode,

				isDarkMode,
				setDarkMode: (value: boolean) => {
					setIsDarkMode(value);
					// Save preference to localStorage when manually set
					localStorage.setItem('abicus-dark-mode', JSON.stringify(value));
				},

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
