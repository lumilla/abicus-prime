import Decimal from "decimal.js";
import { err, ok } from "neverthrow";

import evaluate from "./internal/evaluator";
import tokenise from "./internal/tokeniser";
import { UserFunctionsMap, expandUserFunctions } from "#/state/user-functions";

export type { Token, TokenId } from "./internal/tokeniser";
export { tokenise, evaluate };

export type AngleUnit = "deg" | "rad";

export function calculate(
	expression: string,
	ans: Decimal,
	ind: Decimal,
	angleUnit: AngleUnit,
	userFunctions?: UserFunctionsMap,
) {
	// This could be a one-liner with neverthrow's `andThen` but we want to
	// jump out of neverthrow-land for React anyhow soon

	// Expand user-defined function calls before tokenizing
	let expandedExpression = expression;
	if (userFunctions && userFunctions.size > 0) {
		const expanded = expandUserFunctions(expression, userFunctions);
		if (expanded === null) {
			// Expansion failed (e.g., wrong argument count, recursion limit)
			return err({ type: "USER_FUNCTION_ERROR" as const });
		}
		expandedExpression = expanded;
	}

	const tokens = tokenise(expandedExpression);
	if (tokens.isErr()) return err(tokens);

	const result = evaluate(tokens.value, ans, ind, angleUnit);
	if (result.isErr()) return err(result); // Return evaluation error, not tokenisation error

	return ok(result.value);
}
