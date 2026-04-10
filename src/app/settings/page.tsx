"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";

interface LLMSettings {
  provider: string;
  model: string;
  apiKey: string;
  concurrency: number;
}

const MODELS: Record<string, string[]> = {
  claude: [
    "claude-sonnet-4-20250514",
    "claude-haiku-4-5-20251001",
  ],
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
  ],
  openrouter: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-sonnet-4-20250514",
    "google/gemini-pro-1.5",
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.3-70b-instruct",
  ],
};

const PROVIDER_LABELS: Record<string, string> = {
  claude: "Claude (Anthropic)",
  openai: "OpenAI",
  openrouter: "OpenRouter (多模型聚合)",
};

export default function SettingsPage() {
  const [llm, setLlm] = useState<LLMSettings>({
    provider: "claude",
    model: "claude-sonnet-4-20250514",
    apiKey: "",
    concurrency: 2,
  });
  const [saved, setSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { if (data.llm) setLlm(data.llm); })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to load settings", err);
      });
    return () => controller.abort();
  }, []);

  const handleSave = async () => {
    const { apiKey: _ignored, ...llmWithoutKey } = llm;
    const payload = {
      llm: apiKeyInput ? { ...llmWithoutKey, apiKey: apiKeyInput } : llmWithoutKey,
    };
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaved(true);
        setSaveError(null);
        setApiKeyInput("");
        setTimeout(() => setSaved(false), 2000);
      } else {
        setSaveError("Save failed. Please try again.");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      setSaveError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>LLM Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label id="label-llm-provider" className="mb-2 block">Provider</Label>
            <Select
              value={llm.provider}
              // Base UI Select can emit null on deselect — guard against corrupting state
              onValueChange={(v) => {
                if (v !== null) {
                  const firstModel = MODELS[v]?.[0] ?? "";
                  setLlm({ ...llm, provider: v, model: firstModel });
                }
              }}
            >
              <SelectTrigger aria-labelledby="label-llm-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label id="label-llm-model" className="mb-2 block">Model</Label>
            <Select
              value={llm.model}
              onValueChange={(v) => { if (v !== null) setLlm({ ...llm, model: v }); }}
            >
              <SelectTrigger aria-labelledby="label-llm-model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(MODELS[llm.provider] || []).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="llm-api-key" className="mb-2 block">API Key</Label>
            <Input
              id="llm-api-key"
              type="password"
              placeholder={llm.apiKey ? "***configured*** (enter new to update)" : "sk-ant-..."}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>

          <div>
            <Label id="label-llm-concurrency" className="mb-2 block">Concurrency: {llm.concurrency}</Label>
            <Slider
              aria-label="Concurrency"
              value={[llm.concurrency]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v;
                if (val !== undefined) setLlm({ ...llm, concurrency: val });
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">Number of simultaneous translation requests</p>
          </div>

          <Button onClick={handleSave}>{saved ? "Saved!" : "Save Settings"}</Button>
          {saveError && <p className="text-sm text-destructive mt-2">{saveError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
