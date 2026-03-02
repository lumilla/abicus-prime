import { addThousandSeparators, THOUSAND_SEPARATOR as S } from "./format-number";

describe("addThousandSeparators", () => {
	describe("Integer grouping (3-from-right)", () => {
		it("leaves short integers unchanged", () => {
			expect(addThousandSeparators("0")).toBe("0");
			expect(addThousandSeparators("123")).toBe("123");
		});

		it("groups thousands", () => {
			expect(addThousandSeparators("1234")).toBe(`1${S}234`);
			expect(addThousandSeparators("1234567")).toBe(`1${S}234${S}567`);
		});

		it("handles negative sign", () => {
			expect(addThousandSeparators("-1234567")).toBe(`-1${S}234${S}567`);
		});
	});

	describe("Decimal grouping (3-from-left)", () => {
		it("leaves short fractions unchanged", () => {
			expect(addThousandSeparators("0,12", ",")).toBe("0,12");
			expect(addThousandSeparators("0,123", ",")).toBe("0,123");
		});

		it("groups long fractions", () => {
			expect(addThousandSeparators("0,1234", ",")).toBe(`0,123${S}4`);
			expect(addThousandSeparators("0,123456789", ",")).toBe(`0,123${S}456${S}789`);
		});

		it("groups both integer and decimal parts together", () => {
			expect(addThousandSeparators("123456,789012", ",")).toBe(`123${S}456,789${S}012`);
		});
	});

	describe("Exponential notation (no recursion)", () => {
		it("groups mantissa, leaves exponent untouched", () => {
			expect(addThousandSeparators("1,23456789012345678901e+25", ",")).toBe(
				`1,234${S}567${S}890${S}123${S}456${S}789${S}01e+25`,
			);
		});

		it("handles negative exponent", () => {
			expect(addThousandSeparators("1,23e-7", ",")).toBe("1,23e-7");
		});

		it("handles plain mantissa without decimal in exponent form", () => {
			expect(addThousandSeparators("1e+21")).toBe("1e+21");
		});
	});

	describe("Dot decimal separator", () => {
		it("works with dot as decimal separator", () => {
			expect(addThousandSeparators("1234567.89012", ".")).toBe(`1${S}234${S}567.890${S}12`);
		});
	});
});
