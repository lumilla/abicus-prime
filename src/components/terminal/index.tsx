import { useCalculator } from "#/state";
import { formatResult } from "#/utils/format-result";
import { useState, useEffect, useRef } from "preact/hooks";
import { JSX } from "preact";
import { calculate } from "#/calculator";
import { useTranslation } from "#/i18n/hook";

const APP_VERSION = __APP_VERSION__;

type HistoryItem = {
	expression: string;
	result: string;
	timestamp: number;
};

export default function Terminal() {
	const { memory, angleUnit, buffer, sharedHistory, pushSharedHistory, clearSharedHistory } = useCalculator();
	const { t } = useTranslation();
	const history = sharedHistory as HistoryItem[];
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [tempInput, setTempInput] = useState("");
	const [previewResult, setPreviewResult] = useState<string | null>(null);
	// Make Tauri detection synchronous to avoid layout flicker
	const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
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

		if (((prevAns && !prevAns.isZero()) || (prevInd && !prevInd.isZero())) && ansIsZero && indIsZero) {
			// Real clear detected
			if (history.length > 0) {
				clearSharedHistory();
			}
		}

		// Update previous refs for next render
		prevAnsRef.current = memory.ans;
		prevIndRef.current = memory.ind;
	}, [memory.ans, memory.ind, history.length, clearSharedHistory]);

	// Compute live preview when buffer changes (debounced-ish via effect)
	useEffect(() => {
		if (!buffer.value.trim()) {
			setPreviewResult(null);
			return;
		}

		// Calculate preview safely without mutating memory
		const result = calculate(buffer.value, memory.ans, memory.ind, angleUnit);
		if (result.isOk()) {
			setPreviewResult("= " + formatResult(result.value));
		} else {
			setPreviewResult(t("terminal.error"));
		}
	}, [buffer.value, memory.ans, memory.ind, angleUnit, t]);

	const handleSubmit = (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
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
			resultString = t("terminal.error");
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

	const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
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

	const handleInputChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
		const target = e.target as HTMLInputElement;
		buffer.set(target.value);
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
			x={
				isTauri
					? ["w-full", "h-full", "bg-transparent", "flex flex-col", "font-mono"]
					: [
							"w-96",
							"h-[456px]",
							"bg-white dark:bg-gray-800",
							"rounded-md",
							"border border-abi-dgrey dark:border-abi-dark-dgrey",
							"flex flex-col",
							"font-mono",
						]
			}
		>
			{/* Header */}
			{!isTauri && (
				<div
					x={[
						"px-4 py-2",
						"bg-gray-50 dark:bg-gray-700",
						"border-b border-abi-lgrey dark:border-abi-dark-lgrey",
						"rounded-t-md",
					]}
				>
					<div x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>
						{t("terminal.title")} v{APP_VERSION}
					</div>
				</div>
			)}

			{/* Terminal Content */}
			<div
				ref={terminalRef}
				x={[
					"flex-1",
					"overflow-y-auto",
					...(isTauri ? ["px-6 py-2"] : ["px-4 py-2"]),
					"text-sm",
					"space-y-1",
					...(isTauri ? ["text-black dark:text-white"] : ["text-black dark:text-white"]),
				]}
			>
			{/* Live preview row */}
			{previewResult && (
				<div x={["mb-2 mx-1 px-2 py-1 rounded", isTauri ? "text-white/90" : "text-abi-dgrey"]}>
					<div x={["flex items-center gap-2"]}>
						<span x={["text-xs text-black/60 dark:text-white/80"]}>↳</span>
						<span x={["text-sm font-medium"]}>{previewResult}</span>
					</div>
				</div>
			)}
				{history.map(item => (
					<div key={item.timestamp} x={["space-y-1"]}>
						<div x={["flex items-center"]}>
							<span
								x={[
									"mr-2",
									...(isTauri ? ["text-black/60 dark:text-white/80"] : ["text-abi-dgrey dark:text-abi-dark-dgrey"]),
								]}
							>
								▶
							</span>
							<span
								x={["cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 -mx-1 transition-colors"]}
								onDblClick={() => handleDoubleClickExpression(item.expression)}
							>
								{item.expression}
							</span>
						</div>
						<div
							x={[
								"ml-3",
								...(isTauri ? ["text-black/50 dark:text-white/70"] : ["text-abi-dgrey dark:text-abi-dark-dgrey"]),
							]}
						>
							<span
								x={["cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 -mx-1 transition-colors"]}
								onDblClick={() => handleDoubleClickResult(item.result)}
							>
								{item.result}
							</span>
						</div>
					</div>
				))}
			</div>

			{/* Live preview - attached directly to input */}
			<div
				x={[
					"transition-opacity duration-700 ease-in-out",
					previewResult ? "opacity-100" : "opacity-0",
					"bg-blue-500/10 dark:bg-blue-400/10",
					"border-t border-b border-blue-400/40 dark:border-blue-300/30",
					"px-4 py-3",
					...(isTauri ? ["px-6"] : []),
				]}
			>
				<div x={["flex items-center gap-2"]}>
					<span
						x={[
							"text-blue-600 dark:text-blue-400",
							"font-mono text-sm",
						]}
					>
						=
					</span>
					<span
						x={[
							"text-blue-700 dark:text-blue-300",
							"font-mono text-sm font-medium",
						]}
					>
						{previewResult ? (previewResult.startsWith("= ") ? previewResult.slice(2) : previewResult) : ""}
					</span>
				</div>
			</div>			{/* Input Area */}
			<form onSubmit={handleSubmit}>
				<div
					x={[
						"flex items-center",
						...(isTauri
							? [
									"px-6 py-4",
									"bg-black/20 dark:bg-black/20 backdrop-blur-sm",
									"border-t border-black/10 dark:border-white/10",
									"rounded-b-2xl",
									"-mx-0 -mb-0",
								]
							: [
									"px-4 py-3",
									"border-t border-abi-lgrey dark:border-abi-dark-lgrey",
									"bg-gray-50 dark:bg-gray-700",
									"rounded-b-md",
								]),
					]}
				>
					<span
						x={[
							"mr-2",
							...(isTauri ? ["text-black dark:text-white font-medium"] : ["text-abi-dgrey dark:text-abi-dark-dgrey"]),
						]}
					>
						▶
					</span>
					{/* live preview is always enabled */}
					<input
						ref={buffer.ref}
						type="text"
						value={buffer.value}
						onInput={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder={t("terminal.placeholder")}
						x={[
							"flex-1",
							"bg-transparent",
							"outline-none",
							...(isTauri ? ["text-base"] : ["text-sm"]),
							...(isTauri
								? ["text-black dark:text-white font-medium", "placeholder-black/40 dark:placeholder-white/50"]
								: ["text-black dark:text-white", "placeholder-abi-dgrey dark:placeholder-abi-dark-dgrey"]),
						]}
					/>
				</div>
			</form>
		</div>
	);
}
