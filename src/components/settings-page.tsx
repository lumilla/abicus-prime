import { useCalculator } from "#/state";
import { useTranslation, supportedLanguages, LanguageCode } from "#/i18n";
import { useState, useEffect, useRef } from "preact/hooks";

const APP_VERSION = __APP_VERSION__;
const GIT_HASH = __GIT_HASH__;

// Font size limits (in points)
const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_STEP = 1;

// Window size options (Tauri only)
const WINDOW_SIZES = ["small", "medium", "large"] as const;

export default function SettingsPage() {
	const {
		angleUnit,
		degsOn,
		radsOn,
		interfaceMode,
		setInterfaceMode,
		isDarkMode,
		setDarkMode,
		fontSize,
		setFontSize,
		windowSize,
		setWindowSize,
		clearAll,
		clearTerminalHistory,
		clearFunctions,
		userFunctions,
		closeSettings,
		buffer,
		sharedHistory,
	} = useCalculator();
	const { t, currentLanguage, setLanguage } = useTranslation();
	const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	// Make Tauri detection synchronous for consistent styling
	const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

	// Crash test state (hidden, no visual indication)
	const [_crashTestClicks, setCrashTestClicks] = useState(0);
	const [lastClickTime, setLastClickTime] = useState(0);
	const [shouldCrash, setShouldCrash] = useState(false);

	// If crash test triggered, throw error to trigger error boundary
	if (shouldCrash) {
		throw new Error(t("error.usertriggerederror"));
	}

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

	// Hidden crash test handler (no visual indication)
	const handleVersionClick = (e: MouseEvent) => {
		// Check if shift key is pressed
		if (e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();

			const now = Date.now();
			const timeSinceLastClick = now - lastClickTime;

			// Reset counter if more than 5 seconds have passed
			if (timeSinceLastClick > 5000) {
				setCrashTestClicks(1);
			} else {
				setCrashTestClicks(prev => {
					const newCount = prev + 1;

					// Trigger crash on 25th click
					if (newCount >= 25) {
						// Trigger error boundary by setting state that causes component to throw
						setShouldCrash(true);
					}

					return newCount;
				});
			}

			setLastClickTime(now);
		}
	};

	return (
		<div
			className={!isTauri ? "window-animated" : undefined}
			x={
				isTauri
					? ["w-full", "h-full", "bg-transparent", "flex flex-col"]
					: [
							"bg-white dark:bg-gray-800",
							...(windowSize !== "large" ? ["rounded-md", "border border-abi-dgrey dark:border-abi-dark-dgrey"] : []),
							"flex flex-col",
						]
			}
			style={!isTauri ? { width: "var(--app-width)", height: "var(--app-height)" } : undefined}
		>
			{/* Header */}
			{!isTauri && (
				<div x={["flex items-center justify-between", "p-3", "border-b border-abi-lgrey dark:border-abi-dark-lgrey"]}>
					<h2 x={["text-base font-semibold text-+ dark:text-white"]}>{t("settings.title")}</h2>
					<button
						onClick={closeSettings}
						style={{ width: "calc(1.75rem * var(--font-scale))", height: "calc(1.75rem * var(--font-scale))", fontSize: "calc(1.25rem * var(--font-scale))" }}
						x={[
							"text-abi-dgrey hover:text-black dark:text-abi-dark-dgrey dark:hover:text-white",
							"transition-colors",
							"flex items-center justify-center",
						]}
					>
						×
					</button>
				</div>
			)}

			{/* Content */}
			<div x={["flex-1", "overflow-y-auto", "custom-scrollbar", ...(isTauri ? ["px-6 py-4"] : ["p-3"]), ...(isTauri ? ["text-white"] : []), ...(windowSize === "large" ? ["flex justify-center"] : [])]}>
				<div x={["space-y-3", "w-full"]} style={windowSize === "large" ? { maxWidth: "480px" } : undefined}>
					{/* Language Selection */}
					<div>
						<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.language")}</h3>
						<div x={["relative"]} ref={dropdownRef}>
							<button
								onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
								x={[
									"settings-btn",
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
								<span>
									{(() => {
										const entry = supportedLanguages[currentLanguage];
										return entry ? t(entry.name) : currentLanguage;
									})()}
								</span>
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
									"settings-btn",
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
									"settings-btn",
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
									"settings-btn",
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
									"settings-btn",
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
								"settings-btn",
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
								"settings-btn",
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

				{/* Font Size Selection */}
				<div>
					<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.fontSize")}</h3>
					<div
						x={[
							"flex items-center",
							"border border-abi-dgrey dark:border-abi-dark-dgrey",
							"rounded-md overflow-hidden",
							"w-full",
						]}
					>
						<button
							onClick={() => setFontSize(Math.max(FONT_SIZE_MIN, fontSize - FONT_SIZE_STEP))}
							disabled={fontSize <= FONT_SIZE_MIN}
							x={[
								"settings-btn",
								"px-4 py-1.5",
								"text-lg font-medium",
								"transition-all",
								"border-r border-abi-dgrey dark:border-abi-dark-dgrey",
								fontSize <= FONT_SIZE_MIN
									? "bg-white dark:bg-gray-800 text-abi-lgrey dark:text-abi-dark-lgrey cursor-not-allowed"
									: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700",
							]}
						>
							−
						</button>
						<div
							onWheel={(e) => {
								e.preventDefault();
								if (e.deltaY < 0) {
									setFontSize(Math.min(FONT_SIZE_MAX, fontSize + FONT_SIZE_STEP));
								} else if (e.deltaY > 0) {
									setFontSize(Math.max(FONT_SIZE_MIN, fontSize - FONT_SIZE_STEP));
								}
							}}
							x={[
								"flex-1",
								"text-center",
								"py-1.5",
								"text-sm",
								"bg-white dark:bg-gray-800",
								"text-black dark:text-white",
								"cursor-ns-resize",
								"select-none",
							]}
						>
							{fontSize} pt
						</div>
						<button
							onClick={() => setFontSize(Math.min(FONT_SIZE_MAX, fontSize + FONT_SIZE_STEP))}
							disabled={fontSize >= FONT_SIZE_MAX}
							x={[
								"settings-btn",
								"px-4 py-1.5",
								"text-lg font-medium",
								"transition-all",
								"border-l border-abi-dgrey dark:border-abi-dark-dgrey",
								fontSize >= FONT_SIZE_MAX
									? "bg-white dark:bg-gray-800 text-abi-lgrey dark:text-abi-dark-lgrey cursor-not-allowed"
									: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700",
							]}
						>
							+
						</button>
					</div>
				</div>

				{/* Window Size Selection */}
				<div>
					<h3 x={["text-sm font-medium text-black dark:text-white mb-1.5"]}>{t("settings.windowSize")}</h3>
					<div
						x={[
							"flex",
							"border border-abi-dgrey dark:border-abi-dark-dgrey",
							"divide-x divide-abi-dgrey dark:divide-abi-dark-dgrey",
							"rounded-md overflow-hidden",
							"w-full",
						]}
					>
						{WINDOW_SIZES.map(size => (
							<button
								key={size}
								onClick={() => setWindowSize(size)}
								disabled={windowSize === size}
								x={[
									"settings-btn",
									"flex-1 px-3 py-1.5",
									"text-sm",
									"transition-all",
									"disabled:cursor-default",
									windowSize === size
										? "bg-abi-lgrey dark:bg-abi-dark-lgrey text-black dark:text-white"
										: "bg-white dark:bg-gray-800 text-abi-dgrey dark:text-abi-dark-dgrey hover:text-black dark:hover:text-white",
								]}
							>
								{t(`settings.windowSize.${size}`)}
							</button>
						))}
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
							"settings-btn",
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

				{/* Clear Functions Button */}
				<div>
					<button
						onClick={() => clearFunctions()}
						disabled={userFunctions.size === 0}
						x={[
							"settings-btn",
							"w-full",
							"px-3 py-1.5",
							"bg-blue-50 dark:bg-blue-900",
							"text-blue-600 dark:text-blue-300",
							"border border-blue-200 dark:border-blue-700",
							"rounded-md",
							"text-sm",
							"transition-colors",
							userFunctions.size > 0
								? "hover:bg-blue-100 dark:hover:bg-blue-800"
								: "opacity-50 cursor-not-allowed",
						]}
					>
						{t("settings.clearFunctions")} ({userFunctions.size})
					</button>
				</div>

				{/* Version Information */}
				<div x={["pt-1.5", "border-t border-abi-lgrey dark:border-abi-dark-lgrey"]}>
					<p x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey"]}>{t("settings.version")}</p>
					<p
						x={["text-sm text-abi-dgrey dark:text-abi-dark-dgrey select-text"]}
						onClick={handleVersionClick}
						onMouseDown={e => e.stopPropagation()}
					>
						v{APP_VERSION} ({GIT_HASH.slice(0, 7)})
					</p>
				</div>
				</div>
			</div>
		</div>
	);
}
