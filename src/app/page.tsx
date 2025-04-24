"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ---------- helpers ---------- */

type TopicRow = {
  id: number;
  text: string;
  responses: string;        // topic label
  source?: "A" | "B";       // optional if backend adds this
};

const split = (txt: string) =>
  txt
    .split(/(?<=[.!?])\s+/) // very simple sentence splitter
    .filter(Boolean);

/* ---------- page ---------- */

export default function ComparePage() {
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [clusters, setClusters] = useState(5);
  const [rows, setRows] = useState<TopicRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // topic selected

  /* fetch docs once */
  useEffect(() => {
    Promise.all([
      fetch("/docA.txt").then((r) => r.text()),
      fetch("/docB.txt").then((r) => r.text()),
    ]).then(([a, b]) => {
      setDocA(a);
      setDocB(b);
    });
  }, []);

  /* run TopicGPT */
  const handleRun = async () => {
    try {
      const res = await fetch("/api/topic_gpt", { method: "POST" });
      if (!res.ok) throw new Error("TopicGPT failed");
      const data: TopicRow[] = await res.json();
      setRows(data);
      setSelected(null); // reset highlight
    } catch (err) {
      console.error(err);
      alert("TopicGPT run failed – see console");
    }
  };

  /* group rows by topic */
  const topics = useMemo(() => {
    const map: Record<string, TopicRow[]> = {};
    rows.forEach((r) => (map[r.responses] ??= []).push(r));
    return map;
  }, [rows]);

  /* sets for quick highlighting */
  const highlightSet = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(topics[selected]?.map((r) => r.text));
  }, [selected, topics]);

  /* sentence arrays for rendering */
  const docASent = useMemo(() => split(docA), [docA]);
  const docBSent = useMemo(() => split(docB), [docB]);

  /* ---------- render ---------- */

  return (
    <main className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-center">
        Document Comparison Prototype
      </h1>

      {/* control panel */}
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1">
            <label htmlFor="clusters" className="text-sm font-medium">
              Number of clusters
            </label>
            <Input
              id="clusters"
              type="number"
              value={clusters}
              min={1}
              onChange={(e) =>
                setClusters(parseInt(e.target.value || "0", 10))
              }
            />
          </div>
          <Button className="w-full md:w-auto" onClick={handleRun}>
            Run
          </Button>
        </CardContent>
      </Card>

      {/* topic palette */}
      {Object.keys(topics).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(topics).map(([topic, arr]) => (
            <Button
              key={topic}
              variant={selected === topic ? "secondary" : "outline"}
              onClick={() => setSelected(topic)}
            >
              {topic} ({arr.length})
            </Button>
          ))}
          <Button
            variant={selected === null ? "secondary" : "outline"}
            onClick={() => setSelected(null)}
          >
            Clear
          </Button>
        </div>
      )}

      {/* documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocCard
          title="Document A"
          sentences={docASent}
          highlight={highlightSet}
        />
        <DocCard
          title="Document B"
          sentences={docBSent}
          highlight={highlightSet}
        />
      </div>
    </main>
  );
}

/* ---------- sub-component for a document ---------- */

function DocCard({
  title,
  sentences,
  highlight,
}: {
  title: string;
  sentences: string[];
  highlight: Set<string>;
}) {
  return (
    <Card className="h-[75vh] flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto leading-relaxed space-y-2">
        {sentences.map((s, i) => (
          <span
            key={i}
            className={highlight.has(s) ? "bg-yellow-200" : ""}
          >
            {s + " "}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}
