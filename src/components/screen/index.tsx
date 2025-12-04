import Input from "./input";

import Result from "./result";
import ErrorIcon from "./error-icon";

export default function Screen() {
	return (
		<>
			<div
				className="window-animated"
				style={{ width: "var(--app-width)", maxWidth: "480px" }}
				x={[
					"relative",
					"h-24",
					"screen-input",
					"text-xl",
					"rounded-md overflow-hidden",
					"border border-abi-dgrey dark:border-abi-dark-dgrey",
					"focus-within:outline-none",
					"transition-shadow duration-150 ease-in-out",
					"focus-within:shadow-[inset_0_0_0_2px_theme(colors.abi-blue-1)]",
					"dark:focus-within:shadow-[inset_0_0_0_2px_theme(colors.abi-dark-blue-1)]",
				]}
			>
				<Result />
				<Input />
				<ErrorIcon />
			</div>
		</>
	);
}
