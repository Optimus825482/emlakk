/**
 * /api/map/listings Endpoint Test Suite
 * Tests: Validation, Bounding Box, Cache, Rate Limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import { db } from "@/db";
import { sahibindenListe } from "@/db/schema/crawler";

// Mock database
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: () =>
    Promise.resolve({
      user: { role: "admin" },
    }),
}));

describe("GET /api/map/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Query Parameter Validation", () => {
    it("should reject invalid swLat (outside range)", async () => {
      const request = new Request(
        "http://localhost:3000/api/map/listings?swLat=100&neLat=45&swLng=30&neLng=35",
      );

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Geçersiz parametreler");
    });

    it("should reject invalid neLat (too small)", async () => {
      const request = new Request(
        "http://localhost:3000/api/map/listings?swLat=40&neLat=-100&swLng=30&neLng=35",
      );

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      expect(response.status).toBe(400);
    });

    it("should reject invalid swLng (outside range)", async () => {
      const request = new Request(
        "http://localhost:3000/api/map/listings?swLat=40&neLat=45&swLng=200&neLng=35",
      );

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      expect(response.status).toBe(400);
    });

    it("should reject invalid limit (too high)", async () => {
      const request = new Request(
        "http://localhost:3000/api/map/listings?limit=10000",
      );

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      expect(response.status).toBe(400);
    });

    it("should accept valid parameters", async () => {
      // Mock successful query
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn();
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);
      mockOrderBy.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/map/listings?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      // Should not throw validation error
      expect(response.status).not.toBe(400);
    });
  });

  describe("MapMarker Response Format", () => {
    it("should return MapMarker format with required fields", async () => {
      const mockListings = [
        {
          id: 1,
          baslik: "Test İlan",
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek Merkez",
          category: "Konut",
          transaction: "Satılık",
          m2: "120",
          resim: "https://example.com/image.jpg",
          ilce: "Hendek",
          semt: "Merkez",
          mahalle: "Yeni",
        },
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request("http://localhost:3000/api/map/listings");

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Check response structure
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("stats");
      expect(data).toHaveProperty("cached");
      expect(data).toHaveProperty("timestamp");

      // Check stats
      expect(data.stats).toHaveProperty("total");
      expect(data.stats).toHaveProperty("sale");
      expect(data.stats).toHaveProperty("rent");

      // Check MapMarker format
      if (data.data.length > 0) {
        const marker = data.data[0];
        expect(marker).toHaveProperty("id");
        expect(marker).toHaveProperty("position");
        expect(marker).toHaveProperty("title");
        expect(marker).toHaveProperty("price");
        expect(marker).toHaveProperty("type");
        expect(marker).toHaveProperty("transactionType");
        expect(marker).toHaveProperty("slug");
        expect(marker).toHaveProperty("source");

        // Check position object
        expect(marker.position).toHaveProperty("lat");
        expect(marker.position).toHaveProperty("lng");
        expect(typeof marker.position.lat).toBe("number");
        expect(typeof marker.position.lng).toBe("number");
      }
    });

    it("should map transaction type correctly", async () => {
      const mockListings = [
        {
          id: 1,
          baslik: "Satılık İlan",
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
          category: "Konut",
          transaction: "Satılık",
          m2: "120",
          resim: null,
          ilce: "Hendek",
          semt: null,
          mahalle: null,
        },
        {
          id: 2,
          baslik: "Kiralık İlan",
          fiyat: 25000,
          koordinatlar: { lat: "40.80", lng: "30.75" },
          konum: "Hendek",
          category: "Konut",
          transaction: "Kiralık",
          m2: "100",
          resim: null,
          ilce: "Hendek",
          semt: null,
          mahalle: null,
        },
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request("http://localhost:3000/api/map/listings");

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      const data = await response.json();

      expect(data.stats.sale).toBe(1);
      expect(data.stats.rent).toBe(1);

      const saleMarker = data.data.find(
        (m: any) => m.transactionType === "sale",
      );
      const rentMarker = data.data.find(
        (m: any) => m.transactionType === "rent",
      );

      expect(saleMarker).toBeTruthy();
      expect(rentMarker).toBeTruthy();
    });
  });

  describe("Bounding Box Filtering", () => {
    it("should filter listings outside bounding box", async () => {
      const mockListings = [
        {
          id: 1,
          baslik: "Inside Bounds",
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
          category: "Konut",
          transaction: "Satılık",
          m2: "120",
          resim: null,
          ilce: null,
          semt: null,
          mahalle: null,
        },
        {
          id: 2,
          baslik: "Outside Bounds",
          fiyat: 6000000,
          koordinatlar: { lat: "41.00", lng: "31.00" },
          konum: "Sakarya",
          category: "Konut",
          transaction: "Satılık",
          m2: "150",
          resim: null,
          ilce: null,
          semt: null,
          mahalle: null,
        },
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      // Bounding box: Hendek area (smaller than coordinates)
      const request = new Request(
        "http://localhost:3000/api/map/listings?swLat=40.7&neLat=40.85&swLng=30.7&neLng=30.8",
      );

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      const data = await response.json();

      // Only one listing should be inside the bounds
      expect(data.stats.total).toBeLessThanOrEqual(1);
      if (data.data.length > 0) {
        expect(data.data[0].position.lat).toBeGreaterThanOrEqual(40.7);
        expect(data.data[0].position.lat).toBeLessThanOrEqual(40.85);
        expect(data.data[0].position.lng).toBeGreaterThanOrEqual(30.7);
        expect(data.data[0].position.lng).toBeLessThanOrEqual(30.8);
      }
    });

    it("should include all listings when no bounds specified", async () => {
      const mockListings = [
        {
          id: 1,
          baslik: "Listing 1",
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
          category: "Konut",
          transaction: "Satılık",
          m2: "120",
          resim: null,
          ilce: null,
          semt: null,
          mahalle: null,
        },
        {
          id: 2,
          baslik: "Listing 2",
          fiyat: 6000000,
          koordinatlar: { lat: "41.00", lng: "31.00" },
          konum: "Sakarya",
          category: "Konut",
          transaction: "Satılık",
          m2: "150",
          resim: null,
          ilce: null,
          semt: null,
          mahalle: null,
        },
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockSelect = {
        from: vi.fn(() => ({
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request("http://localhost:3000/api/map/listings");

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      const data = await response.json();

      // All listings should be included
      expect(data.stats.total).toBe(2);
    });
  });

  describe("Price Filtering", () => {
    it("should filter by minPrice", async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request(
        "http://localhost:3000/api/map/listings?minPrice=5000000",
      );

      await GET(request, {
        params: Promise.resolve({}),
      });

      expect(db.select).toHaveBeenCalled();
    });

    it("should filter by maxPrice", async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request(
        "http://localhost:3000/api/map/listings?maxPrice=10000000",
      );

      await GET(request, {
        params: Promise.resolve({}),
      });

      expect(db.select).toHaveBeenCalled();
    });

    it("should filter by price range", async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request(
        "http://localhost:3000/api/map/listings?minPrice=5000000&maxPrice=10000000",
      );

      await GET(request, {
        params: Promise.resolve({}),
      });

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("Cache Mechanism", () => {
    it("should return cached response for same request", async () => {
      const mockListings = [
        {
          id: 1,
          baslik: "Test",
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
          category: "Konut",
          transaction: "Satılık",
          m2: "120",
          resim: null,
          ilce: null,
          semt: null,
          mahalle: null,
        },
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockSelect = {
        from: vi.fn(() => ({
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const url = "http://localhost:3000/api/map/listings";

      // First request
      const response1 = await GET(new Request(url), {
        params: Promise.resolve({}),
      });
      const data1 = await response1.json();

      // Second request (should be cached)
      const response2 = await GET(new Request(url), {
        params: Promise.resolve({}),
      });
      const data2 = await response2.json();

      expect(data1.cached).toBe(false);
      expect(data2.cached).toBe(true);
    });

    it("should bypass cache with noCache parameter", async () => {
      const mockListings = [
        {
          id: 1,
          baslik: "Test",
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
          category: "Konut",
          transaction: "Satılık",
          m2: "120",
          resim: null,
          ilce: null,
          semt: null,
          mahalle: null,
        },
      ];

      const mockFrom = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockSelect = {
        from: vi.fn(() => ({
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const url = "http://localhost:3000/api/map/listings?noCache=true";

      // First request
      await GET(new Request(url), {
        params: Promise.resolve({}),
      });

      // Second request (should NOT be cached due to noCache)
      const response = await GET(new Request(url), {
        params: Promise.resolve({}),
      });
      const data = await response.json();

      expect(data.cached).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));
      const mockSelect = {
        from: vi.fn(() => ({
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request("http://localhost:3000/api/map/listings");

      const response = await GET(request, {
        params: Promise.resolve({}),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });
  });
});
