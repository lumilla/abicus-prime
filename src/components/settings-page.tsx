import { useCalculator } from "#/state";

const APP_VERSION = __APP_VERSION__;

export default function SettingsPage() {
	const { angleUnit, degsOn, radsOn, interfaceMode, setInterfaceMode, isDarkMode, setDarkMode, clearAll, clearTerminalHistory, closeSettings } = useCalculator();

	return (
		<div
			x={[
				"w-96",
				"h-[456px]",
				"bg-white dark:bg-gray-800",
				"rounded-md",
				"border border-abi-dgrey dark:border-abi-dark-dgrey",
				"flex flex-col",
			]}
		>
			{/* Header */}
			<div
				x={[
					"flex items-center justify-between",
					"p-4",
					"border-b border-abi-lgrey dark:border-abi-dark-lgrey",
				]}
			>
				<h2 x={["text-lg font-semibold text-black dark:text-white"]}>Settings</h2>
				<button
					onClick={closeSettings}
					x={[
						"text-abi-dgrey hover:text-black dark:text-abi-dark-dgrey dark:hover:text-white",
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
					<h3 x={["text-sm font-medium text-black dark:text-white mb-2"]}>Angle Unit</h3>
					<div
						x={[
							"flex",
							"border border-abi-dgrey dark:border-abi-dark-dgrey",
							"divide-x divide-abi-dgrey dark:divide-abi-dark-dgrey",
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
								angleUnit === "rad" ? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white" : "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
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
								angleUnit === "deg" ? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white" : "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
							]}
						>
							Degrees
						</button>
					</div>
				</div>

				{/* Interface Mode Toggle */}
				<div>
					<h3 x={["text-sm font-medium text-black dark:text-white mb-2"]}>Interface Mode</h3>
					<div
						x={[
							"flex",
							"border border-abi-dgrey dark:border-abi-dark-dgrey",
							"divide-x divide-abi-dgrey dark:divide-abi-dark-dgrey",
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
								interfaceMode === "pocket" ? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white" : "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
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
								interfaceMode === "terminal" ? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white" : "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
							]}
						>
							Terminal
						</button>
					</div>
				</div>

				{/* Dark Mode Toggle */}
				<div>
					<h3 x={["text-sm font-medium text-black dark:text-white mb-2"]}>Theme</h3>
					<div
						x={[
							"flex",
							"border border-abi-dgrey dark:border-abi-dark-dgrey",
							"divide-x divide-abi-dgrey dark:divide-abi-dark-dgrey",
							"rounded-md overflow-hidden",
							"w-full",
						]}
					>
						<button
							onClick={() => setDarkMode(false)}
							disabled={!isDarkMode}
							x={[
								"flex-1 px-4 py-2",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								!isDarkMode ? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white" : "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
							]}
						>
							Light
						</button>
						<button
							onClick={() => setDarkMode(true)}
							disabled={isDarkMode}
							x={[
								"flex-1 px-4 py-2",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								isDarkMode ? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white" : "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
							]}
						>
							Dark
						</button>
					</div>
				</div>

				{/* Clear Button */}
				<div>
					<button
						onClick={() => { clearAll(); clearTerminalHistory(); }}
						x={[
							"w-full",
							"px-4 py-2",
							"bg-red-50 dark:bg-red-900",
							"text-red-600 dark:text-red-300",
							"border border-red-200 dark:border-red-700",
							"rounded-md",
							"text-sm",
							"hover:bg-red-100 dark:hover:bg-red-800",
							"transition-colors",
						]}
					>
						Clear
					</button>
				</div>

				{/* Version Information */}
				<div x={["pt-2"]}>
					<p x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>Abicus Prime Calculator</p>
					<p x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>v{APP_VERSION}</p>
				</div>
			</div>
		</div>
	);
}
