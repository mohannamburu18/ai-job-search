"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  Search,
  Code,
  Sparkles
} from "lucide-react";

export default function AtsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [keywordsInput, setKeywordsInput] = useState(
    "Python, TypeScript, React, Next.js, FastAPI, Docker, Kubernetes, CI/CD"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file to audit.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const keywordList = keywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await api.verifyAts(file, keywordList);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze PDF text layer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">pypdf Text-Layer Inspector</Badge>
          <span className="text-xs text-slate-400">tools/verify_pdf.py Engine</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          ATS Health & Text-Layer Auditor
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Automated Applicant Tracking Systems parse raw PDF text streams. This tool verifies your PDF exposes readable, uncorrupted, single-stream text without multi-column parsing collisions.
        </p>
      </div>

      {/* Upload and Keyword Input Card */}
      <GlassCard className="p-6">
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* File drop zone */}
            <div className="border-2 border-dashed border-white/15 rounded-2xl p-6 text-center hover:border-cyan-400/50 transition-colors bg-white/[0.02]">
              <UploadCloud className="w-8 h-8 text-cyan-accent mx-auto mb-2" />
              <label className="text-xs font-semibold text-white block mb-1 cursor-pointer">
                {file ? file.name : "Select Resume PDF to Audit"}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports standard PDF exports"}
              </span>
            </div>

            {/* Keyword checks */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white uppercase tracking-wider">
                Expected Keywords (Comma-separated)
              </label>
              <textarea
                rows={3}
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="Python, React, AWS, Docker..."
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              />
              <p className="text-[11px] text-slate-400">
                The auditor checks if these exact terms are indexable by the ATS parser.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-white/10">
            <button
              type="submit"
              disabled={loading || !file}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Execute ATS Inspection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Audit Result Display */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Ring Card */}
            <GlassCard variant="glow" glowColor={result.is_ats_friendly ? "emerald" : "amber"} className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <ScoreRing score={result.score || 95} size={100} strokeWidth={8} sublabel="ATS Health" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  {result.is_ats_friendly ? "ATS Compliant" : "Potential Issues Detected"}
                </div>
                <p className="text-[11px] text-slate-400">
                  {result.pages_count} page(s) analyzed • {result.text_length} characters extracted
                </p>
              </div>
            </GlassCard>

            {/* Keyword Match Card */}
            <GlassCard className="p-6 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Indexed Keyword Coverage
                </span>
                <Badge variant={result.matched_keywords?.length > 0 ? "success" : "secondary"}>
                  {result.matched_keywords?.length || 0} / {(result.matched_keywords?.length || 0) + (result.missing_keywords?.length || 0)} Found
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {result.matched_keywords?.map((k: string) => (
                  <Badge key={k} variant="success" size="sm">
                    ✓ {k}
                  </Badge>
                ))}
                {result.missing_keywords?.map((k: string) => (
                  <Badge key={k} variant="warning" size="sm">
                    ✗ {k}
                  </Badge>
                ))}
              </div>

              {result.warnings && result.warnings.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Diagnostics & Warnings:
                  </span>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    {result.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Raw Text Stream Inspector */}
          <GlassCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-accent" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Raw Physical Text Stream (What the ATS Robot Sees)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">pypdf extracted</span>
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[320px] whitespace-pre-wrap leading-relaxed">
              {result.extracted_text_preview || "No readable text stream detected in document."}
            </pre>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

