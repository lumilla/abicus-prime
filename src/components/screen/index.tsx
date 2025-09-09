import Input from "./input";

import Result from "./result";
import ErrorIcon from "./error-icon";

export default function Screen() {
	return (
		<>
			<div
				x={[
					"relative",
					"h-24",
					"w-96",
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
