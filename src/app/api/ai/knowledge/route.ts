import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVectorMemoryService } from "@/lib/ai/vector-memory";
import { db } from "@/db";
import { aiMemory } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Use pdf2json instead of pdf-parse to avoid DOM dependencies
const PDFParser = require("pdf2json");
import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";

// Helper to parse PDF buffer
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1); // 1 = text content

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      // pdf2json returns raw text content in this format
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let content = "";
    let category = "general_knowledge";
    let tags: string[] = [];
    let importanceScore = 50;
    let summary = "";
    let sourceType = "admin_manual_entry";
    let sourceUrl = "";

    // Handle Multipart Form Data (Files)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const url = formData.get("url") as string;
      category = (formData.get("category") as string) || "general_knowledge";
      const tagsStr = formData.get("tags") as string;
      tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()) : [];
      importanceScore = parseInt(
        (formData.get("importanceScore") as string) || "50",
      );
      summary = (formData.get("summary") as string) || "";

      // 1. File Upload
      if (file) {
        sourceType = "file_upload";
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.type === "application/pdf") {
          try {
            content = await parsePdfBuffer(buffer);
            summary = summary || `PDF: ${file.name}`;
          } catch (e) {
            console.error("PDF Parse Error:", e);
            return NextResponse.json(
              { error: "PDF okunamadı" },
              { status: 400 },
            );
          }
        } else if (
          file.name.endsWith(".md") ||
          file.name.endsWith(".txt") ||
          file.type.includes("text")
        ) {
          content = buffer.toString("utf-8");
          summary = summary || `File: ${file.name}`;
        } else {
          return NextResponse.json(
            { error: "Desteklenmeyen dosya formatı" },
            { status: 400 },
          );
        }
      }
      // 2. URL Processing
      else if (url) {
        sourceUrl = url;
        // YouTube
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          sourceType = "youtube_video";
          try {
            const transcript = await YoutubeTranscript.fetchTranscript(url);
            content = transcript.map((t) => t.text).join(" ");
            summary = summary || `YouTube: ${url}`;
          } catch (e) {
            console.error("Youtube error", e);
            return NextResponse.json(
              { error: "YouTube altyazısı alınamadı" },
              { status: 400 },
            );
          }
        }
        // Web Page
        else {
          sourceType = "web_page";
          try {
            const res = await fetch(url);
            const html = await res.text();
            const $ = cheerio.load(html);

            // Remove scripts, styles, etc.
            $("script").remove();
            $("style").remove();
            $("nav").remove();
            $("footer").remove();

            content = $("body").text().replace(/\s+/g, " ").trim();
            const title = $("title").text().trim();
            summary = summary || `Web: ${title}`;
          } catch (e) {
            return NextResponse.json(
              { error: "Web sayfası okunamadı" },
              { status: 400 },
            );
          }
        }
      } else {
        // Fallback to text
        content = (formData.get("content") as string) || "";
      }
    }
    // Handle JSON (Manual Text)
    else {
      const body = await request.json();
      content = body.content;
      category = body.category;
      tags = body.tags;
      importanceScore = body.importanceScore;
      summary = body.summary;
    }

    if (!content) {
      return NextResponse.json(
        { error: "İçerik bulunamadı veya boş" },
        { status: 400 },
      );
    }

    const vectorMemory = getVectorMemoryService();

    const memoryId = await vectorMemory.storeMemory({
      content,
      category: category || "general_knowledge",
      memoryType: "knowledge",
      tags: tags || [],
      importanceScore: importanceScore || 50,
      summary,
      sourceType: sourceType,
      sourceId: sourceUrl || session.user.id,
    });

    return NextResponse.json({ success: true, memoryId, summary });
  } catch (error) {
    console.error("Knowledge creation error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const knowledgeBase = await db
      .select()
      .from(aiMemory)
      .where(eq(aiMemory.memoryType, "knowledge"))
      .orderBy(desc(aiMemory.createdAt))
      .limit(limit);

    return NextResponse.json({ data: knowledgeBase });
  } catch (error) {
    console.error("Knowledge list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    await db
      .delete(aiMemory)
      .where(and(eq(aiMemory.id, id), eq(aiMemory.memoryType, "knowledge")));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Knowledge delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
