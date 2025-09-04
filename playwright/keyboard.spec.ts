import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Crunch by pressing Enter on keyboard", async ({ page }) => {
	await page.getByRole("textbox").fill("5*5");
	await page.keyboard.press("Enter");
	expect(await page.getByRole("textbox").inputValue()).toBe("5 × 5");
	expect(page.getByRole("status")).toHaveText("25");
});

test("Crunch by pressing Equals sign on keyboard", async ({ page }) => {
	await page.getByRole("textbox").fill("sqrt(49)");
	await page.keyboard.press("=");
	expect(await page.getByRole("textbox").inputValue()).toBe("√(49)");
	expect(page.getByRole("status")).toHaveText("7");
});

test("Crunch by clicking Equals sign on the on-screen keypad", async ({ page }) => {
	await page.getByRole("textbox").fill("2^5");
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("2 ^ 5");
	expect(page.getByRole("status")).toHaveText("32");
});

test("Degrees are selected by default", async ({ page }) => {
	// Check that degrees is default by testing trigonometric function
	await page.getByRole("textbox").fill("sin(90)");
	await page.keyboard.press("=");
	await expect(page.getByRole("status")).toHaveText("1");
	
	// Also verify in settings page
	await page.getByRole("button", { name: "*", exact: true }).click();
	await expect(page.getByRole("button", { name: "Degrees", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Radians", exact: true })).not.toBeDisabled();
});

test("Can change to radians by pressing tab", async ({ page }) => {
	// Verify degrees is default
	await page.getByRole("textbox").fill("sin(90)");
	await page.keyboard.press("=");
	await expect(page.getByRole("status")).toHaveText("1");
	
	// Clear the result
	await page.keyboard.press("Escape");
	
	// Change to radians via settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Radians", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click(); // Close settings
	
	// Test with radians
	await page.getByRole("textbox").fill("sin(pi/2)");
	await page.keyboard.press("=");
	await expect(page.getByRole("status")).toHaveText("1");
});

test("Can clear the screen with Escape", async ({ page }) => {
	await page.getByRole("textbox").fill("2^5");
	expect(await page.getByRole("textbox").inputValue()).toBe("2^5");
	await page.keyboard.press("Escape");
	expect(await page.getByRole("textbox").inputValue()).toBe("");
});
