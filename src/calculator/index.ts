import Decimal from "decimal.js";
import { err, ok } from "neverthrow";

import evaluate from "./internal/evaluator";
import tokenise from "./internal/tokeniser";
import { UserFunctionsMap, UserConstantsMap, expandUserFunctions, expandUserConstants } from "#/state/user-functions";

export type { Token, TokenId } from "./internal/tokeniser";
export { tokenise, evaluate };

export type AngleUnit = "deg" | "rad";

export function calculate(
	expression: string,
	ans: Decimal,
	ind: Decimal,
	angleUnit: AngleUnit,
	userFunctions?: UserFunctionsMap,
	userConstants?: UserConstantsMap,
) {
	// This could be a one-liner with neverthrow's `andThen` but we want to
	// jump out of neverthrow-land for React anyhow soon

	let expandedExpression = expression;

	// Expand user-defined constants first, so function bodies can also reference constants
	if (userConstants && userConstants.size > 0) {
		const expanded = expandUserConstants(expression, userConstants);
		if (expanded === null) {
			return err({ type: "USER_FUNCTION_ERROR" as const });
		}
		expandedExpression = expanded;
	}

	// Expand user-defined function calls before tokenizing
	if (userFunctions && userFunctions.size > 0) {
		const expanded = expandUserFunctions(expandedExpression, userFunctions);
		if (expanded === null) {
			// Expansion failed (e.g., wrong argument count, recursion limit)
			return err({ type: "USER_FUNCTION_ERROR" as const });
		}
		expandedExpression = expanded;

		// After substituting function bodies we may have introduced constants,
		// so run the constant expansion once more on the new expression. This is
		// what allows things like `f(x)=tau*x` with `tau` defined as a constant
		// to work correctly.
		if (userConstants && userConstants.size > 0) {
			const reexpanded = expandUserConstants(expandedExpression, userConstants);
			if (reexpanded === null) {
				return err({ type: "USER_FUNCTION_ERROR" as const });
			}
			expandedExpression = reexpanded;
		}
	}

	const tokens = tokenise(expandedExpression);
	if (tokens.isErr()) return err(tokens);

	const result = evaluate(tokens.value, ans, ind, angleUnit);
	if (result.isErr()) return err(result); // Return evaluation error, not tokenisation error

	return ok(result.value);
}
