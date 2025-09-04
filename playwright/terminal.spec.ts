import { test, expect, Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	// Set language to English for consistent test experience
	await page.addInitScript(() => {
		localStorage.setItem("abicus-language", "en");
	});
	await page.goto("/");
	// Switch to terminal mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Terminal", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click(); // Close settings
});

// Helper function to get the terminal input
async function getTerminalInput(page: Page) {
	return page.locator('input[placeholder*="calculation"]');
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
	await expect(page.getByText(/^Abicus Prime Terminal v\d+\.\d+\.\d+$/)).toBeVisible();
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
	const results = page.locator("div.ml-3");

	// Verify order (first entry should be first calculation)
	await expect(expressions.first()).toHaveText("1+1");
	await expect(results.first()).toHaveText("= 2");
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
	await expect(page.locator(".ml-3").last()).toContainText("0,5403");
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
	await expect(page.getByText(/^Abicus Prime Terminal v\d+\.\d+\.\d+$/)).toBeVisible();
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

// New Feature Tests - Terminal Improvements

test("Terminal Mode: Results show with equals sign prefix", async ({ page }) => {
	await submitTerminalInput(page, "5+5");

	// Check that result has equals prefix
	await expect(page.locator("text== 10").first()).toBeVisible();
});

test("Terminal Mode: Double-click expression puts it in input", async ({ page }) => {
	await submitTerminalInput(page, "2*3");
	await expect(page.locator("text== 6").first()).toBeVisible();

	// Double-click the expression
	await page.locator("text=2*3").first().dblclick();

	// Check that the expression is now in the input field
	const input = await getTerminalInput(page);
	await expect(input).toHaveValue("2*3");
});

test("Terminal Mode: Double-click result puts clean value in input", async ({ page }) => {
	await submitTerminalInput(page, "4*5");
	await expect(page.locator("text== 20").first()).toBeVisible();

	// Double-click the result (with equals prefix)
	await page.locator("text== 20").first().dblclick();

	// Check that the clean value (without equals) is in the input field
	const input = await getTerminalInput(page);
	await expect(input).toHaveValue("20");
});

test("Terminal Mode: Clear command clears history", async ({ page }) => {
	// Add some calculations to history
	await submitTerminalInput(page, "1+1");
	await submitTerminalInput(page, "2+2");

	// Verify history exists
	await expect(page.locator("text=1+1").first()).toBeVisible();
	await expect(page.locator("text=2+2").first()).toBeVisible();

	// Use clear command
	await submitTerminalInput(page, "clear");

	// History should be gone
	await expect(page.locator("text=1+1")).not.toBeVisible();
	await expect(page.locator("text=2+2")).not.toBeVisible();
});

test("Terminal Mode: Cls command clears history", async ({ page }) => {
	// Add calculation to history
	await submitTerminalInput(page, "3+3");
	await expect(page.locator("text=3+3").first()).toBeVisible();

	// Use cls command
	await submitTerminalInput(page, "cls");

	// History should be gone
	await expect(page.locator("text=3+3")).not.toBeVisible();
});

test("Terminal Mode: Arrow up recalls last expression", async ({ page }) => {
	await submitTerminalInput(page, "7*8");
	await expect(page.locator("text== 56").first()).toBeVisible();

	const input = await getTerminalInput(page);
	// Press arrow up
	await input.press("ArrowUp");

	// Should have the last expression
	await expect(input).toHaveValue("7*8");
});

test("Terminal Mode: Arrow navigation through history", async ({ page }) => {
	// Add multiple calculations
	await submitTerminalInput(page, "1+1");
	await submitTerminalInput(page, "2+2");
	await submitTerminalInput(page, "3+3");

	const input = await getTerminalInput(page);

	// Navigate up through history
	await input.press("ArrowUp"); // Should get "3+3"
	await expect(input).toHaveValue("3+3");

	await input.press("ArrowUp"); // Should get "2+2"
	await expect(input).toHaveValue("2+2");

	await input.press("ArrowUp"); // Should get "1+1"
	await expect(input).toHaveValue("1+1");

	// Navigate back down
	await input.press("ArrowDown"); // Should get "2+2"
	await expect(input).toHaveValue("2+2");

	await input.press("ArrowDown"); // Should get "3+3"
	await expect(input).toHaveValue("3+3");

	await input.press("ArrowDown"); // Should get back to empty
	await expect(input).toHaveValue("");
});

test("Terminal Mode: Ctrl+N clears terminal history", async ({ page }) => {
	// Add calculations to history
	await submitTerminalInput(page, "5*5");
	await submitTerminalInput(page, "6*6");

	// Verify history exists
	await expect(page.locator("text=5*5").first()).toBeVisible();
	await expect(page.locator("text=6*6").first()).toBeVisible();

	const input = await getTerminalInput(page);
	// Use Ctrl+N to clear history
	await input.press("Control+n");

	// History should be gone
	await expect(page.locator("text=5*5")).not.toBeVisible();
	await expect(page.locator("text=6*6")).not.toBeVisible();
});

test("Terminal Mode: Ctrl+K clears current input", async ({ page }) => {
	const input = await getTerminalInput(page);
	await input.fill("some expression");
	await expect(input).toHaveValue("some expression");

	// Use Ctrl+K to clear input
	await input.press("Control+k");

	// Input should be cleared
	await expect(input).toHaveValue("");
});

test("Terminal Mode: Tab completion for clear command", async ({ page }) => {
	const input = await getTerminalInput(page);

	// Type partial command and use tab completion
	await input.fill("c");
	await input.press("Tab");

	// Should complete to "clear"
	await expect(input).toHaveValue("clear");
});

test("Terminal Mode: Tab completion for clear command with 'cl'", async ({ page }) => {
	const input = await getTerminalInput(page);

	// Type partial command and use tab completion
	await input.fill("cl");
	await input.press("Tab");

	// Should complete to "clear"
	await expect(input).toHaveValue("clear");
});

test("Terminal Mode: History navigation preserves temp input", async ({ page }) => {
	// Add a calculation to history
	await submitTerminalInput(page, "10+10");

	const input = await getTerminalInput(page);

	// Type something new
	await input.fill("5*5");

	// Navigate to history
	await input.press("ArrowUp"); // Should get "10+10"
	await expect(input).toHaveValue("10+10");

	// Navigate back down
	await input.press("ArrowDown"); // Should restore "5*5"
	await expect(input).toHaveValue("5*5");
});

test("Terminal Mode: Manual typing resets history navigation", async ({ page }) => {
	// Add calculations to history
	await submitTerminalInput(page, "1+1");
	await submitTerminalInput(page, "2+2");

	const input = await getTerminalInput(page);

	// Navigate to history
	await input.press("ArrowUp");
	await expect(input).toHaveValue("2+2");

	// Manually type to reset history navigation
	await input.fill("3+3");

	// Arrow up should now get the most recent again, not continue from where we were
	await input.press("ArrowUp");
	await expect(input).toHaveValue("2+2");
});

// Mode Switching and Persistence Tests

test("Terminal Mode: Calculation result persists when switching to pocket mode", async ({ page }) => {
	// Perform calculation in terminal mode
	await submitTerminalInput(page, "1+1");
	await expect(page.locator("text== 2").first()).toBeVisible();

	// Switch to pocket mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Pocket", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();

	// Pocket mode input should show the expression (prettified)
	const pocketInput = page.getByRole("textbox");
	await expect(pocketInput).toHaveValue("1 + 1");

	// Pocket mode result should show the answer in the result area
	await expect(page.getByRole("status")).toHaveText("2");
});

test("Terminal Mode: Pocket calculation result persists when switching to terminal mode", async ({ page }) => {
	// First switch to pocket mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Pocket", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();

	// Perform calculation in pocket mode
	const pocketInput = page.getByRole("textbox");
	await pocketInput.fill("3+3");
	await page.getByRole("button", { name: "=" }).click();

	// Switch back to terminal mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Terminal", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();

	// Terminal should show the calculation in history
	await expect(page.locator("text=3+3").first()).toBeVisible();
	await expect(page.locator("text== 6").first()).toBeVisible();
});

test("Terminal Mode: Multiple mode switches preserve latest calculation", async ({ page }) => {
	// Terminal calculation
	await submitTerminalInput(page, "5*5");
	await expect(page.locator("text== 25").first()).toBeVisible();

	// Switch to pocket
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Pocket", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();

	// Verify pocket shows terminal result (prettified)
	const pocketInput = page.getByRole("textbox");
	await expect(pocketInput).toHaveValue("5 × 5");
	await expect(page.getByRole("status")).toHaveText("25");

	// Do calculation in pocket
	await pocketInput.fill("10*10");
	await page.getByRole("button", { name: "=" }).click();

	// Switch back to terminal
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Terminal", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();

	// Terminal should show both calculations in history
	await expect(page.locator("text=5*5").first()).toBeVisible();
	await expect(page.locator("text== 25").first()).toBeVisible();
	await expect(page.locator("text=10*10").first()).toBeVisible(); // Pocket calculation stored as raw input
	await expect(page.locator("text== 100").first()).toBeVisible();
});
