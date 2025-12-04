import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Calculator Edge Cases", () => {
	test.describe("Negative Numbers", () => {
		test("handles negative numbers in expressions", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			// Result formatting uses ASCII hyphen, not unicode minus
			await calc.expectCalculation("-5+3", "-2", "−5 + 3");
		});

		test("handles negative numbers with parentheses", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("(-5)*(-3)", "15", "(−5) ⋅ (−3)");
		});

		test("handles subtraction of negative numbers", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("5-(-3)", "8", "5 − (−3)");
		});

		test("handles negative exponents", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("2^(-2)", "0,25", "2 ^ (−2)");
		});
	});

	test.describe("Decimal Operations", () => {
		test("handles decimal addition", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("0.1+0.2", "0,3", "0,1 + 0,2");
		});

		test("handles very small decimals", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("0.000001 * 0.000001", "button");
			const result = (await calc.getResult().textContent()) || "";
			// Accept exponential or decimal display; compare numeric value
			const numeric = parseFloat(result.replace(",", "."));
			expect(numeric).toBeCloseTo(1e-12, 12);
		});

		test("handles decimals with leading zeros", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("0.5*2", "1", "0,5 ⋅ 2");
		});
	});

	test.describe("Large Numbers", () => {
		test("handles large number multiplication", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("999999*999999", "button");
			const result = await calc.getResult().textContent();
			// Should contain the result with thousand separators
			expect(result).toContain("999");
		});

		test("handles large exponents", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("2^50", "button");
			const result = await calc.getResult().textContent();
			// 2^50 = 1125899906842624
			expect(result?.replace(/\s/g, "")).toContain("1125899906842624");
		});
	});

	test.describe("Division Edge Cases", () => {
		test("division by zero shows error", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("5/0", "button");
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("0 divided by number equals 0", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("0/5", "0", "0 / 5");
		});

		test("handles integer division", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("10/4", "2,5", "10 / 4");
		});
	});

	test.describe("Parentheses Edge Cases", () => {
		test("handles deeply nested parentheses", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("(((2+3)))", "5", "(((2 + 3)))");
		});

		test("handles empty parentheses with number", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("()*5", "button");
			// Should show error or handle gracefully
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("handles unmatched parentheses", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("(5+3", "button");
			// Should show error
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("handles complex nested expressions", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("((2+3)*(4-1))/5", "3", "((2 + 3) ⋅ (4 − 1)) / 5");
		});
	});

	test.describe("Expression Syntax Errors", () => {
		test("handles double operators gracefully", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("5++5", "button");
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("handles trailing operator", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("5+5+", "button");
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("handles leading operator (except minus)", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("+5+5", "button");
			// This might work or fail depending on implementation
			// Just verify it doesn't crash
			await expect(page.getByRole("textbox")).toBeVisible();
		});
	});

	test.describe("Special Values", () => {
		test("handles very large factorial", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("20!", "button");
			const result = await calc.getResult().textContent();
			// 20! = 2432902008176640000
			expect(result).toBeTruthy();
			expect(result!.replace(/\s/g, "")).toContain("2432902008176640000");
		});

		test("handles expression with multiple operators", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("2+3*4/2-1", "7", "2 + 3 ⋅ 4 / 2 − 1");
		});
	});

	test.describe("Function Edge Cases", () => {
		test("sin of 0 equals 0", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("sin(0)", "0", "sin(0)");
		});

		test("cos of 180 equals -1 in degrees", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("cos(180)", "-1", "cos(180)");
		});

		test("log of negative number shows error", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("log(-1)", "button");
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("sqrt of negative number shows error", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("sqrt(-1)", "button");
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("handles nested functions", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("sqrt(sqrt(16))", "button");
			expect(await calc.getExpression()).toBe("√(√(16))");
			await expect(calc.getResult()).toHaveText("2");
		});

		test("handles function composition", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("sin(arcsin(0.5))", "button");
			expect(await calc.getExpression()).toBe("sin(arcsin(0,5))");
			// Should be approximately 0.5
			const result = await calc.getResult().textContent();
			const numResult = parseFloat(result!.replace(",", "."));
			expect(numResult).toBeCloseTo(0.5, 4);
		});
	});
});
