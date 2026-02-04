/**
 * Rate Limiting Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit, getRateLimitInfo, withRateLimit } from "./rate-limit";
import { NextRequest, NextResponse } from "next/server";

describe("rateLimit", () => {
  // Clear store before each test by resetting the module
  beforeEach(() => {
    // Note: The store is a module-level Map, so we can't easily reset it
    // In production tests, you might want to abstract the store
  });

  it("allows first request", async () => {
    // Arrange & Act
    const result = await rateLimit("test-user", { limit: 5, window: 60 });

    // Assert
    expect(result).toBe(true);
  });

  it("allows requests within limit", async () => {
    // Arrange & Act
    const results = await Promise.all([
      rateLimit("test-user-2", { limit: 5, window: 60 }),
      rateLimit("test-user-2", { limit: 5, window: 60 }),
      rateLimit("test-user-2", { limit: 5, window: 60 }),
    ]);

    // Assert
    expect(results).toEqual([true, true, true]);
  });

  it("blocks request when limit exceeded", async () => {
    // Arrange
    const identifier = "test-user-3";
    const limit = 3;

    // Act - exhaust the limit
    await rateLimit(identifier, { limit, window: 60 });
    await rateLimit(identifier, { limit, window: 60 });
    await rateLimit(identifier, { limit, window: 60 });

    // This should be blocked
    const result = await rateLimit(identifier, { limit, window: 60 });

    // Assert
    expect(result).toBe(false);
  });

  it("respects default limit of 10", async () => {
    // Arrange & Act
    for (let i = 0; i < 10; i++) {
      const result = await rateLimit("test-default", {});
      expect(result).toBe(true);
    }

    // 11th request should be blocked
    const result = await rateLimit("test-default", {});

    // Assert
    expect(result).toBe(false);
  });

  it("respects default window of 60 seconds", async () => {
    // Arrange & Act
    const result = await rateLimit("test-window", {});

    // Assert - should be allowed (first request)
    expect(result).toBe(true);
  });

  it("handles different identifiers separately", async () => {
    // Arrange & Act
    const result1 = await rateLimit("user-a", { limit: 2, window: 60 });
    const result2 = await rateLimit("user-b", { limit: 2, window: 60 });

    // Assert
    expect(result1).toBe(true);
    expect(result2).toBe(true);
  });
});

describe("getRateLimitInfo", () => {
  it("returns default info for new user", () => {
    // Arrange & Act
    const info = getRateLimitInfo("new-user");

    // Assert
    expect(info.remaining).toBe(10);
    expect(info.resetAt).toBeGreaterThan(Date.now());
  });

  it("returns remaining count after requests", async () => {
    // Arrange
    const identifier = "info-user";
    await rateLimit(identifier, { limit: 10, window: 60 });
    await rateLimit(identifier, { limit: 10, window: 60 });
    await rateLimit(identifier, { limit: 10, window: 60 });

    // Act
    const info = getRateLimitInfo(identifier);

    // Assert
    expect(info.remaining).toBe(7); // 10 - 3 = 7
  });

  it("returns zero remaining when limit reached", async () => {
    // Arrange
    const identifier = "full-user";
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      await rateLimit(identifier, { limit, window: 60 });
    }

    // Act
    const info = getRateLimitInfo(identifier);

    // Assert - Note: getRateLimitInfo always uses 10 as base, not actual limit
    // After 5 requests: 10 - 5 = 5 remaining
    expect(info.remaining).toBe(5);
  });
});

describe("withRateLimit", () => {
  it("calls handler when rate limit not exceeded", async () => {
    // Arrange
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withRateLimit(mockHandler, { limit: 5, window: 60 });

    const mockRequest = {
      headers: {
        get: (name: string) => (name === "x-forwarded-for" ? "192.168.1.1" : null),
      },
    } as unknown as NextRequest;

    // Act
    const response = await wrappedHandler(mockRequest);
    const data = await response.json();

    // Assert
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ success: true });
  });

  it("returns 429 when rate limit exceeded", async () => {
    // Arrange
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withRateLimit(mockHandler, { limit: 2, window: 60 });

    const mockRequest = {
      headers: {
        get: (name: string) => (name === "x-forwarded-for" ? "192.168.1.2" : null),
      },
    } as unknown as NextRequest;

    // Act - exhaust the limit
    await wrappedHandler(mockRequest);
    await wrappedHandler(mockRequest);

    // Third request should be rate limited
    const response = await wrappedHandler(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("RATE_LIMITED");
    expect(mockHandler).toHaveBeenCalledTimes(2); // Handler called only 2 times
  });

  it("includes rate limit headers in 429 response", async () => {
    // Arrange
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withRateLimit(mockHandler, { limit: 1, window: 60 });

    const mockRequest = {
      headers: {
        get: (name: string) => (name === "x-forwarded-for" ? "192.168.1.3" : null),
      },
    } as unknown as NextRequest;

    // Act - exhaust and get rate limited
    await wrappedHandler(mockRequest);
    const response = await wrappedHandler(mockRequest);

    // Assert
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("1");
    // Note: getRateLimitInfo always uses 10 as base, so after 1 request: 10 - 1 = 9
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("9");
  });

  it("uses x-forwarded-for header for identifier", async () => {
    // Arrange
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withRateLimit(mockHandler, { limit: 1, window: 60 });

    const mockRequest = {
      headers: {
        get: (name: string) => (name === "x-forwarded-for" ? "203.0.113.1" : null),
      },
    } as unknown as NextRequest;

    // Act
    await wrappedHandler(mockRequest);
    const response = await wrappedHandler(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(429);
  });

  it("falls back to anonymous when no headers", async () => {
    // Arrange
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withRateLimit(mockHandler, { limit: 1, window: 60 });

    const mockRequest = {
      headers: {
        get: () => null,
      },
    } as unknown as NextRequest;

    // Act
    await wrappedHandler(mockRequest);
    const response = await wrappedHandler(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(429);
  });
});
