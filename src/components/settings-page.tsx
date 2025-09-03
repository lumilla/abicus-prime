import { useCalculator } from "#/state";
import { useState } from "react";

const APP_VERSION = "1.0.6"; // TODO: Get this from package.json dynamically

export default function SettingsPage() {
	const { angleUnit, degsOn, radsOn, clearAll, closeSettings } = useCalculator();
	const [interfaceMode, setInterfaceMode] = useState<"pocket" | "terminal">("pocket");

	return (
		<div
			x={[
				"w-96",
				"h-[456px]",
				"bg-white",
				"rounded-md",
				"border border-abi-dgrey",
				"flex flex-col",
			]}
		>
			{/* Header */}
			<div
				x={[
					"flex items-center justify-between",
					"p-4",
					"border-b border-abi-lgrey",
				]}
			>
				<h2 x={["text-lg font-semibold"]}>Settings</h2>
				<button
					onClick={closeSettings}
					x={[
						"text-abi-dgrey hover:text-black",
						"transition-colors",
						"text-2xl",
						"w-8 h-8",
						"flex items-center justify-center",
					]}
				>
					×
				</button>
			</div>

			{/* Content */}
			<div x={["flex-1", "p-4", "space-y-4"]}>
				{/* Angle Unit Toggle */}
				<div>
					<h3 x={["text-sm font-medium text-black mb-2"]}>Angle Unit</h3>
					<div
						x={[
							"flex",
							"border border-abi-dgrey",
							"divide-x divide-abi-dgrey",
							"rounded-md overflow-hidden",
							"w-full",
						]}
					>
						<button
							onClick={radsOn}
							disabled={angleUnit === "rad"}
							x={[
								"flex-1 px-4 py-2",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								angleUnit === "rad" ? "bg-abi-lgrey text-black" : "bg-white text-abi-dgrey hover:text-black",
							]}
						>
							Radians
						</button>
						<button
							onClick={degsOn}
							disabled={angleUnit === "deg"}
							x={[
								"flex-1 px-4 py-2",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								angleUnit === "deg" ? "bg-abi-lgrey text-black" : "bg-white text-abi-dgrey hover:text-black",
							]}
						>
							Degrees
						</button>
					</div>
				</div>

				{/* Interface ModeS Toggle */}
				<div>
					<h3 x={["text-sm font-medium text-black mb-2"]}>Interface Mode</h3>
					<div
						x={[
							"flex",
							"border border-abi-dgrey",
							"divide-x divide-abi-dgrey",
							"rounded-md overflow-hidden",
							"w-full",
						]}
					>
						<button
							onClick={() => setInterfaceMode("pocket")}
							disabled={interfaceMode === "pocket"}
							x={[
								"flex-1 px-4 py-2",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								interfaceMode === "pocket" ? "bg-abi-lgrey text-black" : "bg-white text-abi-dgrey hover:text-black",
							]}
						>
							Pocket
						</button>
						<button
							onClick={() => setInterfaceMode("terminal")}
							disabled={interfaceMode === "terminal"}
							x={[
								"flex-1 px-4 py-2",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								interfaceMode === "terminal" ? "bg-abi-lgrey text-black" : "bg-white text-abi-dgrey hover:text-black",
							]}
						>
							Terminal
						</button>
					</div>
				</div>

				{/* Clear Button */}
				<div>
					<button
						onClick={clearAll}
						x={[
							"w-full",
							"px-4 py-2",
							"bg-red-50",
							"text-red-600",
							"border border-red-200",
							"rounded-md",
							"text-sm",
							"hover:bg-red-100",
							"transition-colors",
						]}
					>
						Clear
					</button>
				</div>

				{/* Version Information */}
				<div x={["pt-2"]}>
					<p x={["text-sm text-abi-dgrey"]}>Abicus Calculator</p>
					<p x={["text-sm text-abi-dgrey"]}>v{APP_VERSION}</p>
				</div>
			</div>
		</div>
	);
}
