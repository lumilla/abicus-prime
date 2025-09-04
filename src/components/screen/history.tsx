import { useCalculator } from "#/state";

export default function History() {
	const { sharedHistory } = useCalculator();

	// Only show the latest item in pocket mode
	const latestHistory = sharedHistory.length > 0 ? sharedHistory[sharedHistory.length - 1] : null;

	if (!latestHistory) {
		return null;
	}

	return (
		<div
			x={[
				"absolute",
				"top-2 left-4 right-4",
				"text-xs",
				"text-slate-400 dark:text-slate-500",
				"pointer-events-none", // Don't interfere with input focus
			]}
		>
			<div x={["flex justify-between"]}>
				<span>{latestHistory.expression}</span>
				<span>{latestHistory.result}</span>
			</div>
		</div>
	);
}
