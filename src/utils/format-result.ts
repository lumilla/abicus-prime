import Decimal from "decimal.js";
import type { DecimalSeparator } from "#/state/types";
import { addThousandSeparators } from "./format-number";

const MAX_SIGNIFICANT_DIGITS = 21;
const MAX_DECIMAL_PLACES = 200;

export function formatResult(result: Decimal, decimalSeparator: DecimalSeparator = ",") {
	const formatted = result
		.toDecimalPlaces(MAX_DECIMAL_PLACES)
		.toSignificantDigits(MAX_SIGNIFICANT_DIGITS)
		.toString()
		.replace(".", decimalSeparator)
		.replace("-", "-");

	return addThousandSeparators(formatted, decimalSeparator);
}
