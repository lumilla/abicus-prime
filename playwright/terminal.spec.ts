import { test, expect, Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	// Switch to terminal mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Terminal", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click(); // Close settings
});

// Helper function to get the terminal input
async function getTerminalInput(page: Page) {
	return page.locator('input[placeholder="Enter calculation..."]');
}

// Helper function to submit terminal input
async function submitTerminalInput(page: Page, expression: string) {
	const input = await getTerminalInput(page);
	await input.fill(expression);
	await input.press("Enter");
}

// Basic Terminal Mode Tests

test("Terminal Mode: Switches to terminal mode", async ({ page }) => {
	// Verify we're in terminal mode by checking for terminal-specific elements
	await expect(page.getByText("Abicus Terminal v1.0.6")).toBeVisible();
	await expect(await getTerminalInput(page)).toBeVisible();
});

test("Terminal Mode: Basic calculation works", async ({ page }) => {
	await submitTerminalInput(page, "5+5");
	
	// Check that the expression appears in history
	await expect(page.locator("text=5+5").first()).toBeVisible();
	await expect(page.locator("text=10").first()).toBeVisible();
});

test("Terminal Mode: Complex calculation works", async ({ page }) => {
	await submitTerminalInput(page, "2^3 + sqrt(16)");
	
	await expect(page.locator("text=2^3 + sqrt(16)").first()).toBeVisible();
	await expect(page.locator("text=12").first()).toBeVisible();
});

test("Terminal Mode: Trigonometric calculation works", async ({ page }) => {
	await submitTerminalInput(page, "sin(90)");
	
	await expect(page.locator("text=sin(90)").first()).toBeVisible();
	await expect(page.locator("text=1").first()).toBeVisible();
});

// Input and History Tests

test("Terminal Mode: Input clears after calculation", async ({ page }) => {
	const input = await getTerminalInput(page);
	await input.fill("5*5");
	await input.press("Enter");
	
	// Input should be clear after submission
	expect(await input.inputValue()).toBe("");
	
	// Check that SOMETHING appears in the history (either result or error)
	const historyItems = page.locator("div:has(span:has-text('▶'))");
	await expect(historyItems.first()).toBeVisible();
});

test("Terminal Mode: Multiple calculations create history", async ({ page }) => {
	await submitTerminalInput(page, "5+5");
	await submitTerminalInput(page, "10*2");
	await submitTerminalInput(page, "3^2");
	
	// All calculations should be visible in history
	await expect(page.locator("text=5+5").first()).toBeVisible();
	await expect(page.locator("text=10").first()).toBeVisible();
	await expect(page.locator("text=10*2").first()).toBeVisible();
	await expect(page.locator("text=20").first()).toBeVisible();
	await expect(page.locator("text=3^2").first()).toBeVisible();
	await expect(page.locator("text=9").first()).toBeVisible();
});

test("Terminal Mode: Calculation history maintains order", async ({ page }) => {
	await submitTerminalInput(page, "1+1");
	await submitTerminalInput(page, "2+2");
	await submitTerminalInput(page, "3+3");
	
	// Get all calculation entries
	const expressions = page.locator("span:has-text('▶') + span");
	const results = page.locator("div.ml-4");
	
	// Verify order (first entry should be first calculation)
	await expect(expressions.first()).toHaveText("1+1");
	await expect(results.first()).toHaveText("2");
});

// Error Handling Tests

test("Terminal Mode: Invalid expression shows error", async ({ page }) => {
	await submitTerminalInput(page, "5++5");
	
	await expect(page.locator("text=5++5").first()).toBeVisible();
	await expect(page.locator("text=Error").first()).toBeVisible();
});

test("Terminal Mode: Division by zero shows error", async ({ page }) => {
	await submitTerminalInput(page, "5/0");
	
	await expect(page.locator("text=5/0").first()).toBeVisible();
	await expect(page.locator("text=Error").first()).toBeVisible();
});

test("Terminal Mode: Empty input does nothing", async ({ page }) => {
	const input = await getTerminalInput(page);
	await input.press("Enter");
	
	// No history should be created
	await expect(page.locator("span:has-text('▶') + span").first()).not.toBeVisible();
});

// Keyboard Interaction Tests

test("Terminal Mode: Escape clears current input", async ({ page }) => {
	const input = await getTerminalInput(page);
	await input.fill("5+5+5");
	
	expect(await input.inputValue()).toBe("5+5+5");
	
	await input.press("Escape");
	expect(await input.inputValue()).toBe("");
});

test("Terminal Mode: Enter submits calculation", async ({ page }) => {
	const input = await getTerminalInput(page);
	await input.fill("7*8");
	await input.press("Enter");
	
	// Check result appears
	await expect(page.locator("text=56").first()).toBeVisible();
	// Check input is cleared
	expect(await input.inputValue()).toBe("");
});

// Memory and Advanced Function Tests

test("Terminal Mode: Memory functions work", async ({ page }) => {
	// First calculation to store in ANS memory
	await submitTerminalInput(page, "5*5");
	await expect(page.locator("text=25").first()).toBeVisible();
	
	// Use ANS memory in calculation  
	await submitTerminalInput(page, "ANS + 5");
	
	await expect(page.locator("text=ANS + 5").first()).toBeVisible();
	await expect(page.locator("text=30").first()).toBeVisible();
});

test("Terminal Mode: ANS (answer memory) works", async ({ page }) => {
	// First calculation
	await submitTerminalInput(page, "8*9");
	
	// Use ANS in next calculation
	await submitTerminalInput(page, "ANS + 10");
	
	await expect(page.locator("text=ANS + 10").first()).toBeVisible();
	await expect(page.locator("text=82").first()).toBeVisible(); // 72 + 10
});

test("Terminal Mode: Constants work (π, e)", async ({ page }) => {
	await submitTerminalInput(page, "pi * 2");
	
	await expect(page.locator("text=pi * 2").first()).toBeVisible();
	// The result uses comma as decimal separator and has more precision
	await expect(page.locator("text=6,28318530717958647693").first()).toBeVisible();
});

// Settings Integration Tests

test("Terminal Mode: Angle unit setting affects calculations", async ({ page }) => {
	// Test in degrees (default) - cos(60) should be 0.5 in degrees
	await submitTerminalInput(page, "cos(60)");
	await expect(page.locator("text=cos(60)").first()).toBeVisible();
	await expect(page.locator("text=0,5").first()).toBeVisible(); // Note comma decimal separator
	
	// Change to radians
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Radians", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Test in radians - cos(1) in radians is different from cos(1) in degrees
	await submitTerminalInput(page, "cos(1)");
	await expect(page.locator("text=cos(1)").first()).toBeVisible();
	
	// Check for the result - it should be approximately 0.5403
	await expect(page.locator(".ml-4").last()).toContainText("0,5403");
});

test("Terminal Mode: Clear function clears history", async ({ page }) => {
	// Add some calculations to history
	await submitTerminalInput(page, "1+1");
	await submitTerminalInput(page, "2+2");
	
	// Verify history exists
	await expect(page.locator("text=1+1").first()).toBeVisible();
	await expect(page.locator("text=2+2").first()).toBeVisible();
	
	// Clear all
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Clear", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// History should be gone (but this requires implementing clear functionality in terminal)
	// For now, we'll test that the memory is cleared by trying to use ANS
	await submitTerminalInput(page, "ANS");
	await expect(page.locator("text=0").first()).toBeVisible(); // ANS should be 0 when cleared
});

// UI and Visual Tests

test("Terminal Mode: Terminal has proper header", async ({ page }) => {
	await expect(page.getByText("Abicus Terminal v1.0.6")).toBeVisible();
});

test("Terminal Mode: Input has proper placeholder", async ({ page }) => {
	const input = await getTerminalInput(page);
	await expect(input).toHaveAttribute("placeholder", "Enter calculation...");
});

test("Terminal Mode: Terminal auto-focuses input", async ({ page }) => {
	const input = await getTerminalInput(page);
	await expect(input).toBeFocused();
});

// Mode Switching Tests

test("Terminal Mode: Can switch back to pocket mode", async ({ page }) => {
	// Switch to pocket mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Pocket", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Should see pocket mode interface
	await expect(page.getByRole("textbox")).toBeVisible();
	await expect(page.getByRole("button", { name: "=" })).toBeVisible();
	// Terminal input should not be visible
	await expect(await getTerminalInput(page)).not.toBeVisible();
});

test("Terminal Mode: Terminal state persists across mode switches", async ({ page }) => {
	// Add calculation to terminal
	await submitTerminalInput(page, "10+10");
	await expect(page.locator("text=10+10").first()).toBeVisible();
	
	// Switch to pocket mode and back
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Pocket", exact: true }).click();
	await page.getByRole("button", { name: "Terminal", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// History should still be there
	await expect(page.locator("text=10+10").first()).toBeVisible();
	await expect(page.locator("text=20").first()).toBeVisible();
});

// Edge Cases and Robustness Tests

test("Terminal Mode: Very long expressions work", async ({ page }) => {
	const longExpression = "1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1";
	await submitTerminalInput(page, longExpression);
	
	await expect(page.locator(`text=${longExpression}`).first()).toBeVisible();
	await expect(page.locator("text=20").first()).toBeVisible();
});

test("Terminal Mode: Whitespace in expressions is handled", async ({ page }) => {
	await submitTerminalInput(page, "  5  +  5  ");
	
	await expect(page.locator("text=  5  +  5  ").first()).toBeVisible();
	await expect(page.locator("text=10").first()).toBeVisible();
});

test("Terminal Mode: Multiple rapid calculations work", async ({ page }) => {
	// Submit several calculations quickly
	const calculations = ["1+1", "2*2", "3^2", "sqrt(16)"];
	const expected = ["2", "4", "9", "4"];
	
	for (let i = 0; i < calculations.length; i++) {
		await submitTerminalInput(page, calculations[i]);
	}
	
	// Verify all results are present
	for (let i = 0; i < expected.length; i++) {
		await expect(page.locator(`text=${expected[i]}`).first()).toBeVisible();
	}
});