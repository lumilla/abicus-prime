import { useCalculator } from "#/state";
import { formatResult } from "#/utils/format-result";

export default function Result() {
	const { buffer, memory, decimalSeparator } = useCalculator();

	// Show output when there's no error, buffer is clean, and buffer has content
	const shouldShowOutput = !buffer.isErr && !buffer.isDirty && buffer.value.trim() !== "";
	const formattedOutput = formatResult(memory.ans, decimalSeparator);

	return (
		<div
			x={[
				"absolute bottom-0",
				"w-full",
				"flex items-center justify-between",
				"transition-all",
				"px-4 py-1",
				"bg-slate-100 dark:bg-slate-700",
				shouldShowOutput ? "translate-y-0" : "translate-y-full",
			]}
		>
			<span x="pointer-events-none text-slate-500 dark:text-slate-400">{"="}</span>
			{shouldShowOutput && (
				<output role="status" aria-live="polite" className="text-black dark:text-white">
					{formattedOutput}
				</output>
			)}
		</div>
	);
}
