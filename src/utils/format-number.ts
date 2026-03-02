import type { DecimalSeparator } from "#/state/types";

/**
 * Narrow no-break space used as the digit-group separator.
 * Chosen over a regular space to prevent line-wrapping inside numbers
 * and to make the grouping visually tighter.
 */
export const THOUSAND_SEPARATOR = "\u202F";

/**
 * Inserts digit-group separators into a numeric string.
 *
 * - Integer part: groups of 3 from the right  (1234567 becomes 1 234 567)
 * - Decimal part: groups of 3 from the left   (123456789 becomes 123 456 789)
 * - Exponential notation: only the mantissa is grouped; the exponent is left untouched.
 *
 * No recursion - exponential notation is handled by splitting once.
 */
export function addThousandSeparators(numStr: string, decimalSeparator: DecimalSeparator = ","): string {
	let mantissa = numStr;
	let exponentSuffix = "";

	// Peel off the exponent part (if any) so it's never touched by grouping logic
	const eIdx = numStr.search(/[eE]/);
	if (eIdx !== -1) {
		mantissa = numStr.slice(0, eIdx);
		exponentSuffix = numStr.slice(eIdx); // e.g. "e+25"
	}

	const [integerPart = "", decimalPart] = mantissa.split(decimalSeparator);

	// Group integer digits: every 3 from the right
	const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEPARATOR);

	// Group decimal digits: every 3 from the left
	let result: string;
	if (decimalPart !== undefined) {
		const groupedDecimal =
			decimalPart.length > 3 ? decimalPart.replace(/(\d{3})(?=\d)/g, `$1${THOUSAND_SEPARATOR}`) : decimalPart;
		result = `${groupedInteger}${decimalSeparator}${groupedDecimal}`;
	} else {
		result = groupedInteger;
	}

	return result + exponentSuffix;
}
