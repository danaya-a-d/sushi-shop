import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format-price";
import { majorToMinorUnits, minorUnitsToMajor } from "@/lib/money";

describe("money", () => {
  it("переводит тиыны в тенге и обратно", () => {
    expect(minorUnitsToMajor(450000)).toBe(4500);
    expect(minorUnitsToMajor(125050)).toBe(1250.5);
    expect(majorToMinorUnits(4500)).toBe(450000);
    expect(majorToMinorUnits(1250.5)).toBe(125050);
  });

  it("не накапливает ошибку округления на дробных значениях", () => {
    expect(majorToMinorUnits(0.1) + majorToMinorUnits(0.2)).toBe(30);
    expect(majorToMinorUnits(19.99)).toBe(1999);
  });
});

describe("formatPrice", () => {
  it("показывает ₸ и русскую группировку тысяч с неразрывными пробелами", () => {
    expect(formatPrice(4500)).toBe("4 500 ₸");
    expect(formatPrice(700)).toBe("700 ₸");
    expect(formatPrice(1234567)).toBe("1 234 567 ₸");
    expect(formatPrice(0)).toBe("0 ₸");
  });

  it("дробные тенге показывает с запятой, целые — без «,00»", () => {
    expect(formatPrice(1250.5)).toBe("1 250,5 ₸");
    expect(formatPrice(1250)).not.toContain(",");
  });
});
