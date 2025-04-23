"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ComparePage() {
  const [docA, setDocA] = useState<string>("");
  const [docB, setDocB] = useState<string>("");
  const [clusters, setClusters] = useState<number>(5);

  // Fetch documents once on mount
  useEffect(() => {
    Promise.all([
      fetch("/docA.txt").then((r) => r.text()),
      fetch("/docB.txt").then((r) => r.text()),
    ]).then(([a, b]) => {
      setDocA(a);
      setDocB(b);
    });
  }, []);

  const handleRun = () => {
    // TODO: replace with actual clustering call
    console.log("Run clustering with", clusters, "clusters");
  };

  return (
    <main className="container mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-center">Document Comparison Prototype</h1>

      {/* Control panel */}
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
              onChange={(e) => setClusters(parseInt(e.target.value || "0", 10))}
              placeholder="e.g. 6"
            />
          </div>
          <Button className="w-full md:w-auto" onClick={handleRun}>
            Run
          </Button>
        </CardContent>
      </Card>
      
      {/* Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doc A */}
        <Card className="h-[75vh] flex flex-col">
          <CardHeader>
            <CardTitle>Document A</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto whitespace-pre-wrap">
            {docA || "Loading…"}
          </CardContent>
        </Card>

        {/* Doc B */}
        <Card className="h-[75vh] flex flex-col">
          <CardHeader>
            <CardTitle>Document B</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto whitespace-pre-wrap">
            {docB || "Loading…"}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}