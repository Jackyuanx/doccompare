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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";          
import { Switch } from "@/components/ui/switch";
type TopicRow = { id: number; text: string; responses: string };

const splitSentences = (txt: string) =>
  txt.replace(/\r?\n/g, " ").split(/(?<=[.!?])\s+/).filter(Boolean);


export default function ComparePage() {
  /* ───────── state ───────── */
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [rows, setRows] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(true);    // “With documents” toggle
  const [diffText, setDiffText] = useState("");      // comparison result
  const [diffLoading, setDiffLoading] = useState(false);

  /* ───────── fetch docs ───────── */
  useEffect(() => {
    Promise.all([
      fetch("/docA.txt").then((r) => r.text()),
      fetch("/docB.txt").then((r) => r.text()),
    ]).then(([a, b]) => {
      setDocA(a);
      setDocB(b);
    });
  }, []);

  async function handleDiff(
    sentencesA: string[],
    sentencesB: string[],
    topic: string
  ) {
    setDiffLoading(true);
    try {
      const res = await fetch("/api/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          sentencesA,
          sentencesB,
          // ✅ only send docs when toggle is on
          docA: showDocs ? docA : undefined,
          docB: showDocs ? docB : undefined,
        }),
      });
      const data = await res.json();
      setDiffText(data.text ?? "Error getting diff");
    } catch (e) {
      console.error(e);
      setDiffText("Diff failed");
    } finally {
      setDiffLoading(false);
    }
  }
  

  /* ───────── run TopicGPT ───────── */
  const handleRun = async () => {
    setSelected(null);
    setLoading(true);
    try {
      const res = await fetch("/api/topic_gpt", { method: "POST" });
      if (!res.ok) throw new Error("TopicGPT failed");
      const data: TopicRow[] = await res.json();
      setRows(data);
    } catch (e) {
      console.error(e);
      alert("TopicGPT run failed – see console");
    } finally {
      setLoading(false);
    }
  };

  /* ───────── data derived ───────── */
  const topics = useMemo(() => {
    const m: Record<string, TopicRow[]> = {};
    rows.forEach((r) => (m[r.responses] ??= []).push(r));
    return m;
  }, [rows]);

  const highlightIds = useMemo(() => {
    if (!selected) return new Set<number>();
    return new Set(topics[selected]?.map((r) => r.id));
  }, [selected, topics]);

  const docASent = useMemo(() => splitSentences(docA), [docA]);
  const docBSent = useMemo(() => splitSentences(docB), [docB]);
  const offsetB = docASent.length;

  /* ───────── render ───────── */
  return (
    <main className="container mx-auto p-6 space-y-8">
      {/* progress bar */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 overflow-hidden">
          <div className="h-full bg-blue-500 animate-[progress_1.2s_linear_infinite]" />
        </div>
      )}

      <h1 className="text-2xl font-semibold text-center">
        Document Comparison Prototype
      </h1>

      {/* control */}
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* <div className="flex-1 space-y-1">
            <label htmlFor="clusters" className="text-sm font-medium">
              Number of clusters
            </label>
            <Input
              id="clusters"
              type="number"
              value={clusters}
              min={1}
              disabled={loading}
              onChange={(e) =>
                setClusters(parseInt(e.target.value || "0", 10))
              }
            />
          </div> */}
          <Button onClick={handleRun} disabled={loading}>
            {loading ? "Running…" : "Run"}
          </Button>
        </CardContent>
      </Card>

      {/* topic chips */}
      {Object.keys(topics).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Switch
            checked={showDocs}
            onCheckedChange={setShowDocs}
            id="docs-toggle"
          />
          <label htmlFor="docs-toggle" className="text-sm">
            With documents
          </label>
          {Object.entries(topics).map(([topic, arr]) => (
            
            <Button
              key={topic}
              variant={selected === topic ? "secondary" : "outline"}
              disabled={loading}
              onClick={() => {
                setSelected(topic);
              }}
            >
              {topic} ({arr.length})
            </Button>
          ))}
          <Button
            variant={selected ? "outline" : "secondary"}
            onClick={() => setSelected(null)}
          >
            Clear
          </Button>
        </div>
      )}

      
<div
  className={`grid gap-6 ${
    selected ? "md:grid-cols-3" : "md:grid-cols-2"
  } grid-cols-1`}
>
  {/* Doc A */}
  <DocCard
    title="Document A"
    sentences={docASent}
    offset={0}
    highlightIds={highlightIds}
  />

  {/* ⬅️ Middle topic card (only when a topic is selected) */}
  {selected && (
  <Card className="h-[75vh] flex flex-col">
    <CardHeader>
      <CardTitle>{selected}</CardTitle>
    </CardHeader>

    <CardContent className="flex-1 overflow-y-auto space-y-3">
      {topics[selected].map((r) => {
        const source = r.id < offsetB ? "A" : "B";
        return (
          <p
            key={r.id}
            className="text-sm whitespace-pre-wrap rounded border p-2 flex gap-2 bg-muted"
          >
            <span className="font-mono text-xs px-1 py-0.5 rounded bg-blue-200">
              {source}
            </span>
            {r.text}
          </p>
        );
      })}

      {/* diff output */}
      {diffText && (
        <div className="mt-4 p-3 rounded border bg-white whitespace-pre-wrap text-sm">
          {diffText}
        </div>
      )}
    </CardContent>

    <div className="p-4 border-t">
    <Button
  variant="secondary"
  className="w-full"
  disabled={diffLoading}
  onClick={() => {
    const arr = topics[selected];          // all rows for this topic
    const aSents = arr
      .filter((x) => x.id < offsetB)
      .map((x) => x.text);
    const bSents = arr
      .filter((x) => x.id >= offsetB)
      .map((x) => x.text);

    handleDiff(aSents, bSents, selected);  // pass arrays ⇐
  }}
>
  {diffLoading ? "Diffing…" : "Diff"}
</Button>
    </div>
  </Card>
)}

  {/* Doc B */}
  <DocCard
    title="Document B"
    sentences={docBSent}
    offset={offsetB}
    highlightIds={highlightIds}
  />
</div>
    </main>
  );
}

/* ---------- DocCard ---------- */

function DocCard({
  title,
  sentences,
  offset,
  highlightIds,
}: {
  title: string;
  sentences: string[];
  offset: number;
  highlightIds: Set<number>;
}) {
  return (
    <Card className="h-[75vh] flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto leading-relaxed">
        {sentences.map((s, i) => {
          const id = offset + i;
          return (
            <span key={id} className={highlightIds.has(id) ? "bg-blue-300" : ""}>
              {s + " "}
            </span>
          );
        })}
      </CardContent>
    </Card>
  );
}