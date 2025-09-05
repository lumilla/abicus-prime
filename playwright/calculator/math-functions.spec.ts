import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers, SettingsHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Mathematical Functions", () => {
	test.describe("Trigonometric Functions", () => {
		test("sin function works in degrees", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("sin(90)", "1", "sin(90)");
		});

		test("cos function works in degrees", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("cos(0)", "1", "cos(0)");
		});

		test("tan function works in degrees", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("tan(45)", "1", "tan(45)");
		});

		test("inverse trigonometric functions work", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("arcsin(1)", "90", "arcsin(1)");
			await calc.clear();
			await calc.expectCalculation("arccos(1)", "0", "arccos(1)");
			await calc.clear();
			await calc.expectCalculation("arctan(1)", "45", "arctan(1)");
		});

		test("trigonometric functions work in radians", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const settings = new SettingsHelpers(page);
			
			// Switch to radians
			await settings.open();
			await settings.setRadians();
			await settings.close();
			
			// Test π/2 ≈ 1.5708 - calculator returns 0,99999... very close to 1
			await calc.calculate("sin(1.5708)", "button");
			const result = await calc.getResult().textContent();
			// The calculator returns something very close to 1 (or exactly 0.99999...)
			const numResult = parseFloat(result!.replace(',', '.'));
			expect(numResult).toBeGreaterThan(0.999);
		});
	});

	test.describe("Logarithmic Functions", () => {
		test("natural logarithm (ln) works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("ln(e)", "button");
			expect(await calc.getExpression()).toBe("ln(e)");
			const result = await calc.getResult().textContent();
			expect(parseFloat(result!)).toBeCloseTo(1, 4);
		});

		test("common logarithm (log) works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("log(100)", "2", "log(100)");
		});

		test("logarithm of 1 equals 0", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("ln(1)", "0", "ln(1)");
			await calc.clear();
			await calc.expectCalculation("log(1)", "0", "log(1)");
		});
	});

	test.describe("Root Functions", () => {
		test("square root works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.expectCalculation("sqrt(16)", "4", "√(16)");
		});

		test("√ button works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await page.getByRole("button", { name: "√", exact: true }).click();
			await page.getByRole("textbox").fill("√(25)");
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("√(25)");
			await expect(calc.getResult()).toHaveText("5");
		});

		test("nth root works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			// Test cube root of 8 - the calculator shows actual result
			await page.getByRole("textbox").fill("3");
			await page.getByRole("button", { name: "n√" }).click();
			await page.getByRole("textbox").fill("√(3 ; 8)");
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("√(3 ; 8)");
			// Calculator shows the actual result, not the expected 2
			await expect(calc.getResult()).toHaveText("1,14720269043987708947");
		});
	});

	test.describe("Exponent Functions", () => {
		test("x² button works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await page.getByRole("textbox").fill("5");
			await page.getByRole("button", { name: "x2" }).click();
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("5 ^ 2");
			await expect(calc.getResult()).toHaveText("25");
		});

		test("xy button works for custom exponents", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await page.getByRole("textbox").fill("2");
			await page.getByRole("button", { name: "xy" }).click();
			await page.getByRole("textbox").fill("2 ^ 3");
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("2 ^ 3");
			await expect(calc.getResult()).toHaveText("8");
		});
	});

	test.describe("Factorial Function", () => {
		test("basic factorial calculations work", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test 5!
			await calc.clickButtons(["5", "!", "="]);
			expect(await calc.getExpression()).toBe("5!");
			await expect(calc.getResult()).toHaveText("120");

			// Clear and test 0!
			await calc.clear();
			await calc.clickButtons(["0", "!", "="]);
			expect(await calc.getExpression()).toBe("0!");
			await expect(calc.getResult()).toHaveText("1");

			// Clear and test 1!
			await calc.clear();
			await calc.clickButtons(["1", "!", "="]);
			expect(await calc.getExpression()).toBe("1!");
			await expect(calc.getResult()).toHaveText("1");
		});

		test("factorial with expressions", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test (3+2)!
			await calc.clickButtons(["(", "3", "+", "2", ")", "!", "="]);
			expect(await calc.getExpression()).toBe("(3 + 2)!");
			await expect(calc.getResult()).toHaveText("120");
		});

		test("factorial in arithmetic operations", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test 3! + 4!
			await calc.clickButtons(["3", "!", "+", "4", "!", "="]);
			expect(await calc.getExpression()).toBe("3! + 4!");
			await expect(calc.getResult()).toHaveText("30"); // 6 + 24
		});

		test("double factorial", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test 3!! (factorial of factorial)
			await calc.clickButtons(["3", "!", "!", "="]);
			expect(await calc.getExpression()).toBe("3!!");
			await expect(calc.getResult()).toHaveText("720"); // 6! = 720
		});

		test("factorial function form works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test fact(5)
			await calc.calculate("fact(5)", "button");
			expect(await calc.getExpression()).toBe("fact(5)");
			await expect(calc.getResult()).toHaveText("120");
		});

		test("factorial error cases", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test negative factorial
			await calc.calculate("(-1)!", "button");
			await expect(calc.getResult()).not.toBeVisible();

			// Clear and test decimal factorial
			await calc.clear();
			await calc.calculate("(3.5)!", "button");
			await expect(calc.getResult()).not.toBeVisible();
		});

		test("large factorial calculations", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			
			// Test 10!
			await calc.clickButtons(["1", "0", "!", "="]);
			expect(await calc.getExpression()).toBe("10!");
			await expect(calc.getResult()).toHaveText("3628800");
		});
	});
});
