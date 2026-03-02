import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers, formatNumberForTest } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Basic Calculator Operations", () => {
	test.describe("Arithmetic Operations", () => {
		test("addition works correctly", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("5+3", "8", "5 + 3");
		});

		test("subtraction works correctly", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("10-4", "6", "10 − 4");
		});

		test("multiplication works correctly", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("6*7", "42", "6 ⋅ 7");
		});

		test("division works correctly", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("15/3", "5", "15 / 3");
		});

		test("exponentiation works correctly", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("2^3", "8", "2 ^ 3");
		});
	});

	test.describe("Order of Operations", () => {
		test("follows order of operations without parentheses", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("2+3*4", "14", "2 + 3 ⋅ 4");
		});

		test("respects parentheses", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("(2+3)*4", "20", "(2 + 3) ⋅ 4");
		});

		test("handles nested parentheses", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("2*((3+4)*5)", "70", "2 ⋅ ((3 + 4) ⋅ 5)");
		});

		test("handles complex expressions", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("2+3*4-1", "13", "2 + 3 ⋅ 4 − 1");
		});
	});

	test.describe("Constants", () => {
		test("π constant works in calculations", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await page.getByRole("textbox").fill("2*");
			await page.getByRole("button", { name: "π", exact: true }).click();
			await page.getByRole("button", { name: "=", exact: true }).click();

			expect(await calc.getExpression()).toBe("2 ⋅ π");
			// Calculator shows full precision with comma as decimal separator
			await expect(calc.getResult()).toHaveText(formatNumberForTest("6,28318530717958647693"));
		});

		test("e constant works in calculations", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await page.getByRole("textbox").fill("2*");
			await page.getByRole("button", { name: "e", exact: true }).click();
			await page.getByRole("button", { name: "=", exact: true }).click();

			expect(await calc.getExpression()).toBe("2 ⋅ e");
			// Calculator shows full precision with comma as decimal separator
			// I'm not exacctly sure if the rounding is exactly correct, so TODO: but ahh, can't be bothered to check right now
			await expect(calc.getResult()).toHaveText(formatNumberForTest("5,43656365691809047072"));
		});
	});

	test.describe("Clear Operations", () => {
		test("C button clears current input", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await page.getByRole("textbox").fill("5+5");
			await calc.clear();
			expect(await calc.getExpression()).toBe("");
		});

		test("⌫ button works for deletion", async ({ page }) => {
			await page.getByRole("textbox").fill("123");
			await page.getByRole("button", { name: "⌫" }).click();
			expect(await page.getByRole("textbox").inputValue()).toBe("12");
		});
	});
});
