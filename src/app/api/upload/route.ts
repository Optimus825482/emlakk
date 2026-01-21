import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "images";

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadi" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Desteklenmeyen dosya formatı. JPG, PNG, WebP veya GIF yükleyin.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 5MB'dan büyük olamaz." },
        { status: 400 },
      );
    }

    // Ensure upload directory exists
    const targetDir = join(UPLOAD_DIR, folder);
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${randomStr}.${extension}`;
    const filePath = join(targetDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: `${folder}/${fileName}`,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Dosya yuklenirken bir hata olustu." },
      { status: 500 },
    );
  }
});

export const DELETE = withAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    // Extract file path from URL (e.g., /uploads/images/123-abc.jpg)
    const pathMatch = url.match(/\/uploads\/(.+)$/);
    if (!pathMatch) {
      return NextResponse.json({ error: "Gecersiz URL" }, { status: 400 });
    }

    const relativePath = pathMatch[1];
    const filePath = join(UPLOAD_DIR, relativePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "Dosya bulunamadi" }, { status: 404 });
    }

    // Delete file
    await unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Dosya silinirken bir hata olustu." },
      { status: 500 },
    );
  }
});
