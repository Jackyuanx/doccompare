// src/app/api/manual/discussion/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const { topic } = await req.json();
  const backendDir = path.resolve(process.cwd(), "backend-manual");
  const py = path.resolve(process.cwd(), ".venv/bin/python");

  try {
    // 1. Generate difference.json
    await new Promise((resolve, reject) => {
      exec(`${py} difference.py`, { cwd: backendDir }, (err, stdout, stderr) =>
        err ? reject(stderr) : resolve(stdout)
      );
    });

    // 2. Generate discussion based on topic_matches + difference
    await new Promise((resolve, reject) => {
      exec(`${py} generate_discussion.py "${topic}"`, { cwd: backendDir }, (err, stdout, stderr) =>
        err ? reject(stderr) : resolve(stdout)
      );
    });

    const output = await fs.readFile(path.join(backendDir, "discussion.json"), "utf-8");
    return NextResponse.json(JSON.parse(output));
  } catch (err) {
    console.error("❌ Discussion generation failed:", err);
    return NextResponse.json({ error: "Failed to generate discussion" }, { status: 500 });
  }
}
