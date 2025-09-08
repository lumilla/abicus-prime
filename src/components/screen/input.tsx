import { JSX } from "preact";
import { useEffect } from "preact/hooks";

import { useCalculator } from "#/state";
import { match } from "ts-pattern";
import { EXPR_DEBUG } from "#/error-boundary/constants";

export default function Input() {
	const { buffer, crunch, angleUnit, degsOn, radsOn } = useCalculator();

	const shouldShowOutput = !buffer.isDirty && !buffer.isErr;

	function onChange(e: JSX.TargetedEvent<HTMLInputElement>) {
		const target = e.target as HTMLInputElement;
		(window as any)[EXPR_DEBUG] = target.value;
		buffer.set(target.value);
	}

	function onKeyDown(e: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
		const handled = match(e.key)
			.with("Enter", "=", "ArrowDown", () => {
				crunch();
				return true;
			})
			.with("(", () => {
				buffer.input.openBrackets();
				return true;
			})
			.with(")", () => {
				buffer.input.closeBrackets();
				return true;
			})
			.with("^", "/", "+", symbol => {
				buffer.input.oper(symbol);
				return true;
			})
			.with("-", () => {
				buffer.input.oper("−");
				return true;
			})
			.with("*", () => {
				buffer.input.oper("⋅");
				return true;
			})
			.with("Escape", () => {
				buffer.empty();
				return true;
			})
			.with("Tab", () => {
				if (angleUnit === "deg") {
					radsOn();
				} else {
					degsOn();
				}
				return true;
			})
			.otherwise(() => false);

		if (handled) e.preventDefault();
	}
	function onBlur(e: JSX.TargetedFocusEvent<HTMLInputElement>) {
		// Timeout needed because of Safari (of course)
		setTimeout(() => {
			const target = e.target as HTMLInputElement;
			target.scrollLeft = target.scrollWidth;
		}, 0);
	}

	useEffect(
		function BufferInputKeypadInputListener() {
			const element = buffer.ref.current;
			if (!element) return;

			if (document.activeElement !== element) {
				element.scrollLeft = element.scrollWidth;
			}
		},
		[buffer.value],
	);

	return (
		<input
			type="text"
			autoFocus
			ref={buffer.ref}
			value={buffer.value}
			onInput={onChange}
			onKeyDown={onKeyDown}
			onBlur={onBlur}
			x={[
				"absolute bottom-0",
				"w-full h-full",
				"px-4 pt-14",
				"bg-transparent",
				"text-right",
				"transition-all",
				// Focus is shown by the parent so it's safe to disable here
				"focus:outline-none",
				shouldShowOutput ? "text-slate-500 dark:text-slate-400 text-sm" : "text-black dark:text-white",
			]}
			// Safari bug workaround:
			// As of writing this, translating an input in safari without using `translate3d`
			// can cause the content of the input to visually lag behind the container
			style={{ transform: shouldShowOutput ? "translate3d(0, -2rem, 0)" : "translate3d(0, 0, 0)" }}
		/>
	);
}
