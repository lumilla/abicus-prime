import { useCalculator } from "#/state";
import { useTranslation } from "#/i18n/hook";
import WarningIcon from "#/components/warning-icon";

export default function ErrorIcon() {
	const { buffer } = useCalculator();
	const { t } = useTranslation();

	return (
		<div
			x={[
				"absolute bottom-1 left-1",
				"pointer-events-none",
				"transition-all",
				buffer.isErr ? "opacity-100" : "opacity-0",
			]}
			aria-label={t("error.imageAlt")}
		>
			<WarningIcon size={28} showBackground={false} />
		</div>
	);
}
