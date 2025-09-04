import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	// Set language to English for consistent test experience
	await page.addInitScript(() => {
		localStorage.setItem("abicus-language", "en");
	});
	await page.goto("/");
});

test("Basic factorial calculations work", async ({ page }) => {
	// Test 5!
	await page.getByRole("button", { name: "5" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("5!");
	expect(page.getByRole("status")).toHaveText("120");

	// Clear and test 0!
	await page.getByRole("button", { name: "C", exact: true }).click();
	await page.getByRole("button", { name: "0" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("0!");
	expect(page.getByRole("status")).toHaveText("1");

	// Clear and test 1!
	await page.getByRole("button", { name: "C", exact: true }).click();
	await page.getByRole("button", { name: "1" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("1!");
	expect(page.getByRole("status")).toHaveText("1");
});

test("Factorial with expressions", async ({ page }) => {
	// Test (3+2)!
	await page.getByRole("button", { name: "(" }).click();
	await page.getByRole("button", { name: "3" }).click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByRole("button", { name: "2", exact: true }).click();
	await page.getByRole("button", { name: ")" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("(3 + 2)!");
	expect(page.getByRole("status")).toHaveText("120");
});

test("Factorial in arithmetic operations", async ({ page }) => {
	// Test 3! + 4!
	await page.getByRole("button", { name: "3" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "+" }).click();
	await page.getByRole("button", { name: "4" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("3! + 4!");
	expect(page.getByRole("status")).toHaveText("30"); // 6 + 24
});

test("Double factorial", async ({ page }) => {
	// Test 3!! (factorial of factorial)
	await page.getByRole("button", { name: "3" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("3!!");
	expect(page.getByRole("status")).toHaveText("720"); // 6! = 720
});

test("Factorial function form works", async ({ page }) => {
	// Test fact(5)
	await page.getByRole("textbox").fill("fact(5)");
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("fact(5)");
	expect(page.getByRole("status")).toHaveText("120");
});

test("Factorial error cases", async ({ page }) => {
	// Test negative factorial - need parentheses to group the negative number
	await page.getByRole("textbox").fill("(-1)!");
	await page.getByRole("button", { name: "=" }).click();
	// When there's an error, the result status should not be visible
	await expect(page.getByRole("status")).not.toBeVisible();

	// Clear and test decimal factorial
	await page.getByRole("button", { name: "C", exact: true }).click();
	await page.getByRole("textbox").fill("(3.5)!");
	await page.getByRole("button", { name: "=" }).click();
	// When there's an error, the result status should not be visible
	await expect(page.getByRole("status")).not.toBeVisible();
});

test("Large factorial calculations", async ({ page }) => {
	// Test 10!
	await page.getByRole("button", { name: "1" }).click();
	await page.getByRole("button", { name: "0" }).click();
	await page.getByRole("button", { name: "!" }).click();
	await page.getByRole("button", { name: "=" }).click();
	expect(await page.getByRole("textbox").inputValue()).toBe("10!");
	expect(page.getByRole("status")).toHaveText("3628800");
});
