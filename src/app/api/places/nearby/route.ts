import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const type = searchParams.get("type");
  const radius = searchParams.get("radius") || "2000";

  if (!lat || !lng || !type) {
    return NextResponse.json(
      { error: "lat, lng, and type are required" },
      { status: 400 }
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key not configured");
    return NextResponse.json(
      { error: "API key not configured", results: [] },
      { status: 500 }
    );
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}&` +
      `radius=${radius}&` +
      `type=${type}&` +
      `key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "REQUEST_DENIED") {
      console.error("Google Places API denied:", data.error_message);
      return NextResponse.json({
        status: data.status,
        error: data.error_message,
        results: [],
      });
    }

    return NextResponse.json({
      status: data.status,
      results: data.results || [],
    });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch places", results: [] },
      { status: 500 }
    );
  }
}
