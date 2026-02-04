/**
 * Utility Functions Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  slugify,
  calculatePricePerSqm,
  formatPrice,
  formatArea,
  truncate,
  formatDate,
  formatRelativeTime,
  withRetry,
} from "./utils";

describe("cn - classnames utility", () => {
  it("merges class strings correctly", () => {
    // Arrange
    const input = ["px-4", "py-2", "bg-blue-500"];

    // Act
    const result = cn(...input);

    // Assert
    expect(result).toBe("px-4 py-2 bg-blue-500");
  });

  it("removes conflicting tailwind classes", () => {
    // Arrange
    const input = ["px-4", "px-8"]; // Second should win

    // Act
    const result = cn(...input);

    // Assert
    expect(result).toBe("px-8");
  });

  it("handles conditional classes", () => {
    // Arrange
    const input = ["px-4", false && "py-2", "bg-blue-500"];

    // Act
    const result = cn(...input);

    // Assert
    expect(result).toBe("px-4 bg-blue-500");
  });

  it("handles undefined and null", () => {
    // Arrange
    const input = ["px-4", undefined, null, "bg-blue-500"];

    // Act
    const result = cn(...input);

    // Assert
    expect(result).toBe("px-4 bg-blue-500");
  });
});

describe("slugify", () => {
  it("converts turkish characters to english", () => {
    // Arrange
    const input = "çğıöşüÇĞİÖŞÜ";

    // Act
    const result = slugify(input);

    // Assert - Implementation maps 'ı' to 'i'
    expect(result).toBe("cgiosucgiosu");
  });

  it("converts to lowercase", () => {
    // Arrange
    const input = "HENDEK Konut";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("hendek-konut");
  });

  it("removes special characters", () => {
    // Arrange
    const input = "İlan @ # $ % Test!";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("ilan-test");
  });

  it("replaces spaces with hyphens", () => {
    // Arrange
    const input = "Hendek Satılık Konut";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("hendek-satilik-konut");
  });

  it("handles multiple spaces", () => {
    // Arrange
    const input = "Hendek   Satılık    Konut";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("hendek-satilik-konut");
  });

  it("trims leading and trailing hyphens", () => {
    // Arrange
    const input = "---Test---";

    // Act
    const result = slugify(input);

    // Assert
    expect(result).toBe("test");
  });

  it("handles real estate titles", () => {
    // Arrange & Act & Assert
    expect(slugify("Hendek OSB Sanayi Arsası")).toBe("hendek-osb-sanayi-arsasi");
    expect(slugify("Sakarya Kirazlıyaka Villa")).toBe("sakarya-kirazliyaka-villa");
    expect(slugify("3+1 Daire")).toBe("31-daire"); // '+' removed, not replaced
  });
});

describe("calculatePricePerSqm", () => {
  it("calculates price per square meter", () => {
    // Arrange
    const price = 1000000;
    const area = 100;

    // Act
    const result = calculatePricePerSqm(price, area);

    // Assert
    expect(result).toBe(10000);
  });

  it("handles string price input", () => {
    // Arrange
    const price = "1000000";
    const area = 100;

    // Act
    const result = calculatePricePerSqm(price, area);

    // Assert
    expect(result).toBe(10000);
  });

  it("rounds to nearest integer", () => {
    // Arrange
    const price = 1000001;
    const area = 100;

    // Act
    const result = calculatePricePerSqm(price, area);

    // Assert
    expect(result).toBe(10000);
  });

  it("handles real-world prices", () => {
    // Arrange
    const price = 2500000;
    const area = 150;

    // Act
    const result = calculatePricePerSqm(price, area);

    // Assert
    expect(result).toBe(16667);
  });
});

describe("formatPrice", () => {
  it("formats price in Turkish Lira", () => {
    // Arrange
    const price = 1000000;

    // Act
    const result = formatPrice(price);

    // Assert
    expect(result).toBe("₺1.000.000");
  });

  it("handles string price input", () => {
    // Arrange
    const price = "2500000";

    // Act
    const result = formatPrice(price);

    // Assert
    expect(result).toBe("₺2.500.000");
  });

  it("handles small amounts", () => {
    // Arrange
    const price = 500;

    // Act
    const result = formatPrice(price);

    // Assert
    expect(result).toBe("₺500");
  });
});

describe("formatArea", () => {
  it("formats area with m² suffix", () => {
    // Arrange
    const area = 100;

    // Act
    const result = formatArea(area);

    // Assert
    expect(result).toBe("100m²");
  });

  it("formats large areas with thousand separator", () => {
    // Arrange
    const area = 10000;

    // Act
    const result = formatArea(area);

    // Assert
    expect(result).toBe("10.000m²");
  });
});

describe("truncate", () => {
  it("returns text as-is if under limit", () => {
    // Arrange
    const text = "Short text";
    const length = 20;

    // Act
    const result = truncate(text, length);

    // Assert
    expect(result).toBe("Short text");
  });

  it("truncates text over limit", () => {
    // Arrange
    const text = "This is a very long text that should be truncated";
    const length = 20;

    // Act
    const result = truncate(text, length);

    // Assert - Implementation does slice(0, length).trim() + "..."
    expect(result).toBe("This is a very long...");
    expect(result.length).toBeLessThanOrEqual(23); // "..." counts as 3
  });
});

describe("formatDate", () => {
  it("formats date in Turkish locale", () => {
    // Arrange
    const date = new Date("2026-01-24");

    // Act
    const result = formatDate(date);

    // Assert
    expect(result).toContain("Ocak");
    expect(result).toContain("2026");
    expect(result).toContain("24");
  });

  it("handles string date input", () => {
    // Arrange
    const date = "2026-01-24";

    // Act
    const result = formatDate(date);

    // Assert
    expect(result).toContain("Ocak");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-24T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Bugün' for today", () => {
    // Arrange
    const date = new Date("2026-01-24T10:00:00Z");

    // Act
    const result = formatRelativeTime(date);

    // Assert
    expect(result).toBe("Bugün");
  });

  it("returns 'Dün' for yesterday", () => {
    // Arrange
    const date = new Date("2026-01-23T12:00:00Z");

    // Act
    const result = formatRelativeTime(date);

    // Assert
    expect(result).toBe("Dün");
  });

  it("returns 'X gün önce' for recent days", () => {
    // Arrange
    const date = new Date("2026-01-20T12:00:00Z"); // 4 days ago

    // Act
    const result = formatRelativeTime(date);

    // Assert
    expect(result).toBe("4 gün önce");
  });

  it("returns 'X hafta önce' for weeks", () => {
    // Arrange
    const date = new Date("2026-01-03T12:00:00Z"); // ~3 weeks ago

    // Act
    const result = formatRelativeTime(date);

    // Assert
    expect(result).toBe("3 hafta önce");
  });
});

describe("withRetry", () => {
  it("returns result on first success", async () => {
    // Arrange
    const mockFn = vi.fn().mockResolvedValue("success");

    // Act
    const result = await withRetry(mockFn, { retries: 2, backoff: 1 });

    // Assert
    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure", async () => {
    // Arrange
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    // Act
    const result = await withRetry(mockFn, { retries: 2, backoff: 1 });

    // Assert
    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("throws after max retries", async () => {
    // Arrange
    const error = new Error("fail");
    const mockFn = vi.fn().mockRejectedValue(error);

    // Act & Assert
    await expect(withRetry(mockFn, { retries: 2, backoff: 1 })).rejects.toThrow(
      "fail"
    );
    expect(mockFn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("calls onRetry callback", async () => {
    // Arrange
    const onRetry = vi.fn();
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    // Act
    await withRetry(mockFn, { retries: 2, backoff: 1, onRetry });

    // Assert
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });
});
