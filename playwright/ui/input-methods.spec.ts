import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers, SettingsHelpers, SelectionHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Input Methods", () => {
	test.describe("Keyboard Input", () => {
		test("can calculate by pressing Enter", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("5*5", "enter");
			expect(await calc.getExpression()).toBe("5 ⋅ 5");
			await expect(calc.getResult()).toHaveText("25");
		});

		test("can calculate by pressing equals sign", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("sqrt(49)", "equals");
			expect(await calc.getExpression()).toBe("√(49)");
			await expect(calc.getResult()).toHaveText("7");
		});

		test("can calculate by clicking equals button", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			await calc.calculate("2^5", "button");
			expect(await calc.getExpression()).toBe("2 ^ 5");
			await expect(calc.getResult()).toHaveText("32");
		});

		test("degrees are selected by default", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const settings = new SettingsHelpers(page);

			// Test that trigonometric function uses degrees
			await calc.calculate("sin(90)", "equals");
			await expect(calc.getResult()).toHaveText("1");

			// Verify in settings page
			await settings.open();
			expect(await settings.isDegreesSelected()).toBe(true);
			expect(await settings.isRadiansSelected()).toBe(false);
		});

		test("can change to radians by switching in settings", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const settings = new SettingsHelpers(page);

			// Verify degrees is default
			await calc.calculate("sin(90)", "equals");
			await expect(calc.getResult()).toHaveText("1");

			// Clear and switch to radians
			await calc.clear();
			await settings.open();
			await settings.setRadians();
			await settings.close();

			// Test that trigonometric function now uses radians
			await calc.calculate("sin(1.5708)", "equals"); // π/2 ≈ 1.5708
			// Calculator shows high precision result close to 1
			await expect(calc.getResult()).toHaveText("0,999999999993253782134");
		});
	});

	test.describe("Text Selection Operations", () => {
		test("can wrap selection in brackets", async ({ page }) => {
			const selection = new SelectionHelpers(page);

			await page.getByRole("textbox").fill("5+5/2");
			await selection.selectRange(0, 3);
			await page.keyboard.press("(");
			expect(await page.getByRole("textbox").inputValue()).toBe("(5+5)/2");
		});

		test.describe("Operator Shortcuts", () => {
			const operators = [
				{ keyboard: "+", display: "+" },
				{ keyboard: "/", display: "/" },
				{ keyboard: "*", display: "⋅" },
				{ keyboard: "-", display: "−" },
			];

			for (const { keyboard, display } of operators) {
				test(`shortcut for "${display}" works with keyboard`, async ({ page }) => {
					const selection = new SelectionHelpers(page);
					await selection.testOperatorShortcut("5+5", 0, 3, keyboard, `(5+5) ${display} ()`, "keyboard");
				});

				test(`shortcut for "${display}" works with on-screen keypad`, async ({ page }) => {
					const selection = new SelectionHelpers(page);
					await selection.testOperatorShortcut("5+5", 0, 3, display, `(5+5) ${display} ()`, "button");
				});
			}

			test('shortcut for "^" works with keyboard', async ({ page }) => {
				const selection = new SelectionHelpers(page);
				await selection.testOperatorShortcut("5+5", 0, 3, "^", "(5+5) ^ ()", "keyboard");
			});

			test('shortcut for "^" works with xy button', async ({ page }) => {
				const selection = new SelectionHelpers(page);
				await selection.testOperatorShortcut("5+5", 0, 3, "xy", "(5+5) ^ ()", "button");
			});

			test('shortcut for "^2" works with x² button', async ({ page }) => {
				const selection = new SelectionHelpers(page);

				await page.getByRole("textbox").fill("5+5");
				await selection.selectRange(0, 3);
				await page.getByRole("button", { name: "x2", exact: true }).click();
				expect(await page.getByRole("textbox").inputValue()).toBe("(5+5) ^ 2");
			});

			test('shortcut for "ⁿ√" works with n√ button', async ({ page }) => {
				const selection = new SelectionHelpers(page);

				await page.getByRole("textbox").fill("5+5");
				await selection.selectRange(0, 3);
				await page.getByRole("button", { name: "n√", exact: true }).click();
				expect(await page.getByRole("textbox").inputValue()).toBe("√(5+5 ; )");
			});
		});

		test.describe("Function Application", () => {
			const functions = ["sin", "cos", "tan", "arcsin", "arccos", "arctan", "log", "ln", "√"];

			for (const functionName of functions) {
				test(`function "${functionName}" works with selection`, async ({ page }) => {
					const selection = new SelectionHelpers(page);
					await selection.testFunctionWithSelection("5+5", 0, 3, functionName, `${functionName}(5+5)`);
				});
			}
		});
	});
});
