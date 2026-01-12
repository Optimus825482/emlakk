import { createAdminClient } from "./server";

const BUCKET_NAME = "listings";

export async function uploadImage(
  file: File,
  folder: string = "images"
): Promise<string> {
  const supabase = createAdminClient();

  // Unique filename oluştur
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `${folder}/${timestamp}-${randomStr}.${extension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Resim yüklenemedi: ${error.message}`);
  }

  // Public URL al
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadImageFromBase64(
  base64Data: string,
  folder: string = "images"
): Promise<string> {
  const supabase = createAdminClient();

  // Base64'ten file oluştur
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Geçersiz base64 formatı");
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");

  // Extension belirle
  const extensionMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensionMap[mimeType] || "jpg";

  // Unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filename = `${folder}/${timestamp}-${randomStr}.${extension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Resim yüklenemedi: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  const supabase = createAdminClient();

  // URL'den path çıkar
  const urlObj = new URL(url);
  const pathMatch = urlObj.pathname.match(
    /\/storage\/v1\/object\/public\/listings\/(.+)$/
  );

  if (!pathMatch) {
    console.warn("Geçersiz storage URL:", url);
    return;
  }

  const filePath = pathMatch[1];

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    console.error("Resim silinemedi:", error.message);
  }
}

export async function listImages(folder: string = "images"): Promise<string[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder);

  if (error) {
    throw new Error(`Resimler listelenemedi: ${error.message}`);
  }

  return data.map((file) => {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${folder}/${file.name}`);
    return publicUrl;
  });
}
