import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { withAdmin } from "@/lib/api-auth";
import { stderr } from "process";

// Whitelist: Allowed values for security
const ALLOWED_CATEGORIES = [
  "konut",
  "arsa",
  "isyeri",
  "bina",
  "turistik-tesis",
  "kooperatif",
  "projeler",
] as const;

const ALLOWED_TRANSACTIONS = ["satilik", "kiralik"] as const;

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, transaction, maxPages, sync, force } = body;

    // Strict validation with whitelist
    if (!category || !transaction) {
      return NextResponse.json(
        { success: false, error: "Kategori ve işlem tipi gerekli" },
        { status: 400 },
      );
    }

    // Whitelist check - prevents command injection
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz kategori" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TRANSACTIONS.includes(transaction)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz işlem tipi" },
        { status: 400 },
      );
    }

    // Validate maxPages is a number
    if (maxPages && (isNaN(Number(maxPages)) || Number(maxPages) < 1)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz sayfa sayısı" },
        { status: 400 },
      );
    }

    // Crawler script path
    const crawlerPath = path.join(
      process.cwd(),
      "crwal4ai",
      "admin_remix",
      "sahibinden_crawler.py",
    );

    // Build args array (safe from injection)
    const args = [
      crawlerPath,
      "--category",
      category,
      "--transaction",
      transaction,
    ];

    if (maxPages) {
      args.push("--max-pages", String(maxPages));
    }

    if (sync) {
      args.push("--sync");
    }

    if (force) {
      args.push("--force");
    }

    // Execute crawler with spawn (safe from shell injection)
    const child = spawn("python", args, {
      cwd: path.join(process.cwd(), "crwal4ai", "admin_remix"),
      timeout: 300000, // 5 dakika timeout
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Wait for process to complete
    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });

      child.on("error", reject);
    });

    // Parse JSON output from crawler
    const lines = stdout.split("\n");
    const jsonLine = lines.find((line) => line.trim().startsWith("{"));

    if (jsonLine) {
      const result = JSON.parse(jsonLine);
      return NextResponse.json({
        success: true,
        data: result,
        logs: stdout,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Crawler başlatıldı",
      logs: stdout,
    });
  } catch (error: any) {
    console.error("Crawler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Crawler başlatılamadı",
        details: process.env.NODE_ENV === "development" ? stderr : undefined,
      },
      { status: 500 },
    );
  }
}

// Export with admin protection
export const POST = withAdmin(handler);
