"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Briefcase
} from "lucide-react";
import Link from "next/link";

function CompareContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job_id") || "";

  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      const prof = await api.getProfile();
      setProfile(prof);

      const jobList = await api.searchJobs(prof?.target_roles?.[0] || "Full Stack", "global", false, 15);
      setJobs(jobList || []);

      const targetId = initialJobId || (jobList?.[0]?.id ?? "");
      if (targetId) {
        setSelectedJobId(targetId);
        const match = jobList?.find((j: any) => j.id === targetId);
        if (match) {
          setSelectedJob(match);
          evaluateMatch(targetId, match);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    const match = jobs.find((j) => j.id === jobId);
    if (match) {
      setSelectedJob(match);
      evaluateMatch(jobId, match);
    }
  };

  const evaluateMatch = async (jobId: string, jobObj: any) => {
    setEvaluating(true);
    try {
      const res = await api.evaluateJob(jobId, jobObj);
      setEvaluation(res.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const candidateSkills = [
    ...(profile?.skills_primary || ["Python", "TypeScript", "React", "FastAPI"]),
    ...(profile?.skills_secondary || ["Docker", "AWS", "PostgreSQL"]),
  ];

  const matchedSkills = evaluation?.matched_skills || [
    ...candidateSkills.filter((s) =>
      selectedJob?.skills?.some((js: string) => js.toLowerCase() === s.toLowerCase())
    ),
  ];

  const missingSkills = evaluation?.missing_skills || [
    ...(selectedJob?.skills || []).filter(
      (js: string) => !candidateSkills.some((cs) => cs.toLowerCase() === js.toLowerCase())
    ),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge variant="cyan">Match Matrix Analysis</Badge>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Profile vs. Role Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Compare verified candidate capabilities directly against target posting specifications.
          </p>
        </div>

        {/* Job Selector Dropdown */}
        <div className="w-full md:w-72">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Selected Target Role:
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobSelect(e.target.value)}
            className="w-full px-3 py-2 glass-input rounded-xl text-xs bg-surface text-white"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.company} — {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Comparison Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Candidate Grounded Profile (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard variant="glow" glowColor="indigo" className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {profile?.name || "Candidate Profile"}
                </h3>
                <span className="text-xs text-indigo-400 font-mono">
                  Grounded Knowledge Base
                </span>
              </div>
              <Badge variant="success">Verified</Badge>
            </div>

            {/* Candidate Core Competencies */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Primary Technologies ({profile?.skills_primary?.length || 0})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.skills_primary || ["Python", "TypeScript", "React", "FastAPI"]).map(
                  (s: string) => (
                    <Badge key={s} variant="primary" size="sm">
                      {s}
                    </Badge>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Secondary & Cloud ({profile?.skills_secondary?.length || 0})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(profile?.skills_secondary || ["Docker", "Kubernetes", "AWS", "PostgreSQL"]).map(
                  (s: string) => (
                    <Badge key={s} variant="secondary" size="sm">
                      {s}
                    </Badge>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-4">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Target Role Fit
              </label>
              <p className="text-xs text-slate-400 leading-relaxed">
                {profile?.summary || "Senior Full-Stack & Systems Engineer with production experience."}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/onboarding"
                className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Edit Grounded Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Job Posting & Semantic Overlap (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard variant="glow" glowColor="cyan" className="space-y-6">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedJob?.title || "Select a role"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-accent" />
                  <span className="text-slate-200 font-medium">{selectedJob?.company}</span>
                  <span>•</span>
                  <span>{selectedJob?.location || "Remote"}</span>
                </div>
              </div>

              {evaluation && (
                <ScoreRing
                  score={evaluation.overall_score}
                  size={74}
                  strokeWidth={6}
                  sublabel="Score"
                />
              )}
            </div>

            {/* Overlap Matrix */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Matched Requirements ({matchedSkills.length})
                  </span>
                  <span className="text-slate-400 font-mono">Direct Alignment</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.length > 0 ? (
                    matchedSkills.map((s: string) => (
                      <Badge key={s} variant="success" size="sm">
                        ✓ {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No exact tech matches found</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Unmatched / Potential Gaps ({missingSkills.length})
                  </span>
                  <span className="text-slate-400 font-mono">Requires Highlighting Adjacent Exp</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.length > 0 ? (
                    missingSkills.map((s: string) => (
                      <Badge key={s} variant="warning" size="sm">
                        ! {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium">100% Skill Coverage!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Grounded Recommendation Section */}
            <div className="p-4 rounded-xl bg-surface/90 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-accent">
                <ShieldCheck className="w-4 h-4" />
                <span>Ethical Tailoring Strategy</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Do not add missing technologies you haven't used. Instead, emphasize your experience with adjacent tools (e.g. FastAPI/Python architectural principles map closely to modern backend services) and quantify past scaling achievements.
              </p>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href={`/optimize?job_id=${selectedJobId}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-1.5 hover:opacity-95"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Tailor CV for this Position</span>
              </Link>
              <Link
                href={`/cover-letter?job_id=${selectedJobId}&title=${encodeURIComponent(selectedJob?.title || "")}&company=${encodeURIComponent(selectedJob?.company || "")}`}
                className="px-4 py-2.5 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-accent" />
                <span>Generate Cover Letter</span>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-slate-400">Loading match matrix...</div>}>
      <CompareContent />
    </Suspense>
  );
}
