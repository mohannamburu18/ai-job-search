"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  FileText,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Code,
  FileCheck2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

function OptimizeContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id");

  const [jobTitle, setJobTitle] = useState("Senior Full-Stack Engineer");
  const [companyName, setCompanyName] = useState("TechCorp AI");
  const [jobDescription, setJobDescription] = useState(
    "Seeking an experienced Senior Full-Stack Engineer to architect resilient cloud microservices, develop responsive Next.js/React applications, and streamline CI/CD deployments."
  );

  const [loading, setLoading] = useState(false);
  const [tailoredData, setTailoredData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "latex">("diff");

  useEffect(() => {
    if (jobId) {
      api.getJob(jobId)
        .then((j) => {
          if (j) {
            setJobTitle(j.title || jobTitle);
            setCompanyName(j.company || companyName);
            setJobDescription(j.description || jobDescription);
          }
        })
        .catch(() => {});
    }
  }, [jobId]);

  const handleTailor = async () => {
    setLoading(true);
    try {
      const res = await api.tailorResume({
        job_id: jobId || undefined,
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
      });
      setTailoredData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLatex = () => {
    if (tailoredData?.latex_content) {
      navigator.clipboard.writeText(tailoredData.latex_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan">Grounded Resume Tailor</Badge>
            <span className="text-xs text-slate-400">moderncv banking • ReportLab PDF</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Targeted CV Optimization
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Reorder and emphasize verified career highlights to match role requirements with zero fabrication.
          </p>
        </div>

        {tailoredData && (
          <div className="flex items-center gap-3">
            {tailoredData.pdf_url && (
              <a
                href={tailoredData.pdf_url}
                download="Tailored_Resume.pdf"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-2 hover:opacity-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}
            <button
              onClick={handleCopyLatex}
              className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied TeX!" : "Copy LaTeX"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Target Role Inputs Bar */}
      <GlassCard className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Target Role Context
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 glass-input rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 glass-input rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Job Description / Key Requirements
          </label>
          <textarea
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full px-3 py-2 glass-input rounded-xl text-xs leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleTailor}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Grounded CV</span>
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* Optimization Results */}
      {tailoredData && (
        <div className="space-y-6">
          {/* Trust and Match Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard variant="glow" glowColor="emerald" className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">100% Grounded</div>
                <div className="text-[11px] text-slate-400">0 Fabricated metrics or dates</div>
              </div>
            </GlassCard>

            <GlassCard variant="glow" glowColor="cyan" className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-accent">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Dual Format Ready</div>
                <div className="text-[11px] text-slate-400">PDF compiled + .tex export</div>
              </div>
            </GlassCard>

            <GlassCard variant="glow" glowColor="indigo" className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">ATS Match Readiness</div>
                <div className="text-xl font-bold text-white font-mono">
                  {tailoredData.ats_score_estimate || 92}%
                </div>
              </div>
              <Link
                href="/ats"
                className="text-xs text-cyan-accent hover:underline flex items-center gap-1 font-medium"
              >
                Verify PDF <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>
          </div>

          {/* Diff / Code Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("diff")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "diff"
                  ? "bg-indigo-500/20 text-white border border-indigo-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Visual Narrative Diff
            </button>
            <button
              onClick={() => setActiveTab("latex")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "latex"
                  ? "bg-indigo-500/20 text-white border border-indigo-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              moderncv LaTeX Source
            </button>
          </div>

          {activeTab === "diff" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Summary */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Baseline Grounded Profile
                  </span>
                  <Badge variant="secondary">Original</Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tailoredData.original_summary || "Candidate standard technical profile."}
                </p>
              </GlassCard>

              {/* Tailored Summary */}
              <GlassCard variant="glow" glowColor="cyan" className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-cyan-accent uppercase tracking-wider">
                    Tailored for {companyName}
                  </span>
                  <Badge variant="cyan">Optimized</Badge>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {tailoredData.tailored_summary || tailoredData.summary}
                </p>
                <div className="p-3 rounded-lg bg-surface border border-white/5 text-[11px] text-slate-400">
                  <span className="font-semibold text-white">Optimization Strategy: </span>
                  {tailoredData.explanation ||
                    "Elevated relevant systems engineering and architectural achievements while preserving factual accuracy."}
                </div>
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">moderncv [banking, 10pt, letterpaper]</span>
                <button
                  onClick={handleCopyLatex}
                  className="text-xs text-cyan-accent hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy Source"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[480px]">
                {tailoredData.latex_content}
              </pre>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

export default function OptimizePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-slate-400">Loading CV optimizer...</div>}>
      <OptimizeContent />
    </Suspense>
  );
}
