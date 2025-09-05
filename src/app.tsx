import Keypad from "#/components/keypad";
import Screen from "#/components/screen";
import SettingsPage from "#/components/settings-page";
import Terminal from "#/components/terminal";
import { useCalculator } from "#/state";
import { lazy, Suspense } from "preact/compat";

// Lazy load TitleBar only when needed (Tauri mode)
const TitleBar = lazy(() => import("#/components/title-bar"));

export default function App() {
	const { showSettings, interfaceMode, openSettings } = useCalculator();
	// Make Tauri detection synchronous to avoid layout flicker
	const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

	if (isTauri) {
		// Tauri layout - full window with rounded container
		return (
			<div
				x={[
					"w-full h-full",
					"bg-abi-lgrey dark:bg-abi-dark-lgrey",
					"rounded-2xl",
					"shadow-2xl",
					"overflow-hidden",
					"border border-black/10",
					"relative",
				]}
			>
				{/* Custom Title Bar - Lazy loaded only in Tauri mode */}
				<Suspense fallback={null}>
					<TitleBar />
				</Suspense>

				<main
					x={[
						"flex flex-col",
						interfaceMode === "terminal" || showSettings ? "pt-10" : "px-4 pt-10 pb-4",
						"h-full",
						"box-border",
						"items-center",
					]}
				>
					{showSettings ? (
						<div x={["w-full", ...(interfaceMode === "terminal" || showSettings ? ["h-full"] : ["max-w-sm"])]}>
							<SettingsPage />
						</div>
					) : interfaceMode === "terminal" ? (
						<div x={["w-full h-full flex flex-col"]}>
							<Terminal />
						</div>
					) : (
						<div x={["w-full flex flex-col gap-4 items-center"]}>
							<Screen />
							<Keypad />
						</div>
					)}
				</main>
			</div>
		);
	}

	// Browser layout - centered with max width (original layout restored)
	return (
		<>
			<div x={["max-w-sm", "flex justify-center"]}>
				<div x={["relative", "w-full"]}>
					{/* Settings Button */}
					{!showSettings && (
						<button
							onClick={openSettings}
							x={[
								"absolute",
								"top-0 right-0",
								"z-10",
								"p-2",
								"text-abi-dgrey hover:text-black dark:text-abi-dark-dgrey dark:hover:text-white",
								"transition-colors",
								"text-xl font-bold",
							]}
						>
							*
						</button>
					)}

					<main x={["flex flex-col gap-4"]}>
						{showSettings ? (
							<SettingsPage />
						) : interfaceMode === "terminal" ? (
							<Terminal />
						) : (
							<>
								<Screen />
								<Keypad />
							</>
						)}
					</main>
				</div>
			</div>
		</>
	);
}
