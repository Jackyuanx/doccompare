import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  const { topic } = await req.json();

  const backendDir = path.resolve(process.cwd(), "backend-manual");
  const pythonPath = path.resolve(process.cwd(), ".venv/bin/python");
  const scriptPath = path.join(backendDir, "topic_match.py");

  try {
    // Run the topic_match.py with the given topic
    await new Promise((resolve, reject) => {
      exec(`${pythonPath} "${scriptPath}" "${topic}"`, { cwd: backendDir }, (err, stdout, stderr) => {
        if (err) reject(stderr);
        else resolve(stdout);
      });
    });

    // Read result file
    const resultPath = path.join(backendDir, "topic_matches.json");
    const matches = await fs.readFile(resultPath, "utf-8");
    return NextResponse.json(JSON.parse(matches));
  } catch (err) {
    console.error("Topic match error:", err);
    return NextResponse.json({ error: "Topic match failed" }, { status: 500 });
  }
}