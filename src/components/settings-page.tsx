import { useCalculator } from "#/state";
import { useTranslation, supportedLanguages, LanguageCode } from "#/i18n";
import { useState, useEffect, useRef } from "preact/hooks";

const APP_VERSION = __APP_VERSION__;

export default function SettingsPage() {
	const {
		angleUnit,
		degsOn,
		radsOn,
		interfaceMode,
		setInterfaceMode,
		isDarkMode,
		setDarkMode,
		clearAll,
		clearTerminalHistory,
		closeSettings,
		buffer,
		sharedHistory,
	} = useCalculator();
	const { t, currentLanguage, setLanguage } = useTranslation();
	const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsLanguageDropdownOpen(false);
			}
		}

		if (isLanguageDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isLanguageDropdownOpen]);

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
			<div x={["flex items-center justify-between", "p-3", "border-b border-abi-lgrey dark:border-abi-dark-lgrey"]}>
				<h2 x={["text-base font-semibold text-black dark:text-white"]}>{t("settings.title")}</h2>
				<button
					onClick={closeSettings}
					x={[
						"text-abi-dgrey hover:text-black dark:text-abi-dark-dgrey dark:hover:text-white",
						"transition-colors",
						"text-xl",
						"w-7 h-7",
						"flex items-center justify-center",
					]}
				>
					×
				</button>
			</div>

			{/* Content */}
			<div x={["flex-1", "p-3", "space-y-3"]}>
				{/* Language Selection - Dropdown */}
				<div>
					<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.language")}</h3>
					<div x={["relative"]} ref={dropdownRef}>
						<button
							onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
							x={[
								"w-full px-3 py-1.5",
								"bg-white dark:bg-gray-800",
								"border border-abi-dgrey dark:border-abi-dark-dgrey",
								"rounded-md",
								"text-left",
								"text-sm text-black dark:text-white",
								"hover:bg-gray-50 dark:hover:bg-gray-700",
								"transition-colors",
								"flex items-center justify-between",
							]}
						>
							<span>{
								(() => {
									const entry = supportedLanguages[currentLanguage];
									return entry ? t(entry.name) : currentLanguage;
								})()
							}</span>
							<span
								x={[
									"text-abi-dgrey dark:text-abi-dark-dgrey transition-transform",
									isLanguageDropdownOpen ? "rotate-180" : "",
								]}
							>
								▼
							</span>
						</button>

						{isLanguageDropdownOpen && (
							<div
								x={[
									"absolute top-full left-0 right-0 mt-1",
									"bg-white dark:bg-gray-800",
									"border border-abi-dgrey dark:border-abi-dark-dgrey",
									"rounded-md",
									"shadow-lg",
									"z-10",
								]}
							>
								{Object.entries(supportedLanguages).map(([code, { name }]) => (
									<button
										key={code}
										onClick={() => {
											setLanguage(code as LanguageCode);
											setIsLanguageDropdownOpen(false);
										}}
										x={[
											"w-full px-3 py-1.5",
											"text-left text-sm",
											"hover:bg-gray-50 dark:hover:bg-gray-700",
											"transition-colors",
											"first:rounded-t-md last:rounded-b-md",
											currentLanguage === code
												? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white font-medium"
												: "text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
										]}
									>
										{t(name)}
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Angle Unit & Interface Mode */}
				<div x={["space-y-3"]}>
					{/* Angle Unit Toggle */}
					<div>
						<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.angleUnit")}</h3>
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
									"flex-1 px-3 py-1.5",
									"text-sm",
									"transition-all",
									"disabled:cursor-default",
									angleUnit === "rad"
										? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
										: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
								]}
							>
								{t("settings.radians")}
							</button>
							<button
								onClick={degsOn}
								disabled={angleUnit === "deg"}
								x={[
									"flex-1 px-3 py-1.5",
									"text-sm",
									"transition-all",
									"disabled:cursor-default",
									angleUnit === "deg"
										? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
										: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
								]}
							>
								{t("settings.degrees")}
							</button>
						</div>
					</div>

					{/* Interface Mode Toggle */}
					<div>
						<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.interfaceMode")}</h3>
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
								onClick={() => {
									setInterfaceMode("pocket");
									// Set buffer to last expression when switching to pocket mode
									if (sharedHistory.length > 0) {
										const lastExpression = sharedHistory[sharedHistory.length - 1]?.expression;
										if (lastExpression) {
											buffer.set(lastExpression);
											buffer.clean(); // Mark as clean so result shows
										}
									}
								}}
								disabled={interfaceMode === "pocket"}
								x={[
									"flex-1 px-3 py-1.5",
									"text-sm",
									"transition-all",
									"disabled:cursor-default",
									interfaceMode === "pocket"
										? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
										: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
								]}
							>
								{t("settings.pocket")}
							</button>
							<button
								onClick={() => setInterfaceMode("terminal")}
								disabled={interfaceMode === "terminal"}
								x={[
									"flex-1 px-3 py-1.5",
									"text-sm",
									"transition-all",
									"disabled:cursor-default",
									interfaceMode === "terminal"
										? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
										: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
								]}
							>
								{t("settings.terminal")}
							</button>
						</div>
					</div>
				</div>

				{/* Theme Selection */}
				<div>
					<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.theme")}</h3>
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
								"flex-1 px-3 py-1.5",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								!isDarkMode
									? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
									: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
							]}
						>
							{t("settings.light")}
						</button>
						<button
							onClick={() => setDarkMode(true)}
							disabled={isDarkMode}
							x={[
								"flex-1 px-3 py-1.5",
								"text-sm",
								"transition-all",
								"disabled:cursor-default",
								isDarkMode
									? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
									: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
							]}
						>
							{t("settings.dark")}
						</button>
					</div>
				</div>

				{/* Clear Button */}
				<div>
					<button
						onClick={() => {
							clearAll();
							clearTerminalHistory();
						}}
						x={[
							"w-full",
							"px-3 py-1.5",
							"bg-red-50 dark:bg-red-900",
							"text-red-600 dark:text-red-300",
							"border border-red-200 dark:border-red-700",
							"rounded-md",
							"text-sm",
							"hover:bg-red-100 dark:hover:bg-red-800",
							"transition-colors",
						]}
					>
						{t("settings.clear")}
					</button>
				</div>

				{/* Version Information */}
				<div x={["pt-1.5", "border-t border-abi-lgrey dark:border-abi-dark-lgrey"]}>
					<p x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>{t("settings.version")}</p>
					<p x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>v{APP_VERSION}</p>
				</div>
			</div>
		</div>
	);
}
