import { test, expect } from "@playwright/test";
import { setupPage, TerminalHelpers, SettingsHelpers, formatNumberForTest } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
	const terminal = new TerminalHelpers(page);
	await terminal.switchToTerminalMode();
});

test.describe("Terminal Mode", () => {
	test.describe("Basic Terminal Functionality", () => {
		test("switches to terminal mode correctly", async ({ page }) => {
			await expect(page.getByText(/^Abicus Prime Terminal v\d+\.\d+\.\d+$/)).toBeVisible();
			const terminal = new TerminalHelpers(page);
			await expect(terminal.getInput()).toBeVisible();
		});

		test("basic calculations work", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			await terminal.submitCalculation("5+5");
			await terminal.expectCalculationInHistory("5+5", "10");
		});

		test("complex calculations work", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			await terminal.submitCalculation("2^3 + sqrt(16)");
			await terminal.expectCalculationInHistory("2^3 + sqrt(16)", "12");
		});

		test("trigonometric calculations work", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			await terminal.submitCalculation("sin(90)");
			await terminal.expectCalculationInHistory("sin(90)", "1");
		});
	});

	test.describe("Input and History Management", () => {
		test("input clears after calculation", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.fill("5*5");
			await input.press("Enter");

			expect(await input.inputValue()).toBe("");

			// Verify something appears in history
			const historyItems = page.locator("div:has(span:has-text('▶'))");
			await expect(historyItems.first()).toBeVisible();
		});

		test("multiple calculations create ordered history", async ({ page }) => {
			const terminal = new TerminalHelpers(page);

			await terminal.submitCalculation("5+5");
			await terminal.submitCalculation("10*2");
			await terminal.submitCalculation("3^2");

			await terminal.expectCalculationInHistory("5+5", "10");
			await terminal.expectCalculationInHistory("10*2", "20");
			await terminal.expectCalculationInHistory("3^2", "9");

			// Verify order (first calculation should appear first)
			const expressions = page.locator("span:has-text('▶') + span");
			await expect(expressions.first()).toHaveText("5+5");
		});

		test("history navigation with arrow keys works", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			// Add calculations to history
			await terminal.submitCalculation("1+1");
			await terminal.submitCalculation("2+2");
			await terminal.submitCalculation("3+3");

			// Navigate up through history
			await input.press("ArrowUp");
			await expect(input).toHaveValue("3+3");

			await input.press("ArrowUp");
			await expect(input).toHaveValue("2+2");

			await input.press("ArrowUp");
			await expect(input).toHaveValue("1+1");

			// Navigate back down
			await input.press("ArrowDown");
			await expect(input).toHaveValue("2+2");

			await input.press("ArrowDown");
			await expect(input).toHaveValue("3+3");

			await input.press("ArrowDown");
			await expect(input).toHaveValue("");
		});
	});

	test.describe("Terminal Commands", () => {
		test("clear command clears history", async ({ page }) => {
			const terminal = new TerminalHelpers(page);

			await terminal.submitCalculation("1+1");
			await terminal.submitCalculation("2+2");

			// Verify history exists
			await expect(page.locator("text=1+1").first()).toBeVisible();
			await expect(page.locator("text=2+2").first()).toBeVisible();

			// Clear history
			await terminal.submitCalculation("clear");

			// History should be gone
			await expect(page.locator("text=1+1")).not.toBeVisible();
			await expect(page.locator("text=2+2")).not.toBeVisible();
		});

		test("cls command clears history", async ({ page }) => {
			const terminal = new TerminalHelpers(page);

			await terminal.submitCalculation("3+3");
			await expect(page.locator("text=3+3").first()).toBeVisible();

			await terminal.submitCalculation("cls");
			await expect(page.locator("text=3+3")).not.toBeVisible();
		});

		test("tab completion for clear command", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.fill("c");
			await input.press("Tab");
			await expect(input).toHaveValue("clear");

			// Test with 'cl'
			await input.fill("cl");
			await input.press("Tab");
			await expect(input).toHaveValue("clear");
		});
	});

	test.describe("Keyboard Shortcuts", () => {
		test("escape clears current input", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.fill("5+5+5");
			expect(await input.inputValue()).toBe("5+5+5");

			await input.press("Escape");
			expect(await input.inputValue()).toBe("");
		});

		test("ctrl+k clears current input", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.fill("some expression");
			await input.press("Control+k");
			await expect(input).toHaveValue("");
		});

		test("ctrl+n clears terminal history", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await terminal.submitCalculation("5*5");
			await terminal.submitCalculation("6*6");

			await expect(page.locator("text=5*5").first()).toBeVisible();
			await expect(page.locator("text=6*6").first()).toBeVisible();

			await input.press("Control+n");

			await expect(page.locator("text=5*5")).not.toBeVisible();
			await expect(page.locator("text=6*6")).not.toBeVisible();
		});
	});

	test.describe("Advanced Features", () => {
		test("ANS memory works", async ({ page }) => {
			const terminal = new TerminalHelpers(page);

			await terminal.submitCalculation("8*9");
			await terminal.expectCalculationInHistory("8*9", "72");

			await terminal.submitCalculation("ANS + 10");
			await terminal.expectCalculationInHistory("ANS + 10", "82");
		});

		test("constants work", async ({ page }) => {
			const terminal = new TerminalHelpers(page);

			await terminal.submitCalculation("pi * 2");
			await expect(page.locator("text=pi * 2").first()).toBeVisible();
			// Result should contain pi*2 value (approximately 6.28)
			await expect(page.locator(`text=${formatNumberForTest("6,28318530717958647693")}`).first()).toBeVisible();
		});

		test("double-click expression copies to input", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await terminal.submitCalculation("2*3");
			await expect(page.locator("text== 6").first()).toBeVisible();

			await page.locator("text=2*3").first().dblclick();
			await expect(input).toHaveValue("2*3");
		});

		test("double-click result copies clean value to input", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await terminal.submitCalculation("4*5");
			await expect(page.locator("text== 20").first()).toBeVisible();

			await page.locator("text== 20").first().dblclick();
			await expect(input).toHaveValue("20");
		});
	});

	test.describe("Error Handling", () => {
		test("invalid expression shows error in preview and cannot be submitted", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.fill("5++5");
			// Preview should show error
			await expect(page.locator("text=Error").first()).toBeVisible();

			// Try to submit
			await input.press("Enter");

			// The error expression should NOT appear in history
			await expect(page.locator("span:has-text('▶') + span").first()).not.toBeVisible();
		});

		test("division by zero shows error in preview and cannot be submitted", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.fill("5/0");
			// Preview should show error
			await expect(page.locator("text=Error").first()).toBeVisible();

			// Try to submit
			await input.press("Enter");

			// The division by zero expression should NOT appear in history
			await expect(page.locator("text=5/0")).not.toBeVisible();
		});

		test("empty input does nothing", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			await input.press("Enter");
			// No history should be created
			await expect(page.locator("span:has-text('▶') + span").first()).not.toBeVisible();
		});

		test("valid expressions can be submitted normally", async ({ page }) => {
			const terminal = new TerminalHelpers(page);

			await terminal.submitCalculation("5+5");
			await terminal.expectCalculationInHistory("5+5", "10");
		});
	});

	test.describe("Settings Integration", () => {
		test("angle unit setting affects calculations", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const settings = new SettingsHelpers(page);

			// Test degrees (default)
			await terminal.submitCalculation("cos(60)");
			await expect(page.locator("text=0,5").first()).toBeVisible();

			// Change to radians
			await settings.open();
			await settings.setRadians();
			await settings.close();

			// Test radians
			await terminal.submitCalculation("cos(1)");
			await expect(page.locator(".ml-3").last()).toContainText(formatNumberForTest("0,5403"));
		});
	});

	test.describe("Mode Switching", () => {
		test("can switch back to pocket mode", async ({ page }) => {
			const settings = new SettingsHelpers(page);
			const terminal = new TerminalHelpers(page);

			await settings.open();
			await settings.setPocketMode();
			await settings.close();

			// Should see pocket mode interface
			await expect(page.getByRole("textbox")).toBeVisible();
			await expect(page.getByRole("button", { name: "=" })).toBeVisible();
			await expect(terminal.getInput()).not.toBeVisible();
		});

		test("terminal calculation persists when switching to pocket mode", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const settings = new SettingsHelpers(page);

			await terminal.submitCalculation("1+1");
			await expect(page.locator("text== 2").first()).toBeVisible();

			// Switch to pocket mode
			await settings.open();
			await settings.setPocketMode();
			await settings.close();

			// Pocket mode should show the result
			const pocketInput = page.getByRole("textbox");
			await expect(pocketInput).toHaveValue("1 + 1");
			await expect(page.getByRole("status")).toHaveText("2");
		});

		test("terminal state persists across mode switches", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const settings = new SettingsHelpers(page);

			await terminal.submitCalculation("10+10");
			await expect(page.locator("text=10+10").first()).toBeVisible();

			// Switch to pocket mode and back
			await settings.open();
			await settings.setPocketMode();
			await settings.setTerminalMode();
			await settings.close();

			// History should still be there
			await expect(page.locator("text=10+10").first()).toBeVisible();
			await expect(page.locator("text=20").first()).toBeVisible();
		});
	});

	test.describe("Live Preview", () => {
		test("shows live preview while typing", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			// Type an expression
			await input.fill("5+5");

			// Preview should show the result
			await expect(page.locator("text=10").first()).toBeVisible();

			// Modify the expression
			await input.fill("5+5*2");

			// Preview should update to show new result
			await expect(page.locator("text=15").first()).toBeVisible();
		});

		test("clears preview when input is empty", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			// Type and verify preview appears
			await input.fill("10*3");
			await expect(page.locator("text=30").first()).toBeVisible();

			// Clear input
			await input.fill("");

			// Preview should disappear (check that 30 is not visible in preview area)
			// Since the preview is positioned above input, we can check it's not there
			const previewArea = page.locator("form").locator("..").locator("div").first();
			await expect(previewArea.locator("text=30")).not.toBeVisible();
		});

		test("shows error in preview for invalid expressions", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			// Type invalid expression
			await input.fill("5++5");

			// Preview should show error
			await expect(page.locator("text=Error").first()).toBeVisible();
		});

		test("preview updates with memory operations", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const input = terminal.getInput();

			// First establish ANS value
			await terminal.submitCalculation("20");
			await terminal.expectCalculationInHistory("20", "20");

			// Now type expression using ANS
			await input.fill("ANS + 5");

			// Preview should show the correct result
			await expect(page.locator("text=25").first()).toBeVisible();
		});

		test("preview respects angle unit settings", async ({ page }) => {
			const terminal = new TerminalHelpers(page);
			const settings = new SettingsHelpers(page);
			const input = terminal.getInput();

			// Test in degrees (default)
			await input.fill("sin(90)");
			await expect(page.locator("text=1").first()).toBeVisible();

			// Change to radians
			await settings.open();
			await settings.setRadians();
			await settings.close();

			// Preview should update to radians calculation
			await input.fill("sin(1.5708)"); // π/2 in radians ≈ 1.5708
			await expect(page.locator("text=1").first()).toBeVisible();
		});
	});
});
