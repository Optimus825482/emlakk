import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Desteklenen resim formatları
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = "listings";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "images";

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    // Dosya tipi kontrolü
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Desteklenmeyen dosya formatı. JPG, PNG, WebP veya GIF yükleyin.",
        },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 5MB'dan büyük olamaz." },
        { status: 400 }
      );
    }

    // Supabase client
    const supabase = createAdminClient();

    // Unique filename oluştur
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${timestamp}-${randomStr}.${extension}`;

    // Dosyayı Supabase Storage'a yükle
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { error: `Dosya yüklenemedi: ${error.message}` },
        { status: 500 }
      );
    }

    // Public URL al
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: data.path,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

// Dosya silme endpoint'i
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // URL'den path çıkar
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/listings\/(.+)$/
    );

    if (!pathMatch) {
      return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
    }

    const filePath = decodeURIComponent(pathMatch[1]);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: `Dosya silinemedi: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Dosya silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
