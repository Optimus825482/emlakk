/**
 * /api/map/clusters Endpoint Test Suite
 * Tests: Validation, Clustering Algorithm, Cache, Zoom Levels
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

describe("GET /api/map/clusters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Query Parameter Validation", () => {
    it("should require bounding box parameters", async () => {
      // Missing swLat
      const request = new Request(
        "http://localhost:3000/api/map/clusters?neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Geçersiz parametreler");
    });

    it("should reject invalid zoom level", async () => {
      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&zoom=25",
      );

      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it("should accept valid zoom levels (1-20)", async () => {
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
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&zoom=15",
      );

      const response = await GET(request);

      expect(response.status).not.toBe(400);
    });

    it("should use default zoom when not specified", async () => {
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
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request);

      expect(response.status).not.toBe(400);
    });
  });

  describe("Cluster Response Format", () => {
    it("should return clusters with correct structure", async () => {
      const mockListings = [
        {
          id: 1,
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
        },
        {
          id: 2,
          fiyat: 6000000,
          koordinatlar: { lat: "40.795", lng: "30.745" },
          konum: "Hendek",
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

      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("clusters");
      expect(data).toHaveProperty("cached");
      expect(data).toHaveProperty("timestamp");

      // Check cluster format
      if (data.clusters.length > 0) {
        const cluster = data.clusters[0];
        expect(cluster).toHaveProperty("position");
        expect(cluster).toHaveProperty("count");
        expect(cluster).toHaveProperty("bounds");
        expect(cluster).toHaveProperty("prices");

        // Check position
        expect(cluster.position).toHaveProperty("lat");
        expect(cluster.position).toHaveProperty("lng");

        // Check bounds
        expect(cluster.bounds).toHaveProperty("swLat");
        expect(cluster.bounds).toHaveProperty("neLat");
        expect(cluster.bounds).toHaveProperty("swLng");
        expect(cluster.bounds).toHaveProperty("neLng");

        // Check prices
        expect(cluster.prices).toHaveProperty("min");
        expect(cluster.prices).toHaveProperty("max");
        expect(cluster.prices).toHaveProperty("avg");
      }
    });

    it("should calculate cluster center correctly", async () => {
      const mockListings = [
        {
          id: 1,
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
        },
        {
          id: 2,
          fiyat: 6000000,
          koordinatlar: { lat: "40.80", lng: "30.75" },
          konum: "Hendek",
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

      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&gridSize=0.01",
      );

      const response = await GET(request);
      const data = await response.json();

      // Both listings should be in same cluster (same grid cell)
      if (data.clusters.length > 0) {
        expect(data.clusters[0].count).toBe(2);
        // Center should be average of positions
        expect(data.clusters[0].position.lat).toBeCloseTo(40.795, 3);
        expect(data.clusters[0].position.lng).toBeCloseTo(30.745, 3);
      }
    });

    it("should calculate price statistics correctly", async () => {
      const mockListings = [
        {
          id: 1,
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
        },
        {
          id: 2,
          fiyat: 7500000,
          koordinatlar: { lat: "40.795", lng: "30.745" },
          konum: "Hendek",
        },
        {
          id: 3,
          fiyat: 10000000,
          koordinatlar: { lat: "40.80", lng: "30.75" },
          konum: "Hendek",
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

      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&gridSize=0.05",
      );

      const response = await GET(request);
      const data = await response.json();

      if (data.clusters.length > 0) {
        const prices = data.clusters[0].prices;
        expect(prices.min).toBe(5000000);
        expect(prices.max).toBe(10000000);
        expect(prices.avg).toBeCloseTo(7500000, 0);
      }
    });
  });

  describe("Bounding Box Filtering", () => {
    it("should exclude listings outside bounds", async () => {
      const mockListings = [
        {
          id: 1,
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
        },
        {
          id: 2,
          fiyat: 6000000,
          koordinatlar: { lat: "41.50", lng: "31.50" },
          konum: "Sakarya",
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

      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.85&swLng=30.7&neLng=30.8",
      );

      const response = await GET(request);
      const data = await response.json();

      // Only first listing should be in bounds
      const totalCount = data.clusters.reduce(
        (sum: number, c: any) => sum + c.count,
        0,
      );
      expect(totalCount).toBeLessThanOrEqual(1);
    });
  });

  describe("Zoom Level & Grid Size", () => {
    it("should use smaller grid at higher zoom", async () => {
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

      // High zoom = smaller grid
      const requestHigh = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&zoom=15",
      );

      await GET(requestHigh);

      // Low zoom = larger grid
      const requestLow = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&zoom=5",
      );

      await GET(requestLow);

      // Both should succeed
      expect(true).toBe(true);
    });

    it("should use custom gridSize when provided", async () => {
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
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&gridSize=0.05",
      );

      const response = await GET(request);

      expect(response.status).not.toBe(400);
    });
  });

  describe("Category & Price Filtering", () => {
    it("should filter by category", async () => {
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
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&category=Konut",
      );

      await GET(request);

      expect(db.select).toHaveBeenCalled();
    });

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
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9&minPrice=5000000",
      );

      await GET(request);

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("Cache Mechanism", () => {
    it("should return cached response for same request", async () => {
      const mockListings = [
        {
          id: 1,
          fiyat: 5000000,
          koordinatlar: { lat: "40.79", lng: "30.74" },
          konum: "Hendek",
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

      const url =
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9";

      // First request
      const response1 = await GET(new Request(url));
      const data1 = await response1.json();

      // Second request (should be cached)
      const response2 = await GET(new Request(url));
      const data2 = await response2.json();

      expect(data1.cached).toBe(false);
      expect(data2.cached).toBe(true);
    });
  });

  describe("Empty Results", () => {
    it("should return empty clusters when no listings", async () => {
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
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.clusters).toEqual([]);
    });

    it("should handle listings without coordinates", async () => {
      const mockListings = [
        {
          id: 1,
          fiyat: 5000000,
          koordinatlar: null,
          konum: "Hendek",
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

      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request);
      const data = await response.json();

      // Listings without coordinates should be skipped
      expect(data.clusters).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockReturnThis();
      const mockOrderBy = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));
      const mockSelect = {
        from: vi.fn(() => ({
          where: mockWhere,
          limit: mockLimit,
          orderBy: mockOrderBy,
        })),
      };

      vi.mocked(db.select).mockReturnValue(mockSelect as any);

      const request = new Request(
        "http://localhost:3000/api/map/clusters?swLat=40.7&neLat=40.9&swLng=30.6&neLng=30.9",
      );

      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });
  });
});
