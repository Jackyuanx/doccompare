
import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST() {
  const backendDir = path.resolve(process.cwd(), "backend-manual");
  const pythonPath = path.resolve(process.cwd(), ".venv/bin/python");

  try {
    await new Promise((resolve, reject) => {
      exec(`${pythonPath} pipeline.py`, { cwd: backendDir }, (err, stdout, stderr) => {
        if (err) reject(stderr);
        else resolve(stdout);
      });
    });

    const file = await fs.readFile(path.join(backendDir, "output.json"), "utf-8");
    const data = JSON.parse(file);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Manual pipeline failed:", err);
    return NextResponse.json({ error: "Pipeline error" }, { status: 500 });
  }
}