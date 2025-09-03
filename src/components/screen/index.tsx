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
					"text-xl",
					"rounded-md overflow-hidden",
					"border border-abi-dgrey dark:border-abi-dark-dgrey has-[:focus]:border-transparent",
					"has-[:focus]:ring-2 ring-blue-400 dark:ring-blue-500",
				]}
			>
				<Result />
				<Input />
				<ErrorIcon />
			</div>
		</>
	);
}
