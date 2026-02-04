/**
 * Listing Validation Tests
 * Zod schema validation for listing data
 */

import { describe, it, expect } from "vitest";
import { createListingSchema } from "./listing";

describe("createListingSchema", () => {
  // 1. Happy Path
  it("valid listing passes validation", () => {
    // Arrange
    const validInput = {
      title: "Hendek Konut Satılık",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      area: 100,
      address: "Test adres",
      city: "Sakarya",
      district: "Hendek",
    };

    // Act
    const result = createListingSchema.safeParse(validInput);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(validInput.title);
      expect(result.data.type).toBe(validInput.type);
      expect(result.data.price).toBe(validInput.price);
    }
  });

  // 2. Required Fields - Title
  it("fails without title", () => {
    // Arrange
    const invalidInput = {
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  it("title must be at least 5 characters", () => {
    // Arrange
    const invalidInput = {
      title: "Abc", // 3 characters
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("en az 5 karakter");
    }
  });

  it("title max 200 characters", () => {
    // Arrange
    const invalidInput = {
      title: "A".repeat(201), // 201 characters
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  // 3. Type Validation
  it("type must be valid enum value", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "invalid-type", // Invalid enum
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  it("accepts valid type: konut", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("accepts valid type: sanayi", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "sanayi",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  // 4. Price Validation
  it("price must be positive number", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: -100, // Negative price
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  it("price: 0 is invalid", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 0, // Zero price
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  // 5. Area Validation
  it("area must be positive when provided", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      area: -50, // Negative area
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  it("area is optional", () => {
    // Arrange
    const validInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      // area not provided
    };

    // Act
    const result = createListingSchema.safeParse(validInput);

    // Assert
    expect(result.success).toBe(true);
  });

  // 6. Transaction Type Validation
  it("transactionType must be valid enum", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "invalid", // Invalid enum
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  it("accepts valid transactionType: sale", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("accepts valid transactionType: rent", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "rent",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  // 7. Status Validation
  it("status defaults to active when not provided", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
    }
  });

  it("accepts valid status: draft", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      status: "draft",
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  // 8. Images Validation
  it("images array max 20 items", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      images: Array.from({ length: 21 }, (_, i) => `https://example.com/img${i}.jpg`),
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("20");
    }
  });

  it("accepts valid images array with 20 items", () => {
    // Arrange
    const validInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      images: Array.from({ length: 20 }, (_, i) => `https://example.com/img${i}.jpg`),
    };

    // Act
    const result = createListingSchema.safeParse(validInput);

    // Assert
    expect(result.success).toBe(true);
  });

  // 9. Description Validation
  it("description is optional", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      // description not provided
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("description max 5000 characters", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      description: "A".repeat(5001), // 5001 characters
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  // 10. Coordinates Validation
  it("accepts valid latitude and longitude", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      latitude: 40.1234,
      longitude: 29.5678,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("rejects invalid latitude > 90", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      latitude: 95, // Invalid
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  it("rejects invalid longitude > 180", () => {
    // Arrange
    const invalidInput = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      longitude: 185, // Invalid
    };

    // Act
    const result = createListingSchema.safeParse(invalidInput);

    // Assert
    expect(result.success).toBe(false);
  });

  // 11. IsFeatured Validation
  it("isFeatured defaults to false", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFeatured).toBe(false);
    }
  });

  it("accepts isFeatured: true", () => {
    // Arrange
    const input = {
      title: "Test İlan",
      type: "konut",
      transactionType: "sale",
      price: 1000000,
      isFeatured: true,
    };

    // Act
    const result = createListingSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFeatured).toBe(true);
    }
  });
});
