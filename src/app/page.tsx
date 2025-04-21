'use client';

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * src/app/page.tsx – App Router version of the prototype comparison page
 * ----------------------------------------------------------------------
 * ‣ Assumes two sample docs are placed in /public/docA.txt & /public/docB.txt
 * ‣ Renders them side‑by‑side (or stacked on mobile) in scrollable cards
 * ‣ Uses Tailwind for styling; shadcn/ui Card for chrome
 */

export default function ComparePage() {
  const [docA, setDocA] = useState<string>("");
  const [docB, setDocB] = useState<string>("");

  useEffect(() => {
    // Fetch both docs in parallel, once, on mount
    Promise.all([
      fetch("/docA.txt").then((r) => r.text()),
      fetch("/docB.txt").then((r) => r.text()),
    ]).then(([a, b]) => {
      setDocA(a);
      setDocB(b);
    });
  }, []);

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Document Comparison Prototype</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A */}
        <Card className="h-[75vh] flex flex-col">
          <CardHeader>
            <CardTitle>Document A</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto whitespace-pre-wrap">
            {docA}
          </CardContent>
        </Card>

        {/* Document B */}
        <Card className="h-[75vh] flex flex-col">
          <CardHeader>
            <CardTitle>Document B</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto whitespace-pre-wrap">
            {docB}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
