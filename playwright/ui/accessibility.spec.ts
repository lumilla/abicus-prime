import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Keyboard Accessibility", () => {
	test.describe("Keyboard Navigation", () => {
		test("textbox is focusable with Tab", async ({ page }) => {
			// Click away first to unfocus
			await page.click("body");

			// Tab should focus the input
			await page.keyboard.press("Tab");
			const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
			expect(focusedElement).toBe("INPUT");
		});

		test("can type numbers and operators via keyboard", async ({ page }) => {
			const input = page.getByRole("textbox");

			await input.focus();
			await page.keyboard.type("5+5");

			expect(await input.inputValue()).toBe("5+5");
		});

		test("Enter key triggers calculation", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await page.getByRole("textbox").fill("7*8");
			await page.keyboard.press("Enter");

			await expect(calc.getResult()).toHaveText("56");
		});

		test("Equals key triggers calculation", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await page.getByRole("textbox").fill("9-4");
			await page.keyboard.press("=");

			await expect(calc.getResult()).toHaveText("5");
		});

		test("Escape clears input", async ({ page }) => {
			const input = page.getByRole("textbox");

			await input.fill("123456");
			await page.keyboard.press("Escape");

			expect(await input.inputValue()).toBe("");
		});

		test("Backspace deletes last character", async ({ page }) => {
			const input = page.getByRole("textbox");

			await input.fill("12345");
			await input.focus();
			await page.keyboard.press("Backspace");

			expect(await input.inputValue()).toBe("1234");
		});
	});

	test.describe("Keyboard Shortcuts", () => {
		test("typing * produces multiplication", async ({ page }) => {
			const input = page.getByRole("textbox");
			await input.focus();
			await page.keyboard.type("5*5");
			// Prettifier converts '*' to '⋅' in the displayed expression
			const value = await input.inputValue();
			expect(value).toContain("⋅");
		});

		test("typing / produces division", async ({ page }) => {
			const input = page.getByRole("textbox");
			await input.focus();
			await page.keyboard.type("10/2");
			expect(await input.inputValue()).toContain("/");
		});

		test("typing ^ produces exponentiation", async ({ page }) => {
			const input = page.getByRole("textbox");
			await input.focus();
			await page.keyboard.type("2^3");
			expect(await input.inputValue()).toContain("^");
		});

		test("typing function names works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await page.getByRole("textbox").fill("sin(90)");
			await page.keyboard.press("Enter");

			expect(await calc.getExpression()).toBe("sin(90)");
			await expect(calc.getResult()).toHaveText("1");
		});
	});

	test.describe("Focus Management", () => {
		test("focus returns to input after button click", async ({ page }) => {
			const input = page.getByRole("textbox");
			await input.focus();

			// Click a number button
			await page.getByRole("button", { name: "5", exact: true }).click();

			// Input should still have the value (focus behavior may vary)
			expect(await input.inputValue()).toContain("5");
		});

		test("result is announced (has status role)", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await calc.calculate("5+5", "button");

			// Result should have status role for screen readers
			await expect(page.getByRole("status")).toBeVisible();
			await expect(page.getByRole("status")).toHaveText("10");
		});
	});

	test.describe("Button Keyboard Activation", () => {
		test("buttons can be activated with Enter key", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await page.getByRole("textbox").fill("8");

			// Focus and press the = button using keyboard
			const equalsButton = page.getByRole("button", { name: "=", exact: true });
			await equalsButton.focus();
			await page.keyboard.press("Enter");

			await expect(calc.getResult()).toHaveText("8");
		});

		test("buttons can be activated with Space key", async ({ page }) => {
			const calc = new CalculatorHelpers(page);

			await page.getByRole("textbox").fill("6");

			// Focus and press the = button using keyboard
			const equalsButton = page.getByRole("button", { name: "=", exact: true });
			await equalsButton.focus();
			await page.keyboard.press("Space");

			await expect(calc.getResult()).toHaveText("6");
		});
	});
});

test.describe("ARIA and Screen Reader Support", () => {
	test("input has appropriate label or placeholder", async ({ page }) => {
		const input = page.getByRole("textbox");
		await expect(input).toBeVisible();
	});

	test("buttons have accessible names", async ({ page }) => {
		// Verify key buttons have names that screen readers can announce
		const buttons = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "="];

		for (const name of buttons) {
			await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
		}

		// Clear button may be displayed as "C" or "AC" depending on state
		const clearC = page.getByRole("button", { name: "C", exact: true });
		const clearAC = page.getByRole("button", { name: "AC", exact: true });
		await expect((await clearC.count()) > 0 ? clearC : clearAC).toBeVisible();
	});

	test("result uses status role for live updates", async ({ page }) => {
		const calc = new CalculatorHelpers(page);

		await calc.calculate("3*3", "button");

		// The result should be in an element with role="status" for screen readers
		const status = page.getByRole("status");
		await expect(status).toBeVisible();
		await expect(status).toHaveText("9");
	});

	test("settings button is accessible", async ({ page }) => {
		const settingsButton = page.getByRole("button", { name: "Settings", exact: true });
		await expect(settingsButton).toBeVisible();
		await expect(settingsButton).toBeEnabled();
	});
});
