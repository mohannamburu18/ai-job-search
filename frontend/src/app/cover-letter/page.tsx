"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Building2,
  FileText,
  Sliders,
  Send
} from "lucide-react";

function CoverLetterContent() {
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get("title") || "Senior Full-Stack Engineer";
  const initialCompany = searchParams.get("company") || "Innovative AI Corp";
  const initialJobId = searchParams.get("job_id") || "";

  const [jobTitle, setJobTitle] = useState(initialTitle);
  const [companyName, setCompanyName] = useState(initialCompany);
  const [jobDescription, setJobDescription] = useState(
    "Looking for a Senior Engineer who excels at designing distributed web applications, optimizing performance, and collaborating across cross-functional teams."
  );
  const [tone, setTone] = useState("confident");
  const [customNotes, setCustomNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<any>(null);
  const [editableBody, setEditableBody] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialJobId) {
      api.getJob(initialJobId)
        .then((j) => {
          if (j) {
            setJobTitle(j.title || jobTitle);
            setCompanyName(j.company || companyName);
            setJobDescription(j.description || jobDescription);
          }
        })
        .catch(() => {});
    }
  }, [initialJobId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.generateCoverLetter({
        job_id: initialJobId || undefined,
        job_title: jobTitle,
        company_name: companyName,
        job_description: jobDescription,
        tone,
        custom_notes: customNotes || undefined,
      });
      setGeneratedLetter(res);
      setEditableBody(res.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan">Cover Letter Studio</Badge>
            <span className="text-xs text-slate-400">cover.cls LaTeX • ReportLab PDF</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Tailored Cover Letter
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Synthesizes your real accomplishments with the company's technical mission without generic clichés.
          </p>
        </div>

        {generatedLetter && (
          <div className="flex items-center gap-3">
            {generatedLetter.pdf_url && (
              <a
                href={generatedLetter.pdf_url}
                download="Cover_Letter.pdf"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-2 hover:opacity-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Position Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Voice & Tonal Style
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs bg-surface text-white"
              >
                <option value="confident">Confident & Direct</option>
                <option value="analytical">Analytical & Metric-Focused</option>
                <option value="conversational">Conversational & Collaborative</option>
                <option value="executive">Executive & Strategic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Angle / Hook (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Passion for distributed storage, long-time user of your API..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Job Context / Posting Snippet
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs leading-relaxed"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Draft Grounded Letter</span>
                </>
              )}
            </button>
          </GlassCard>
        </div>

        {/* Right Editor & Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard variant="glow" glowColor="cyan" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Document Preview & Editor
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {editableBody ? `${editableBody.split(/\s+/).filter(Boolean).length} words` : "Empty"}
              </span>
            </div>

            {loading ? (
              <div className="p-20 text-center text-xs text-slate-400 space-y-2">
                <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <p>Synthesizing grounded narrative with {companyName}...</p>
              </div>
            ) : editableBody ? (
              <textarea
                rows={16}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                className="w-full p-4 glass-input rounded-xl text-xs font-sans leading-relaxed text-slate-200 focus:border-cyan-400/50"
              />
            ) : (
              <div className="p-20 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-600" />
                <p>Click "Draft Grounded Letter" to generate a position-tailored cover letter.</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-12 text-center text-xs text-slate-400">Loading cover letter studio...</div>}>
      <CoverLetterContent />
    </Suspense>
  );
}
