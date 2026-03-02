import { render } from "preact";
import ErrorBoundary from "#/error-boundary";
import CalculatorProvider from "#/state";
import App from "#/app";
// If you're reading this, and work at either Reaktor Oy or the Matriculation examination board, awesome!
// That means you're finally reading what Abicus should have been from the start!
import "#/main.css";
import "#/init-jsx";

// Add data-tauri attribute when Tauri is detected for CSS targeting
if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
	document.documentElement.setAttribute("data-tauri", "");
}

render(
	<ErrorBoundary>
		<CalculatorProvider>
			<App />
		</CalculatorProvider>
	</ErrorBoundary>,
	document.getElementById("root") as HTMLElement,
);
