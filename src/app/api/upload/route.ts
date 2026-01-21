import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-auth";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// Image optimization settings
const IMAGE_QUALITY = 80;
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;

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
    const baseFileName = `${timestamp}-${randomStr}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize image with Sharp
    let optimizedBuffer: Buffer;
    let finalExtension = "webp"; // Default to WebP for best compression

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if too large
      let resizeOptions: { width?: number; height?: number } = {};
      if (metadata.width && metadata.width > MAX_WIDTH) {
        resizeOptions.width = MAX_WIDTH;
      }
      if (metadata.height && metadata.height > MAX_HEIGHT) {
        resizeOptions.height = MAX_HEIGHT;
      }

      // Optimize and convert to WebP
      optimizedBuffer = await image
        .resize(
          resizeOptions.width || resizeOptions.height
            ? resizeOptions
            : undefined,
        )
        .webp({ quality: IMAGE_QUALITY })
        .toBuffer();

      console.log(
        `Image optimized: ${file.size} bytes → ${optimizedBuffer.length} bytes (${Math.round((1 - optimizedBuffer.length / file.size) * 100)}% reduction)`,
      );
    } catch (error) {
      console.error("Image optimization failed, using original:", error);
      // Fallback to original if optimization fails
      optimizedBuffer = buffer;
      const extensionMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      finalExtension = extensionMap[file.type] || "jpg";
    }

    // Save optimized image
    const fileName = `${baseFileName}.${finalExtension}`;
    const filePath = join(targetDir, fileName);
    await writeFile(filePath, optimizedBuffer);

    // Generate thumbnail for listings
    if (folder === "listings") {
      try {
        const thumbnailBuffer = await sharp(optimizedBuffer)
          .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
            fit: "cover",
            position: "center",
          })
          .webp({ quality: 75 })
          .toBuffer();

        const thumbnailFileName = `${baseFileName}-thumb.webp`;
        const thumbnailPath = join(targetDir, thumbnailFileName);
        await writeFile(thumbnailPath, thumbnailBuffer);

        console.log(`Thumbnail created: ${thumbnailFileName}`);
      } catch (error) {
        console.error("Thumbnail generation failed:", error);
        // Non-critical, continue without thumbnail
      }
    }

    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: `${folder}/${fileName}`,
      size: optimizedBuffer.length,
      originalSize: file.size,
      type: "image/webp",
      optimized: true,
      savings: Math.round((1 - optimizedBuffer.length / file.size) * 100),
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

    // Delete main file
    await unlink(filePath);

    // Try to delete thumbnail if exists (for listings)
    try {
      const thumbnailPath = filePath.replace(
        /\.(webp|jpg|jpeg|png)$/,
        "-thumb.webp",
      );
      if (existsSync(thumbnailPath)) {
        await unlink(thumbnailPath);
        console.log("Thumbnail deleted:", thumbnailPath);
      }
    } catch (error) {
      console.error("Thumbnail deletion failed (non-critical):", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Dosya silinirken bir hata olustu." },
      { status: 500 },
    );
  }
});
