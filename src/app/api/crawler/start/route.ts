import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, transaction, maxPages, sync, force } = body;

    // Validation
    if (!category || !transaction) {
      return NextResponse.json(
        { success: false, error: "Kategori ve işlem tipi gerekli" },
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

    // Build command
    let command = `python "${crawlerPath}" --category ${category} --transaction ${transaction}`;

    if (maxPages) {
      command += ` --max-pages ${maxPages}`;
    }

    if (sync) {
      command += ` --sync`;
    }

    if (force) {
      command += ` --force`;
    }

    // Execute crawler in background
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(process.cwd(), "crwal4ai", "admin_remix"),
      timeout: 300000, // 5 dakika timeout
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
        details: error.stderr || error.stdout,
      },
      { status: 500 },
    );
  }
}
