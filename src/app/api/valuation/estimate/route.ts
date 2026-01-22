// Değerleme API - Gerçek Veri Analizi ile

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { performValuation } from "@/lib/valuation/valuation-engine";
import { LocationPoint, PropertyFeatures } from "@/lib/valuation/types";

// Request validation schema
const valuationRequestSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
    ilce: z.string().optional(),
    mahalle: z.string().optional(),
  }),
  features: z.object({
    propertyType: z.enum(["konut", "arsa", "isyeri", "sanayi", "tarim"]),
    area: z.number().positive(),
    roomCount: z.number().optional(),
    buildingAge: z.number().optional(),
    floor: z.number().optional(),
    totalFloors: z.number().optional(),
    hasElevator: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    hasBalcony: z.boolean().optional(),
    heating: z.string().optional(),
    furnished: z.boolean().optional(),
  }),
  userInfo: z
    .object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = valuationRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Geçersiz veri",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { location, features, userInfo } = validation.data;

    // Perform valuation
    console.log("🚀 Değerleme başlatılıyor...", {
      location: `${location.lat}, ${location.lng}`,
      propertyType: features.propertyType,
      area: features.area,
    });

    const result = await performValuation(
      location as LocationPoint,
      features as PropertyFeatures,
    );

    console.log("✅ Değerleme tamamlandı:", {
      estimatedValue: result.estimatedValue,
      confidenceScore: result.confidenceScore,
      comparables: result.comparableProperties.length,
    });

    // TODO: Kullanıcı bilgisi varsa veritabanına kaydet
    if (userInfo) {
      // await saveValuationRequest(userInfo, location, features, result);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Değerleme hatası:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Değerleme yapılırken bir hata oluştu";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
}
