"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  Building2,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Headphones,
  Sliders,
  Bot,
  Calendar,
  AlertTriangle
} from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch job
      const j = await api.getJob(jobId);
      setJob(j);

      // 2. Evaluate fit
      const evalRes = await api.evaluateJob(jobId, j);
      setEvaluation(evalRes.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading posting and evaluating 5-dimension rubric...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Job Not Found</h2>
        <Link href="/jobs" className="text-xs text-cyan-accent hover:underline">
          Back to Live Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to listings</span>
      </button>

      {/* Main Header Card */}
      <GlassCard variant="glow" glowColor="cyan" className="p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">{job.portal || "Live Aggregator"}</Badge>
              {job.is_remote && <Badge variant="success">Remote</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Building2 className="w-4 h-4 text-indigo-400" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-4 h-4 text-cyan-400" />
                {job.location || "Remote"}
              </span>
            </div>
          </div>

          {/* Fit Score Ring & External Link */}
          <div className="flex items-center gap-6 self-center lg:self-auto">
            {evaluation && (
              <ScoreRing
                score={evaluation.overall_score}
                size={84}
                strokeWidth={7}
                label="Overall Fit"
              />
            )}
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-2"
              >
                <span>Portal View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap gap-3">
          <Link
            href={`/optimize?job_id=${job.id}`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-1.5 hover:opacity-95"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Tailor Resume</span>
          </Link>
          <Link
            href={`/cover-letter?job_id=${job.id}&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}
            className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-cyan-accent" />
            <span>Draft Cover Letter</span>
          </Link>
          <Link
            href={`/compare?job_id=${job.id}`}
            className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Full Match Matrix</span>
          </Link>
          <Link
            href={`/interview?job_id=${job.id}&title=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`}
            className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-1.5"
          >
            <Headphones className="w-4 h-4 text-emerald-400" />
            <span>STAR Interview Prep</span>
          </Link>
          <Link
            href={`/automation?job_id=${job.id}&url=${encodeURIComponent(job.job_url || "")}`}
            className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-cyan-accent" />
            <span>Auto-Apply Packet</span>
          </Link>
        </div>
      </GlassCard>

      {/* 5-Dimension Rubric Detail Grid */}
      {evaluation && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-accent" />
            <span>5-Dimension Rubric Breakdown</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard variant="hover" className="p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">1. Technical (30%)</span>
                <span className="font-mono text-cyan-accent">{evaluation.breakdown?.technical?.score}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-accent h-full rounded-full"
                  style={{ width: `${evaluation.breakdown?.technical?.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {evaluation.breakdown?.technical?.notes}
              </p>
            </GlassCard>

            <GlassCard variant="hover" className="p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">2. Experience (25%)</span>
                <span className="font-mono text-indigo-400">{evaluation.breakdown?.experience?.score}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-400 h-full rounded-full"
                  style={{ width: `${evaluation.breakdown?.experience?.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {evaluation.breakdown?.experience?.notes}
              </p>
            </GlassCard>

            <GlassCard variant="hover" className="p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">3. Behavioral (15%)</span>
                <span className="font-mono text-emerald-400">{evaluation.breakdown?.behavioral?.score}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full"
                  style={{ width: `${evaluation.breakdown?.behavioral?.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {evaluation.breakdown?.behavioral?.notes}
              </p>
            </GlassCard>

            <GlassCard variant="hover" className="p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">4. Career (30%)</span>
                <span className="font-mono text-cyan-400">{evaluation.breakdown?.career_trajectory?.score}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full"
                  style={{ width: `${evaluation.breakdown?.career_trajectory?.score}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {evaluation.breakdown?.career_trajectory?.notes}
              </p>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Description Content */}
      <GlassCard className="p-8 space-y-4">
        <h3 className="text-base font-bold text-white">Full Role Description</h3>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-normal">
          {job.description}
        </div>
      </GlassCard>
    </div>
  );
}

