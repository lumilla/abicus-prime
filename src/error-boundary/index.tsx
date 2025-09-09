import { Component, ComponentChildren } from "preact";
import { useTranslation } from "#/i18n";
import WarningIcon from "#/components/warning-icon";

import { BUFFER_DEBUG, EXPR_DEBUG, INPUT_DEBUG } from "./constants";

// Currently no way to write Error Boundaries as function components :(

type Props = { children: ComponentChildren };

function ErrorBoundaryContent({ error, stack }: { error: any; stack: any }) {
	const { t } = useTranslation();
	const message = error.message;
	// Make Tauri detection synchronous
	const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

	// Check if this is a user-triggered error
	const isUserTriggered =
		message &&
		(message.includes("User triggered error") ||
			message.includes("user-triggered") ||
			message.includes("usertriggerederror") ||
			t("error.usertriggerederror") === message);

	// Try to get calculator settings from localStorage as fallback
	let calculatorSettings = {
		interfaceMode: "unknown",
		angleUnit: "unknown",
		isDarkMode: "unknown" as string | boolean,
		language: "unknown",
		showSettings: "unknown",
	};

	try {
		const darkMode = localStorage.getItem("abicus-dark-mode");
		const language = localStorage.getItem("abicus-language");
		calculatorSettings = {
			interfaceMode: "pocket", // Default since terminal isn't persisted
			angleUnit: "deg", // Default since not persisted
			isDarkMode: darkMode ? JSON.parse(darkMode) : "unknown",
			language: language || "fi",
			showSettings: "unknown", // Can't determine from localStorage
		};
	} catch (_e) {
		// Fallback values already set
	}

	function onClickReload() {
		location.reload();
	}

	return (
		<main
			x={[
				...(isTauri ? ["w-full h-full"] : ["max-w-sm h-screen"]),
				"flex flex-col justify-center items-center",
				"text-black dark:text-white", // Add dark mode text color
				...(isTauri ? ["bg-abi-lgrey dark:bg-abi-dark-lgrey rounded-2xl px-8 py-12"] : []),
			]}
		>
			<div x="grid grid-cols-[5rem_1fr] items-center gap-4 mt-10">
				<div x={["h-16 flex items-center justify-center"]}>
					<WarningIcon size={64} showBackground={true} />
				</div>

				<h1 x="text-xl">{t("error.title")}</h1>
			</div>

			<p x="mt-8 mb-8">{t("error.description")}</p>

			<output
				x={[
					...(isTauri ? ["w-full max-w-md"] : ["w-[24rem]"]),
					"grow",
					"overflow-scroll",
					"px-3 py-2",
					"rounded-md",
					"flex flex-col",
					"text-xs font-mono",
					"bg-abi-blue-2 border border-blue-300",
					...(isTauri ? ["dark:bg-gray-800 dark:border-gray-600 dark:text-white"] : []),
				]}
			>
				{isUserTriggered && <span>*** USER TRIGGERED ERROR ***</span>}
				<span>Abicus Prime@{__GIT_HASH__}</span>
				<span>Platform: {isTauri ? "Tauri Desktop" : "Web Browser"}</span>
				<span>--- Calculator Settings ---</span>
				<span>Interface Mode: {calculatorSettings.interfaceMode}</span>
				<span>Angle Unit: {calculatorSettings.angleUnit}</span>
				<span>
					Theme:{" "}
					{calculatorSettings.isDarkMode === true
						? "dark"
						: calculatorSettings.isDarkMode === false
							? "light"
							: "unknown"}
				</span>
				<span>Language: {calculatorSettings.language}</span>
				<span>--- Message ---</span>
				<span>{message}</span>
				<span>--- Last Values ---</span>
				<span>Expr: {(window as any)[EXPR_DEBUG]}</span>
				<span>Input: {(window as any)[INPUT_DEBUG]}</span>
				<span>Buffer: {(window as any)[BUFFER_DEBUG]}</span>
				<span>--- Component Stack ---</span>
				<span>{stack}</span>
				<span>--- End ---</span>
			</output>

			<div x="my-8">
				<button
					onClick={onClickReload}
					x={[
						"h-9 px-4",
						"rounded-sm border border-abi-dgrey",
						"shadow scale-100",
						...(isTauri
							? [
									"bg-white dark:bg-gray-700 active:bg-slate-100 dark:active:bg-gray-600",
									"dark:border-gray-600 dark:text-white",
								]
							: ["bg-white active:bg-slate-100"]),
						"transition-all duration-75",
						"active:shadow-none active:scale-95",
					]}
				>
					{t("error.restart")}
				</button>
			</div>
		</main>
	);
}

export default class ErrorBoundary extends Component<Props, { error: any; stack: any }> {
	constructor(props: Props) {
		super(props);
		this.state = { error: null, stack: null };
	}

	static getDerivedStateFromError(error: any) {
		return { error };
	}

	componentDidCatch(_: unknown, info: any) {
		this.setState(s => ({ ...s, stack: info.componentStack }));
	}

	render() {
		if (this.state.error === null) return this.props.children;

		const error = this.state.error;
		const stack = this.state.stack;

		return <ErrorBoundaryContent error={error} stack={stack} />;
	}
}
