import { useCalculator } from "#/state";
import { lazy, Suspense } from "preact/compat";
import gearIcon from "@icons/svg/gear.svg";

// Lazy load all components for better performance
const TitleBar = lazy(() => import("#/components/title-bar")); // Only used in Tauri mode
const SettingsPage = lazy(() => import("#/components/settings-page"));
const Terminal = lazy(() => import("#/components/terminal"));
const Screen = lazy(() => import("#/components/screen"));
const Keypad = lazy(() => import("#/components/keypad"));

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
						<div key="settings" x={["w-full", ...(interfaceMode === "terminal" || showSettings ? ["h-full"] : ["max-w-sm"]), "fade-in-slow"]}>
							<Suspense fallback={<div x={["opacity-0"]} />}>
								<SettingsPage />
							</Suspense>
						</div>
					) : interfaceMode === "terminal" ? (
						<div key="terminal" x={["w-full h-full flex flex-col", "fade-in-slow"]}>
							<Suspense fallback={<div x={["opacity-0"]} />}>
								<Terminal />
							</Suspense>
						</div>
					) : (
						<div key="calculator" x={["w-full flex flex-col gap-4 items-center", "fade-in-slow"]}>
							<Suspense fallback={<div x={["opacity-0"]} />}>
								<div x={["flex flex-col gap-4 items-center"]}>
									<Screen />
									<Keypad />
								</div>
							</Suspense>
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
								"flex items-center justify-center",
							]}
							title="Open Settings"
						>
							<img src={gearIcon} alt="Settings" x={["w-4 h-4"]} />
						</button>
					)}

					<main x={["flex flex-col gap-4"]}>
						{showSettings ? (
							<div key="settings" className="fade-in-slow">
								<Suspense fallback={<div x={["opacity-0"]} />}>
									<SettingsPage />
								</Suspense>
							</div>
						) : interfaceMode === "terminal" ? (
							<div key="terminal" className="fade-in-slow">
								<Suspense fallback={<div x={["opacity-0"]} />}>
									<Terminal />
								</Suspense>
							</div>
						) : (
							<div key="calculator" className="fade-in-slow">
								<Suspense fallback={<div x={["opacity-0"]} />}>
									<div x={["flex flex-col gap-4"]}>
										<Screen />
										<Keypad />
									</div>
								</Suspense>
							</div>
						)}
					</main>
				</div>
			</div>
		</>
	);
}
