import { useCalculator } from "#/state";
import { lazy, Suspense } from "preact/compat";
import { useEffect } from "preact/hooks";
import gearIcon from "@icons/svg/gear.svg";

// Lazy load all components for better performance
const TitleBar = lazy(() => import("#/components/title-bar")); // Only used in Tauri mode
const SettingsPage = lazy(() => import("#/components/settings-page"));
const Terminal = lazy(() => import("#/components/terminal"));
const Screen = lazy(() => import("#/components/screen"));
const Keypad = lazy(() => import("#/components/keypad"));

// Pre-fetch functions for background loading
const prefetchComponents = (currentMode: string, isInTauri: boolean) => {
	// Use requestIdleCallback if available, otherwise setTimeout
	const scheduleTask = (callback: () => void, delay = 0) => {
		if (typeof requestIdleCallback !== "undefined") {
			requestIdleCallback(callback, { timeout: 1000 });
		} else {
			setTimeout(callback, delay);
		}
	};

	// Always pre-fetch settings page (most commonly accessed)
	scheduleTask(() => {
		import("#/components/settings-page").catch(() => {
			// Silently ignore errors - component will still lazy load when needed
		});
	});

	// Pre-fetch the opposite mode component for quick switching
	if (currentMode === "pocket") {
		scheduleTask(() => {
			import("#/components/terminal").catch(() => {});
		}, 100);
	} else if (currentMode === "terminal") {
		// Pre-fetch screen and keypad for switching back to pocket mode
		scheduleTask(() => {
			import("#/components/screen").catch(() => {});
		}, 100);
		scheduleTask(() => {
			import("#/components/keypad").catch(() => {});
		}, 200);
	}

	// Pre-fetch title bar for Tauri users
	if (isInTauri) {
		scheduleTask(() => {
			import("#/components/title-bar").catch(() => {});
		}, 50);
	}
};

export default function App() {
	const { showSettings, interfaceMode, openSettings } = useCalculator();
	// Make Tauri detection synchronous to avoid layout flicker
	const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

	// Pre-fetch lazy-loaded components in the background after initial render
	useEffect(() => {
		// Small delay to ensure initial render is complete
		const timer = setTimeout(() => {
			prefetchComponents(interfaceMode, isTauri);
		}, 500); // 500ms delay to ensure smooth initial load

		return () => clearTimeout(timer);
	}, [interfaceMode, isTauri]); // Re-run if mode or environment changes

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
								"transition-all duration-300",
								"flex items-center justify-center",
								"hover:scale-110",
							]}
							title="Open Settings"
						>
							<img 
								src={gearIcon} 
								alt="Settings" 
								x={[
									"w-4 h-4",
									"transition-transform duration-500 ease-in-out",
									"hover:rotate-180",
									"opacity-60 hover:opacity-100",
									"dark:invert"
								]} 
							/>
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
