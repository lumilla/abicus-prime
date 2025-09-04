import Decimal from "decimal.js";
import { err, ok, Result } from "neverthrow";
import { match } from "ts-pattern";

import { INPUT_DEBUG } from "#/error-boundary/constants";

/**
 * Represents an error where the tokeniser couldn't match the input to any token.
 * The `idx` field points to the start of the unknown part in the input.
 */
export type LexicalError = { type: "UNKNOWN_TOKEN"; idx: number };

/** A tuple of Regex and a token builder function. See {@link tokenMathcers} for details. */
type TokenMatcher = (typeof tokenMatchers)[number];
/** Any of the tokens created by the token builder function in {@link tokenMatchers}. */
type TokenAny = ReturnType<TokenMatcher[1]>;

/**
 * A union of all the possible `Token` `type` values.
 * Automatically computed from `tokenMatchers`.
 * @see {@link tokenMatchers}
 * @see {@link Token}
 */
export type TokenId = ReturnType<TokenMatcher[1]>["type"];

/**
 * A utility type to get the type of a `Token` by type id.
 * @see {@link TokenId} for a comprehensive list of the different token types.
 * @example
 * ```typescript
 * type ConstantToken = Token<"cons">
 * //   ConstantToken = { type: "cons"; name: "pi" | "e" }
 * type FunctionToken = Token<"func">
 * //   FunctionToken = { type: "func"; name: "sin" | "cos" ... }
 * type LeftBrakToken = Token<"lbrk">
 * //   FunctionToken = { type: "lbrk" }
 * ```
 */
export type Token<T extends TokenId = TokenId> = Extract<TokenAny, { type: T }>;

/**
 * An array of regex & builder function tuples where
 * - The regex detects a token from the input
 * - The builder builds a token object from the slice that the regex detected
 * @see {@link TokenId}
 * @see {@link Token}
 */
const tokenMatchers = [
	// **Notes:**
	// - Each regex should only try to find its token from the beginning of the string.
	// - When adding new types, remember to mark the `type` property `as const` for TypeScript.

	[
		// Unsigned numeric literal: "0", "123", "25.6", etc...
		/^((\d+[,.]\d+)|([1-9]\d*)|0)/,
		str => ({
			type: "litr" as const,
			value: new Decimal(str.replace(",", ".")),
		}),
	],
	[
		// Operators: "-", "+", "/", "*", "^"
		// The multiplication and minus signs have unicode variants that also need to be handled
		/^[-+/*^−×]/,
		str => ({
			type: "oper" as const,
			name: match(str)
				.with("-", "+", "/", "*", "^", op => op)
				.with("−", () => "-" as const)
				.with("×", () => "*" as const)
				.otherwise(op => {
					throw Error(`Programmer error: neglected operator "${op}"`);
				}),
		}),
	],
	[
		// Left bracket: "("
		/^\(/,
		_ => ({ type: "lbrk" as const }),
	],
	[
		// Right bracket: ")"
		/^\)/,
		_ => ({ type: "rbrk" as const }),
	],
	[
		// Semicolon: ";"
		/^;/,
		_ => ({ type: "semi" as const }),
	],
	[
		// Constants: "pi", "e", and unicode variations
		/^(pi|π|e|ℇ|𝑒|ℯ)/i,
		str => ({
			type: "cons" as const,
			name: match(str.toLowerCase())
				.with("pi", "e", name => name)
				.with("π", () => "pi" as const)
				.with("ℇ", "𝑒", "ℯ", () => "e" as const)
				.otherwise(name => {
					throw Error(`Programmer error: neglected constant "${name}"`);
				}),
		}),
	],
	[
		// Memory register: "ans" (answer register), "mem" (independent memory register)
		/^(ans|mem|m|ind)/i,
		str => ({
			type: "memo" as const,
			name: match(str.toLowerCase())
				.with("ans", () => "ans" as const)
				.with("m", "ind", "mem", () => "ind" as const)
				.otherwise(name => {
					throw Error(`Programmer error: neglected memory register "${name}"`);
				}),
		}),
	],
	[
		// Function name: "sin", "log", "√", etc...
		new RegExp(
			[
				// TODO: Should we also support the "sin^(-1)" notation for arcus functions?
				// TODO: Should we also support the "sin^(2)(x) == sin(x^2)" notation?
				/^((a(rc)?)?(sin|cos|tan))/,
				/^(log|lg|ln)/,
				/^(root|sqrt|√)/,
				/^(fact)/,
			]
				.map(subRegex => subRegex.source)
				.join("|"),
			"i",
		),
		str => ({
			type: "func" as const,
			name: match(str.toLowerCase())
				.with("sqrt", "root", "ln", "sin", "cos", "tan", "asin", "acos", "atan", name => name)
				.with("log", "lg", () => "log10" as const)
				.with("√", () => "root" as const)
				.with("arcsin", () => "asin" as const)
				.with("arccos", () => "acos" as const)
				.with("arctan", () => "atan" as const)
				.with("fact", () => "fact" as const)
				.otherwise(name => {
					throw Error(`Programmer error: neglected function "${name}"`);
				}),
		}),
	],
	[
		// Factorial operator: "!"
		/^!/,
		_ => ({ type: "fact" as const }),
	],
] satisfies [RegExp, (str: string) => { type: string }][];

/**
 * Reads an input expression and returns a `Result<Token[], LexicalError>` where
 * - `Token[]` is the tokenised expression, or
 * - `LexicalError.idx` is the starting index of the *first lexical error* (i.e. unrecognised word) in the input expression.
 *
 * @see {@link Token}
 * @example
 * ```typescript
 * tokenise("1 + 2") // => Ok([{ type: "litr", value: Decimal(1) }, { type: "oper", name: "+" }, ...])
 * tokenise("1 ö 2") // => Err({ type: "UNKNOWN_TOKEN", idx: 2 }) // 2 === "1 ö 2".indexOf("ö")
 * ```
 */
export default function tokenise(expression: string): Result<Token[], LexicalError> {
	// Preprocess a few common shorthand notations before tokenising:
	// 1) Superscript exponents: "3⁵" -> "3^5", "12⁴⁵" -> "12^45"
	//    Only transform when the superscript run is attached to a base token (e.g. digit or ")").
	// 2) Inverse trig notation: "sin^(-1)(x)" -> "arcsin(x)" (same for cos/tan)
	// 3) Function power notation: "sin^(2)(x)" -> "sin(x)^(2)" (so it's parsed as (sin(x))^2)
	const preprocessed = preprocessFunctionPowers(preprocessSuperscripts(expression));

	return Result.combine([...tokens(preprocessed)]);
}

/**
 * Rewrites runs of superscript characters into ^<digits> sequences.
 * Example: "3⁵" -> "3^5", "12⁴⁵" -> "12^45".
 * Only rewrites when attached to a non-whitespace base; standalone superscripts
 * are left unchanged to trigger lexical errors.
 */
function preprocessSuperscripts(input: string) {
	const supers = /(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺])+/g;

	const map: Record<string, string> = {
		"⁰": "0",
		"¹": "1",
		"²": "2",
		"³": "3",
		"⁴": "4",
		"⁵": "5",
		"⁶": "6",
		"⁷": "7",
		"⁸": "8",
		"⁹": "9",
		"⁻": "-",
		"⁺": "+",
	};

	return input.replace(supers, function (match: string, offset: number, s: string) {
		if (offset === 0) return match;

		const prev = s[offset - 1] ?? "";
		// Allow any non-whitespace base; defer semantic validation.
		if (!/\S/.test(prev)) return match;

		const converted = Array.from(match)
			.map(ch => map[ch] ?? ch)
			.join("");

		// Skip sign-only runs to avoid orphaned operators.
		if (/^[+-]+$/.test(converted)) return match;

		// Handle expressions in exponents (e.g., 5⁵⁺⁵ -> 5^(5+5)) or signed exponents (e.g., 2⁻³ -> ^-3).
		const hasInternalPlusMinus = /[+-]/.test(converted.slice(1));
		if (hasInternalPlusMinus) return "^(" + converted + ")";

		return "^" + converted;
	});
}

/**
 * Rewrites occurrences of f^(n)(arg) into f(arg)^(n), and rewrites f^(-1)(arg)
 * for sin/cos/tan into arcsin/arccos/arctan(arg). The operation is string-level
 * and preserves other characters verbatim.
 */
function preprocessFunctionPowers(input: string) {
	const funcs = /\b(?:arcsin|arccos|arctan|asin|acos|atan|sin|cos|tan|sqrt|root|√|log|lg|ln|fact)\b/gi;

	let expr = input;
	let m: RegExpExecArray | null;

	// Helper to find the matching closing parenthesis for a '(' at `start`.
	function findClosingParen(s: string, start: number) {
		let depth = 0;
		for (let i = start; i < s.length; i++) {
			if (s[i] === "(") depth++;
			else if (s[i] === ")") {
				depth--;
				if (depth === 0) return i;
			}
		}
		return -1;
	}

	// We use exec in a loop, but because we mutate `expr` we must reset lastIndex each iteration.
	while ((m = funcs.exec(expr)) !== null) {
		const nameStart = m.index;
		const name = m[0];
		let nameEnd = nameStart + name.length;

		// Skip any whitespace between name and the following characters
		const wsMatch = /^\s*/.exec(expr.slice(nameEnd))?.[0] ?? "";
		nameEnd += wsMatch.length;

		// Check for a power annotation of the form ^(...)
		if (expr[nameEnd] !== "^") {
			// continue search after this match
			funcs.lastIndex = nameEnd;
			continue;
		}

		const expOpen = nameEnd + 1;
		if (expr[expOpen] !== "(") {
			funcs.lastIndex = nameEnd + 1;
			continue;
		}

		const expClose = findClosingParen(expr, expOpen);
		if (expClose === -1) {
			// malformed, skip
			funcs.lastIndex = nameEnd + 1;
			continue;
		}

		const exponent = expr.slice(expOpen + 1, expClose);

		// After the exponent closing paren there may be whitespace before the arg paren
		let afterExp = expClose + 1;
		const wsAfterExp = /^\s*/.exec(expr.slice(afterExp))?.[0] ?? "";
		afterExp += wsAfterExp.length;

		// Expect a '(' for the function's argument list
		if (expr[afterExp] !== "(") {
			funcs.lastIndex = afterExp;
			continue;
		}

		const argOpen = afterExp;
		const argClose = findClosingParen(expr, argOpen);
		if (argClose === -1) {
			funcs.lastIndex = afterExp;
			continue;
		}

		// Special-case: sin^(-1)(x) -> arcsin(x) (and similarly for cos/tan)
		const lowerName = name.toLowerCase();
		const trimmedExp = exponent.trim();
		if (trimmedExp === "-1" && (lowerName === "sin" || lowerName === "cos" || lowerName === "tan")) {
			const arcMap: Record<string, string> = { sin: "arcsin", cos: "arccos", tan: "arctan" };
			const arcName = arcMap[lowerName];
			const newSub = arcName + expr.slice(argOpen, argClose + 1);

			expr = expr.slice(0, nameStart) + newSub + expr.slice(argClose + 1);

			// Continue scanning after the replacement
			funcs.lastIndex = nameStart + newSub.length;
			continue;
		}

		// General case: move the ^(exponent) after the function argument: f^(n)(arg) -> f(arg)^n
		const origSubEnd = argClose + 1;
		const exponentTrim = exponent.trim();

		// If the exponent is a single simple number (e.g. 2 or 1.5), we can safely drop the
		// parentheses so the final expression becomes `f(arg)^2`. For more complex exponents
		// (like `1+1`) keep the parentheses to preserve grouping.
		const simpleNumber = /^[-+]?\d+(?:[.,]\d+)?$/.test(exponentTrim);
		const powSuffix = simpleNumber ? "^" + exponentTrim : "^(" + exponent + ")";

		const newSub = name + expr.slice(argOpen, origSubEnd) + powSuffix;

		expr = expr.slice(0, nameStart) + newSub + expr.slice(origSubEnd);

		// Continue scanning after the replacement
		funcs.lastIndex = nameStart + newSub.length;
	}

	return expr;
}

/**
 * Reads an input expression and returns a `Generator` of `Result<Token, number>` where
 * - `Token` is a token object as built by one of the matchers in {@link tokenMatchers}, or
 * - `number` is the index (of the passed in string) where none of the matchers could be applied,
 *   meaning that there is a lexical error at that point in the input.
 *
 * The generator stops on the first lexical error.
 * I.e. if an error is encountered, it will be the last value output by the generator.
 *
 * @see {@link tokenise}
 * @see {@link Token}
 */
function* tokens(expression: string): Generator<Result<Token, LexicalError>, void, void> {
	const end = expression.length;
	let idx = 0;

	eating: while (idx < end) {
		const slice = expression.slice(idx, end);

		const whitespace = /^\s+/.exec(slice)?.[0];
		if (whitespace) {
			idx += whitespace.length;
			continue eating;
		}

		if (import.meta.env.DEV && slice.startsWith("improbatur")) {
			(window as any)[INPUT_DEBUG] = "tan5sin/ANSsin/tan5sin+(🕺🏼🕺🏼)";
			throw Error("Simulated Error: This is a simulated error for testing purposes.");
		}

		matching: for (const [regex, build] of tokenMatchers) {
			const str = regex.exec(slice)?.[0];

			if (!str) continue matching;

			const token = build(str);

			idx += str.length;

			yield ok(token);
			continue eating;
		}

		yield err({ type: "UNKNOWN_TOKEN", idx });
		return;
	}
}
