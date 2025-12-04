import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers, SettingsHelpers, MemoryHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Settings - UI & Persistence", () => {
	test.describe("Decimal Separator Settings", () => {
		test("can switch decimal separator to dot", async ({ page }) => {
			const settings = new SettingsHelpers(page);
			const calc = new CalculatorHelpers(page);

			await settings.open();
			// Click the Dot selector: label is "Dot (.)"
			await page.getByRole("button", { name: "Dot (.)", exact: true }).click();
			await settings.close();

			// Test calculation with decimal using input that uses dot
			await calc.calculate("3.14 * 2", "button");
			const result = await calc.getResult().textContent();
			expect(result).toContain(".");
			expect(result).not.toContain(",");
		});

		test("decimal separator persists in localStorage", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();
			await page.getByRole("button", { name: "Dot (.)", exact: true }).click();
			await settings.close();

			const storedValue = await page.evaluate(() => localStorage.getItem("abicus-decimal-separator"));
			expect(storedValue).toBe(".");
		});

		test("decimal separator persists across page reloads", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();
			await page.getByRole("button", { name: "Dot (.)", exact: true }).click();
			await settings.close();

			await page.reload();

			await settings.open();
			// Dot button should now be disabled as it's the active choice
			await expect(page.getByRole("button", { name: "Dot (.)", exact: true })).toBeDisabled();
		});
	});

	test.describe("Theme Settings", () => {
		test("can switch to dark mode", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();
			await page.getByRole("button", { name: "Dark", exact: true }).click();
			await settings.close();

			// Verify dark mode was applied by checking class on document element
			const htmlClass = await page.evaluate(() => document.documentElement.classList.contains("dark"));
			expect(htmlClass).toBe(true);
		});

		test("can switch back to light mode", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			// Enable dark mode first
			await settings.open();
			await page.getByRole("button", { name: "Dark", exact: true }).click();
			await settings.close();

			// Switch back to light
			await settings.open();
			await page.getByRole("button", { name: "Light", exact: true }).click();
			await settings.close();

			const htmlClass = await page.evaluate(() => document.documentElement.classList.contains("dark"));
			expect(htmlClass).toBe(false);
		});

		test("dark mode persists in localStorage", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();
			await page.getByRole("button", { name: "Dark", exact: true }).click();
			await settings.close();

			const storedValue = await page.evaluate(() => localStorage.getItem("abicus-dark-mode"));
			expect(storedValue).toBe("true");
		});

		test("dark mode persists across page reloads", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();
			await page.getByRole("button", { name: "Dark", exact: true }).click();
			await settings.close();

			await page.reload();

			const htmlClass = await page.evaluate(() => document.documentElement.classList.contains("dark"));
			expect(htmlClass).toBe(true);
		});
	});

	test.describe("Font Size Settings", () => {
		test("can increase font size", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();

			// Read initial size from localStorage (should default to 16)
			const initialFontSize = await page.evaluate(() => localStorage.getItem("abicus-font-size") || "16");

			const increaseButton = page.getByRole("button", { name: "+", exact: true }).first();
			await increaseButton.click();
			await settings.close();

			const newFontSize = await page.evaluate(() => localStorage.getItem("abicus-font-size"));
			expect(parseInt(newFontSize || "16")).toBeGreaterThan(parseInt(initialFontSize));
		});

		test("can decrease font size", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			await settings.open();

			// Ensure we can increase first then decrease
			const increaseButton = page.getByRole("button", { name: "+", exact: true }).first();
			await increaseButton.click();
			await increaseButton.click();

			const increasedFontSize = await page.evaluate(() => localStorage.getItem("abicus-font-size") || "16");

			const decreaseButton = page.getByRole("button", { name: "−", exact: true }).first();
			await decreaseButton.click();
			await settings.close();

			const newFontSize = await page.evaluate(() => localStorage.getItem("abicus-font-size"));
			expect(parseInt(newFontSize || "16")).toBeLessThan(parseInt(increasedFontSize));
		});
	});

	test.describe("Clear Functions and Memory", () => {
		test("Clear All button clears expression and memory", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const settings = new SettingsHelpers(page);
			const memory = new MemoryHelpers(page);

			await memory.storeInMemory("42");

			// Now clear all using the Settings Clear All button
			await settings.open();
			await page.getByRole("button", { name: "Clear All", exact: true }).click();
			await settings.close();

			// Recall memory and compute result - memory should be cleared (should evaluate to 0)
			await memory.recallMemory();
			await page.getByRole("button", { name: "=", exact: true }).click();
			await expect(calc.getResult()).toHaveText("0");
		});
	});
});
