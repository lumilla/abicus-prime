import { ComponentChildren, JSX } from "preact";
import { match } from "ts-pattern";

import { useCalculator } from "#/state";

/*****************************************************************************/

export type RawKeyProps<O extends string = never> = Omit<
	{
		label: ComponentChildren;
		onClick: () => void;
		tint?: "none" | "d-blue" | "l-blue" | "grey";
		className?: any;
	},
	O
>;

export function RawKey({ onClick: propsOnClick, tint = "none", label, className }: RawKeyProps) {
	const { buffer } = useCalculator();

	function onMouseDown(_e: JSX.TargetedMouseEvent<HTMLButtonElement>) {
		// Don't prevent default to allow CSS :active pseudo-class to work
		buffer.ref.current?.focus(); // seems to not cause issues
	}

	function onClick() {
		propsOnClick();
	}

	return (
		<button
			x={[
				"h-9",
				"rounded-sm border border-abi-dgrey dark:border-abi-dark-dgrey",
				[
					"transition-transform duration-150 ease-out",
					"scale-100",
					"hover:scale-105",
					"active:scale-95",
					"text-black dark:text-white",
					match(tint)
						.with("none", () => "bg-white dark:bg-gray-700 active:bg-slate-100 dark:active:bg-gray-600")
						.with("d-blue", () => "bg-abi-blue-2 dark:bg-abi-dark-blue-2 active:bg-blue-300 dark:active:bg-blue-600")
						.with("l-blue", () => "bg-abi-blue-3 dark:bg-abi-dark-blue-3 active:bg-blue-100 dark:active:bg-blue-800")
						.with("grey", () => "bg-abi-lgrey dark:bg-abi-dark-lgrey active:bg-slate-300 dark:active:bg-slate-500")
						.exhaustive(),
				],
				className,
			]}
			onClick={onClick}
			onMouseDown={onMouseDown}
		>
			{label}
		</button>
	);
}

/*****************************************************************************/

type BasicKeyProps = RawKeyProps<"onClick" | "label"> & { input: string; label?: ComponentChildren };

export function BasicKey({ input, label = input, ...props }: BasicKeyProps) {
	const { buffer } = useCalculator();

	function onClick() {
		buffer.input.key(input);
	}

	return <RawKey label={label} onClick={onClick} {...props} />;
}

/*****************************************************************************/

type FunctionKeyProps = RawKeyProps<"onClick" | "label"> & { name: string };

export function FunctionKey({ name, ...props }: FunctionKeyProps) {
	const { buffer } = useCalculator();

	function onClick() {
		buffer.input.func(name);
	}

	return <RawKey label={name} onClick={onClick} {...props} />;
}

/*****************************************************************************/

type OperatorKeyProps = RawKeyProps<"onClick" | "label"> & { symbol: string };

export function OperatorKey({ symbol, ...props }: OperatorKeyProps) {
	const { buffer } = useCalculator();

	function onClick() {
		buffer.input.oper(symbol);
	}

	return <RawKey label={symbol} onClick={onClick} {...props} />;
}
