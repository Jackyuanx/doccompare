import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(_req: NextRequest) {
  return new Promise<NextResponse>((resolve) => {
    const py = spawn(
      "/Users/eulogaste/doc-compare/.venv/bin/python",
      [path.resolve("backend", "main.py")]
    );

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => {
      stdout += d.toString();
      console.log("PYTHON STDOUT:", d.toString());
    });

    py.stderr.on("data", (d) => {
      stderr += d.toString();
      console.error("PYTHON STDERR:", d.toString());
    });

    py.on("close", (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(stdout);
          resolve(NextResponse.json(parsed));
        } catch (e) {
          console.error("JSON PARSE ERROR:", e, "RAW OUTPUT:", stdout);
          resolve(NextResponse.json({ error: "Invalid JSON", raw: stdout }, { status: 500 }));
        }
      } else {
        console.error("PYTHON EXIT CODE:", code, "STDERR:", stderr);
        resolve(NextResponse.json({ error: "Python failed", stderr }, { status: 500 }));
      }
    });
  });
}