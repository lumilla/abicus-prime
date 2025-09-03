import { useCalculator } from "#/state";
import errorImgSrc from "./error-img.svg";

export default function ErrorIcon() {
	const { buffer } = useCalculator();

	return (
		<div
			x={[
				"absolute bottom-0 left-0",
				"pointer-events-none",
				"pl-2 py-2",
				"bg-white dark:bg-gray-900",
				"transition-all",
				"shadow-[0_0_4px_4px_white] dark:shadow-[0_0_4px_4px_rgb(17_24_39)]",
				buffer.isErr ? "opacity-100" : "opacity-0",
			]}
		>
			<img src={errorImgSrc} x="w-6 dark:brightness-125 dark:contrast-75" />
		</div>
	);
}
