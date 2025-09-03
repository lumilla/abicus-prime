import Keypad from "#/components/keypad";
import Screen from "#/components/screen";
import SettingsPage from "#/components/settings-page";
import { useCalculator } from "#/state";

export default function App() {
	const { showSettings, openSettings } = useCalculator();

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
								"text-abi-dgrey hover:text-black",
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
