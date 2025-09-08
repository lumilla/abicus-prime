import Decimal from "decimal.js";

const MAX_SIGNIFICANT_DIGITS = 21;
const MAX_DECIMAL_PLACES = 200;

/**
 * Adds thousand separators (spaces) to a number string
 * @param numStr - The number string to format
 * @returns The formatted number string with thousand separators
 */
function addThousandSeparators(numStr: string): string {
	// Handle exponential notation
	if (numStr.includes('e') || numStr.includes('E')) {
		const [mantissa, exponent] = numStr.split(/[eE]/);
		if (mantissa && exponent) {
			return addThousandSeparators(mantissa) + 'e' + exponent;
		}
	}

	// Split into integer and decimal parts
	const [integerPart, decimalPart] = numStr.split(',');
	
	// Add spaces every 3 digits from the right in the integer part
	const formattedInteger = integerPart?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '';
	
	// Return with decimal part if it exists
	return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
}

export function formatResult(result: Decimal) {
	const formatted = result
		.toDecimalPlaces(MAX_DECIMAL_PLACES)
		.toSignificantDigits(MAX_SIGNIFICANT_DIGITS)
		.toString()
		.replace(".", ",")
		.replace("-", "-");
	
	return addThousandSeparators(formatted);
}
