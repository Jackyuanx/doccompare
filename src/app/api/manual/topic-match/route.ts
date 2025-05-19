import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const { topic } = await req.json();
  const backendDir = path.resolve(process.cwd(), "backend-manual");
  const py = path.resolve(process.cwd(), ".venv/bin/python");
  const script = path.join(backendDir, "topic_match.py");

  try {
    console.log(`▶️ Running topic_match.py with topic: "${topic}"`);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(py, [script, topic], { cwd: backendDir });

      proc.stdout.on("data", (data) => {
        process.stdout.write(data); // ✅ show output in terminal
      });

      proc.stderr.on("data", (data) => {
        process.stderr.write(data); // ✅ show errors in terminal
      });

      proc.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Process exited with code ${code}`));
      });
    });

    const resultPath = path.join(backendDir, "topic_matches.json");
    const file = await fs.readFile(resultPath, "utf-8");
    return NextResponse.json(JSON.parse(file));
  } catch (err) {
    console.error("❌ Topic match failed:", err);
    return NextResponse.json({ error: "Topic match error" }, { status: 500 });
  }
}