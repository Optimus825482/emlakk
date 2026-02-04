import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextRequest: class NextRequest {
    headers: Map<string, string>;
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      this.headers = new Map(
        Object.entries(init?.headers || { get: () => null })
      );
    }
  },
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      headers: {
        get: (name: string) => {
          const headers = init?.headers as Record<string, string> | undefined;
          return headers?.[name] || null;
        },
      },
      json: async () => body,
    }),
  },
}));

// Mock next-auth
vi.mock("next-auth", () => ({
  auth: () => Promise.resolve(null),
}));

vi.mock("@/lib/auth", () => ({
  auth: () => Promise.resolve(null),
}));
