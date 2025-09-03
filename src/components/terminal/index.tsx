import { useCalculator } from "#/state";
import { formatResult } from "#/utils/format-result";
import { useState, useEffect, useRef } from "react";
import { calculate } from "#/calculator";

type HistoryItem = {
	expression: string;
	result: string;
	timestamp: number;
};

export default function Terminal() {
	const { memory, angleUnit, terminalHistory, pushTerminalHistory, clearTerminalHistory } = useCalculator();
	const history = terminalHistory as HistoryItem[];
	const [currentInput, setCurrentInput] = useState("");
	const terminalRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const prevAnsRef = useRef<import("decimal.js").default | null>(null);
	const prevIndRef = useRef<import("decimal.js").default | null>(null);

	// Auto-focus the input
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

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
				clearTerminalHistory();
			}
		}

		// Update previous refs for next render
		prevAnsRef.current = memory.ans;
		prevIndRef.current = memory.ind;
	}, [memory.ans, memory.ind, history.length, clearTerminalHistory]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentInput.trim()) return;

		// Calculate directly without using the shared buffer
		const calculationResult = calculate(currentInput, memory.ans, memory.ind, angleUnit);
		
		let resultString: string;
		if (calculationResult.isOk()) {
			const result = calculationResult.value;
			resultString = formatResult(result);
			// Update the answer memory
			memory.setAns(result);
		} else {
			resultString = "Error";
		}
		
		pushTerminalHistory({
			expression: currentInput,
			result: resultString,
			timestamp: Date.now(),
		});

		setCurrentInput("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			setCurrentInput("");
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
				<div x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>Abicus Terminal v1.0.6</div>
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
							<span>{item.expression}</span>
						</div>
						<div x={["ml-4", "text-abi-dgrey dark:text-abi-dark-dgrey"]}>
							{item.result}
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
						ref={inputRef}
						type="text"
						value={currentInput}
						onChange={(e) => setCurrentInput(e.target.value)}
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
