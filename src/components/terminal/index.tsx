import { useCalculator } from "#/state";
import { formatResult } from "#/utils/format-result";
import { useState, useEffect, useRef } from "react";
import { calculate } from "#/calculator";

const APP_VERSION = __APP_VERSION__;

type HistoryItem = {
	expression: string;
	result: string;
	timestamp: number;
};

export default function Terminal() {
	const { memory, angleUnit, buffer, sharedHistory, pushSharedHistory, clearSharedHistory } = useCalculator();
	const history = sharedHistory as HistoryItem[];
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [tempInput, setTempInput] = useState("");
	const terminalRef = useRef<HTMLDivElement>(null);
	const prevAnsRef = useRef<import("decimal.js").default | null>(null);
	const prevIndRef = useRef<import("decimal.js").default | null>(null);

	// Auto-focus the input
	useEffect(() => {
		if (buffer.ref.current) {
			buffer.ref.current.focus();
		}
	}, [buffer.ref]);

	// Auto-scroll to bottom when history changes
	useEffect(() => {
		if (terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
		}
	}, [history]);

	// Clear history when memory is cleared (indicating a clearAll was called)
	useEffect(() => {
		// Only clear history when memory transitions from a non-zero value to zero.
		// This avoids clearing history on initial render (both memories start at zero)
		// or when calculations leave the memory unchanged (e.g. invalid input).
		const prevAns = prevAnsRef.current;
		const prevInd = prevIndRef.current;

		const ansIsZero = memory.ans?.isZero();
		const indIsZero = memory.ind?.isZero();

		if ((prevAns && !prevAns.isZero() || prevInd && !prevInd.isZero()) && ansIsZero && indIsZero) {
			// Real clear detected
			if (history.length > 0) {
				clearSharedHistory();
			}
		}

		// Update previous refs for next render
		prevAnsRef.current = memory.ans;
		prevIndRef.current = memory.ind;
	}, [memory.ans, memory.ind, history.length, clearSharedHistory]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!buffer.value.trim()) return;

		// Handle special commands
		const trimmedInput = buffer.value.trim().toLowerCase();
		
		if (trimmedInput === "clear" || trimmedInput === "cls") {
			clearSharedHistory();
			buffer.empty();
			setHistoryIndex(-1);
			setTempInput("");
			return;
		}
		


		// Calculate directly without using the shared buffer
		const calculationResult = calculate(buffer.value, memory.ans, memory.ind, angleUnit);
		
		let resultString: string;
		if (calculationResult.isOk()) {
			const result = calculationResult.value;
			resultString = "= " + formatResult(result);
			// Update the answer memory
			memory.setAns(result);
		} else {
			resultString = "Error";
		}
		
		pushSharedHistory({
			expression: buffer.value,
			result: resultString,
			timestamp: Date.now(),
		});

		buffer.empty();
		setHistoryIndex(-1);
		setTempInput("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			buffer.empty();
			setHistoryIndex(-1);
			setTempInput("");
		}
		// Arrow up/down to navigate through history
		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (history.length > 0) {
				if (historyIndex === -1) {
					// Save current input before starting history navigation
					setTempInput(buffer.value);
					setHistoryIndex(history.length - 1);
					buffer.set(history[history.length - 1]?.expression || "");
				} else if (historyIndex > 0) {
					setHistoryIndex(historyIndex - 1);
					buffer.set(history[historyIndex - 1]?.expression || "");
				}
			}
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (historyIndex >= 0) {
				if (historyIndex < history.length - 1) {
					setHistoryIndex(historyIndex + 1);
					buffer.set(history[historyIndex + 1]?.expression || "");
				} else {
					// Back to original input
					setHistoryIndex(-1);
					buffer.set(tempInput);
					setTempInput("");
				}
			}
		}
		// Tab completion for commands
		if (e.key === "Tab") {
			e.preventDefault();
			const input = buffer.value.toLowerCase();
			if (input === "c" || input === "cl") {
				buffer.set("clear");
			}
		}
		// Ctrl+N to clear terminal history
		if (e.ctrlKey && e.key === "n") {
			e.preventDefault();
			clearSharedHistory();
		}
		// Ctrl+K to clear current input
		if (e.ctrlKey && e.key === "k") {
			e.preventDefault();
			buffer.empty();
			setHistoryIndex(-1);
			setTempInput("");
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		buffer.set(e.target.value);
		// Reset history navigation when user manually types
		setHistoryIndex(-1);
		setTempInput("");
	};

	const handleDoubleClickExpression = (expression: string) => {
		buffer.set(expression);
		setHistoryIndex(-1);
		setTempInput("");
		if (buffer.ref.current) {
			buffer.ref.current.focus();
		}
	};

	const handleDoubleClickResult = (result: string) => {
		// Remove the "= " prefix if it exists, and put the result in input
		const cleanResult = result.startsWith("= ") ? result.slice(2) : result;
		buffer.set(cleanResult);
		setHistoryIndex(-1);
		setTempInput("");
		if (buffer.ref.current) {
			buffer.ref.current.focus();
		}
	};

	return (
		<div
			x={[
				"w-96",
				"h-[456px]",
				"bg-white dark:bg-gray-800",
				"rounded-md",
				"border border-abi-dgrey dark:border-abi-dark-dgrey",
				"flex flex-col",
				"font-mono",
			]}
		>
			{/* Header */}
			<div
				x={[
					"px-4 py-2",
					"bg-gray-50 dark:bg-gray-700",
					"border-b border-abi-lgrey dark:border-abi-dark-lgrey",
					"rounded-t-md",
				]}
			>
				<div x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>Abicus Prime Terminal v{APP_VERSION}</div>
			</div>

			{/* Terminal Content */}
			<div
				ref={terminalRef}
				x={[
					"flex-1",
					"overflow-y-auto",
					"px-4 py-2",
					"text-sm",
					"space-y-1",
					"text-black dark:text-white",
				]}
			>
				{history.map((item) => (
					<div key={item.timestamp} x={["space-y-1"]}>
						<div x={["flex items-center"]}>
							<span x={["text-abi-dgrey dark:text-abi-dark-dgrey mr-2"]}>▶</span>
							<span 
								x={["cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 -mx-1 transition-colors"]}
								onDoubleClick={() => handleDoubleClickExpression(item.expression)}
							>
								{item.expression}
							</span>
						</div>
						<div x={["ml-3", "text-abi-dgrey dark:text-abi-dark-dgrey"]}>
							<span 
								x={["cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 -mx-1 transition-colors"]}
								onDoubleClick={() => handleDoubleClickResult(item.result)}
							>
								{item.result}
							</span>
						</div>
					</div>
				))}
			</div>

			{/* Input Area */}
			<form onSubmit={handleSubmit}>
				<div
					x={[
						"flex items-center",
						"px-4 py-3",
						"border-t border-abi-lgrey dark:border-abi-dark-lgrey",
						"bg-gray-50 dark:bg-gray-700",
						"rounded-b-md",
					]}
				>
					<span x={["text-abi-dgrey dark:text-abi-dark-dgrey mr-2"]}>▶</span>
					<input
						ref={buffer.ref}
						type="text"
						value={buffer.value}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Enter calculation..."
						x={[
							"flex-1",
							"bg-transparent",
							"outline-none",
							"text-sm",
							"text-black dark:text-white",
							"placeholder-abi-dgrey dark:placeholder-abi-dark-dgrey",
						]}
					/>
				</div>
			</form>
		</div>
	);
}
