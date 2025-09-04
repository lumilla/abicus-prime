import { render } from "preact";

import ErrorBoundary from "#/error-boundary";
import CalculatorProvider from "#/state";
import App from "#/app";

import "#/main.css";

render(
	<ErrorBoundary>
		<CalculatorProvider>
			<App />
		</CalculatorProvider>
	</ErrorBoundary>,
	document.getElementById("root") as HTMLElement,
);
