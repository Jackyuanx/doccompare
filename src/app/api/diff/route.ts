import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  /* ---------- read body ---------- */
  const {
    topic,
    sentencesA,
    sentencesB,
    docA,          // optional
    docB,          // optional
  } = (await req.json()) as {
    topic: string;
    sentencesA: string[];
    sentencesB: string[];
    docA?: string;
    docB?: string;
  };

  /* ---------- build prompt ---------- */
  let prompt = `
Compare the two sets of excerpts on the topic **"${topic}"**.

1. Explain key differences (tone, data, policy stance, etc.).
2. Mention anything unique to either document if both documents are present.

--- Document A Sentences (${sentencesA.length}) ---
${sentencesA.join(" ")}

--- Document B Sentences (${sentencesB.length}) ---
${sentencesB.join(" ")}
`;

  if (docA && docB) {
    prompt += `

You also have the full context of each document below.  Use it only
when it genuinely improves the comparison, otherwise keep the answer concise.

=== Full Document A (context) ===
${docA}

=== Full Document B (context) ===
${docB}
`;
  }

  /* ---------- call OpenAI ---------- */
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    return NextResponse.json({
      text: chat.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "OpenAI request failed" },
      { status: 500 },
    );
  }
}
