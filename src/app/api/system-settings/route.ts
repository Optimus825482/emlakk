import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/system-settings
 * Get system settings (returns first row or creates default)
 */
export async function GET() {
  try {
    let [settings] = await db.select().from(systemSettings).limit(1);

    // Eğer ayar yoksa varsayılan oluştur
    if (!settings) {
      [settings] = await db
        .insert(systemSettings)
        .values({
          aiProvider: "deepseek",
          aiModel: "deepseek-chat",
        })
        .returning();
    }

    // API key'i maskeleyerek döndür
    return NextResponse.json({
      data: {
        ...settings,
        aiApiKey: settings.aiApiKey ? maskApiKey(settings.aiApiKey) : null,
        hasApiKey: !!settings.aiApiKey,
      },
    });
  } catch (error) {
    console.error("System Settings GET error:", error);
    return NextResponse.json(
      { error: "Sistem ayarları yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/system-settings
 * Update system settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing settings
    let [existing] = await db.select().from(systemSettings).limit(1);

    if (!existing) {
      // Create if not exists
      [existing] = await db
        .insert(systemSettings)
        .values({
          aiProvider: "deepseek",
          aiModel: "deepseek-chat",
        })
        .returning();
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.aiProvider !== undefined) {
      updateData.aiProvider = body.aiProvider;
    }
    if (body.aiModel !== undefined) {
      updateData.aiModel = body.aiModel;
    }
    if (body.aiApiKey !== undefined) {
      updateData.aiApiKey = body.aiApiKey;
      updateData.aiApiKeyValid = false; // Reset validation when key changes
    }
    if (body.aiApiKeyValid !== undefined) {
      updateData.aiApiKeyValid = body.aiApiKeyValid;
      updateData.aiApiKeyLastChecked = new Date();
    }

    // Update
    const [updated] = await db
      .update(systemSettings)
      .set(updateData)
      .where(eq(systemSettings.id, existing.id))
      .returning();

    return NextResponse.json({
      data: {
        ...updated,
        aiApiKey: updated.aiApiKey ? maskApiKey(updated.aiApiKey) : null,
        hasApiKey: !!updated.aiApiKey,
      },
      message: "Sistem ayarları güncellendi",
    });
  } catch (error) {
    console.error("System Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Sistem ayarları güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}
