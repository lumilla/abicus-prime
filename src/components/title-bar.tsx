import { useCalculator } from "#/state";
import { useState, useEffect } from "preact/hooks";

export default function TitleBar() {
	// Make Tauri detection synchronous to avoid layout flicker
	const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
	const { showSettings, openSettings, closeSettings } = useCalculator();
	const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

	// Initialize the always-on-top state when component mounts
	useEffect(() => {
		const initializePinState = async () => {
			if (isTauri) {
				try {
					// Get current always-on-top state (this might not be available in all Tauri versions)
					// For now, we'll start with false and track changes from our button
				} catch (error) {
					console.error("Failed to get initial always-on-top state:", error);
				}
			}
		};
		initializePinState();
	}, [isTauri]);

	const handleMinimize = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (isTauri) {
			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				const window = getCurrentWindow();
				await window.minimize();
			} catch (error) {
				console.error("Failed to minimize:", error);
			}
		}
	};

	const handleClose = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (isTauri) {
			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				const window = getCurrentWindow();
				await window.close();
			} catch (error) {
				console.error("Failed to close:", error);
			}
		}
	};

	const handleDragStart = async (_e: MouseEvent) => {
		if (isTauri) {
			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				const window = getCurrentWindow();
				await window.startDragging();
			} catch (error) {
				console.error("Failed to start dragging:", error);
			}
		}
	};

	const handleButtonMouseDown = (e: MouseEvent) => {
		e.stopPropagation(); // Prevent triggering drag when clicking buttons
	};

	const handleSettingsToggle = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (showSettings) {
			closeSettings();
		} else {
			openSettings();
		}
	};

	const handlePinToggle = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (isTauri) {
			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				const window = getCurrentWindow();
				const newState = !isAlwaysOnTop;
				console.log(`Setting always on top to: ${newState}`);
				await window.setAlwaysOnTop(newState);
				setIsAlwaysOnTop(newState);
				console.log(`Successfully set always on top to: ${newState}`);
			} catch (error) {
				console.error("Failed to toggle always on top:", error);
			}
		}
	};

	if (!isTauri) return null;

	return (
		<div
			onMouseDown={handleDragStart}
			x={[
				"flex justify-between items-center",
				"h-8 w-full",
				"absolute top-0 left-0 right-0",
				"z-50",
				"px-4 py-2",
				"cursor-move select-none",
				"bg-black/20 dark:bg-black/20 backdrop-blur-sm",
				"border-b border-black/10 dark:border-white/10",
			]}
		>
			<div x={["flex items-center gap-3"]}>
				<button
					type="button"
					onClick={handleSettingsToggle}
					onMouseDown={handleButtonMouseDown}
					x={[
						"w-3 h-3 rounded-full",
						"bg-gray-400 hover:bg-gray-500",
						"border-0 cursor-pointer",
						"flex items-center justify-center",
						"transition-all duration-150",
						"hover:scale-110 active:scale-95",
					]}
					title={showSettings ? "Close Settings" : "Open Settings"}
				>
					<div x={["text-[6px] text-gray-900 font-bold leading-none"]}>{showSettings ? "×" : "⚙"}</div>
				</button>
				<span x={["text-xs text-black dark:text-white font-medium pointer-events-none"]}>Abicus Prime</span>
			</div>

			<div x={["flex gap-2 items-center"]} onMouseDown={handleButtonMouseDown}>
				<button
					type="button"
					onClick={handlePinToggle}
					onMouseDown={handleButtonMouseDown}
					x={[
						"w-3 h-3 rounded-full",
						isAlwaysOnTop ? "bg-blue-400 hover:bg-blue-500" : "bg-gray-400 hover:bg-gray-500",
						"border-0 cursor-pointer",
						"flex items-center justify-center",
						"transition-all duration-150",
						"hover:scale-110 active:scale-95",
					]}
					title={isAlwaysOnTop ? "Unpin from top" : "Pin always on top"}
				>
					<div x={["text-[7px] text-gray-900 font-bold leading-none"]}>📌</div>
				</button>
				<button
					type="button"
					onClick={handleMinimize}
					onMouseDown={handleButtonMouseDown}
					x={[
						"w-3 h-3 rounded-full",
						"bg-yellow-400 hover:bg-yellow-500",
						"border-0 cursor-pointer",
						"flex items-center justify-center",
						"transition-all duration-150",
						"hover:scale-110 active:scale-95",
					]}
					title="Minimize"
				>
					<div x={["w-1.5 h-0.5 bg-yellow-900 rounded"]}></div>
				</button>

				<button
					type="button"
					onClick={handleClose}
					onMouseDown={handleButtonMouseDown}
					x={[
						"w-3 h-3 rounded-full",
						"bg-red-400 hover:bg-red-500",
						"border-0 cursor-pointer",
						"flex items-center justify-center",
						"transition-all duration-150",
						"text-xs text-red-900 font-bold leading-none",
						"hover:scale-110 active:scale-95",
					]}
					title="Close"
				>
					×
				</button>
			</div>
		</div>
	);
}
