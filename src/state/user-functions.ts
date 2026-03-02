/**
 * User-defined function storage and management.
 *
 * Allows users to define custom functions like `f(x) = 2*x`
 * and use them in subsequent calculations like `f(5)` -> 10
 *
 * Also supports user-defined constants like `tau = 2*pi`
 * which are expanded in expressions before tokenising.
 */

export type UserFunction = {
	name: string;
	params: string[];
	body: string;
};

export type UserFunctionsMap = Map<string, UserFunction>;

export type UserConstant = {
	name: string;
	body: string;
};

export type UserConstantsMap = Map<string, UserConstant>;

/** Reserved names that cannot be used for user functions or user constants */
const RESERVED_NAMES = new Set([
	"sin",
	"cos",
	"tan",
	"asin",
	"acos",
	"atan",
	"arcsin",
	"arccos",
	"arctan",
	"log",
	"lg",
	"ln",
	"sqrt",
	"root",
	"fact",
	"ans",
	"mem",
	"ind",
	"pi",
	"e",
]);

/**
 * Parses an expression like `f(x;y)=x+y` into a UserFunction, or returns null.
 */
export function parseFunctionDefinition(expression: string): UserFunction | null {
	const expr = expression.replace(/\s/g, "");
	const match = /^([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]*)\)=(.+)$/.exec(expr);

	if (!match) return null;

	const [, name, paramsStr, body] = match;
	if (!name || !body || RESERVED_NAMES.has(name.toLowerCase())) return null;

	// Use semicolon as parameter separator
	const params = paramsStr
		? paramsStr
				.split(";")
				.map(p => p.trim())
				.filter(p => p.length > 0)
		: [];

	// Validate params: valid identifiers and no duplicates
	const paramRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
	const seen = new Set<string>();
	for (const p of params) {
		if (!paramRegex.test(p) || seen.has(p)) return null;
		seen.add(p);
	}

	return { name, params, body };
}

/**
 * Parses an expression like `tau=2*pi` into a UserConstant, or returns null.
 * A constant definition has no parentheses (which distinguishes it from a function definition).
 */
export function parseConstantDefinition(expression: string): UserConstant | null {
	const expr = expression.replace(/\s/g, "");

	// Must be: identifier = body (no parentheses after the name)
	const match = /^([a-zA-Z_][a-zA-Z0-9_]*)=(.+)$/.exec(expr);
	if (!match) return null;

	const [, name, body] = match;
	if (!name || !body || RESERVED_NAMES.has(name.toLowerCase())) return null;

	return { name, body };
}

/**
 * Substitutes all user-defined constants in an expression, iterating until stable
 * to handle constants that reference other constants (e.g. `a = 2`, `b = 3*a`).
 *
 * Returns `null` if the depth limit is exceeded (likely circular reference).
 */
export function expandUserConstants(
	expression: string,
	constants: UserConstantsMap,
	maxDepth: number = 10,
): string | null {
	if (constants.size === 0) return expression;

	let result = expression;
	let changed = true;
	let depth = 0;

	// Sort by name length descending to avoid partial replacements of shorter names first
	const sorted = [...constants.values()].sort((a, b) => b.name.length - a.name.length);

	while (changed) {
		if (depth++ >= maxDepth) return null; // Circular reference
		changed = false;

		for (const constant of sorted) {
			const pattern = new RegExp(`\\b${constant.name}\\b`, "g");
			const next = result.replace(pattern, `(${constant.body})`);
			if (next !== result) {
				result = next;
				changed = true;
			}
		}
	}

	return result;
}

/**
 * Substitutes parameter values into a function body.
 */
function substituteParams(func: UserFunction, args: string[]): string | null {
	if (args.length !== func.params.length) return null;

	let result = func.body;

	// Sort params by length descending to replace longer names first
	const sortedParams = [...func.params].sort((a, b) => b.length - a.length);

	for (const param of sortedParams) {
		const arg = args[func.params.indexOf(param)]!;
		result = result.replace(new RegExp(`\\b${param}\\b`, "g"), `(${arg})`);
	}

	return result;
}

/**
 * Parses a semicolon-separated argument list, respecting nested parentheses.
 */
function parseArguments(argsStr: string): string[] | null {
	if (argsStr.trim() === "") return [];

	const args: string[] = [];
	let current = "";
	let depth = 0;

	for (const char of argsStr) {
		if (char === "(") {
			depth++;
			current += char;
		} else if (char === ")") {
			depth--;
			current += char;
		} else if (char === ";" && depth === 0) {
			args.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}

	if (depth !== 0) return null;
	if (current.trim()) args.push(current.trim());

	return args;
}

/**
 * Expands user function calls in an expression.
 */
export function expandUserFunctions(
	expression: string,
	functions: UserFunctionsMap,
	maxDepth: number = 10,
): string | null {
	if (maxDepth <= 0) return null;

	let result = expression;
	let changed = true;

	while (changed) {
		changed = false;

		for (const [name, func] of functions) {
			const callPattern = new RegExp(`\\b${name}\\s*\\(`, "g");
			let match: RegExpExecArray | null;

			while ((match = callPattern.exec(result)) !== null) {
				const startIdx = match.index;
				const argsStart = startIdx + match[0].length;

				// Find matching closing parenthesis
				let depth = 1;
				let endIdx = argsStart;
				while (endIdx < result.length && depth > 0) {
					if (result[endIdx] === "(") depth++;
					else if (result[endIdx] === ")") depth--;
					endIdx++;
				}

				if (depth !== 0) return null;

				const args = parseArguments(result.slice(argsStart, endIdx - 1));
				if (args === null) return null;

				const substituted = substituteParams(func, args);
				if (substituted === null) return null;

				result = result.slice(0, startIdx) + `(${substituted})` + result.slice(endIdx);
				changed = true;
				callPattern.lastIndex = 0;
				break;
			}
		}
	}

	return result;
}
