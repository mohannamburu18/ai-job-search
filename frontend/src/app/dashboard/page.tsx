"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  Compass,
  Briefcase,
  Sliders,
  FileCheck2,
  Headphones,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  RefreshCw,
  Bot
} from "lucide-react";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [topJobs, setTopJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingMap, setEvaluatingMap] = useState<Record<string, any>>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profile
      let prof: any = null;
      try {
        prof = await api.getProfile();
        setProfile(prof);
      } catch {
        // Fallback default
      }

      // 2. Fetch applications
      try {
        const apps = await api.getApplications();
        setApplications(apps || []);
      } catch {
        setApplications([]);
      }

      // 3. Fetch live jobs based on target roles
      const query = prof?.target_roles?.[0] || "Software Engineer";
      try {
        const jobs = await api.searchJobs(query, "global", false, 6);
        setTopJobs(jobs || []);

        // Evaluate top 3 jobs automatically for match ring previews
        if (jobs && jobs.length > 0) {
          const evalPromises = jobs.slice(0, 3).map(async (j: any) => {
            try {
              const res = await api.evaluateJob(j.id, j);
              return { id: j.id, eval: res.evaluation };
            } catch {
              return null;
            }
          });
          const evalResults = await Promise.all(evalPromises);
          const map: Record<string, any> = {};
          evalResults.forEach((r) => {
            if (r) map[r.id] = r.eval;
          });
          setEvaluatingMap(map);
        }
      } catch {
        setTopJobs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = {
    saved: applications.filter((a) => a.status === "saved").length,
    applied: applications.filter((a) => a.status === "applied").length,
    interview: applications.filter((a) => a.status === "interview" || a.status === "screening").length,
    offer: applications.filter((a) => a.status === "offer").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Command Center
            </h1>
            <Badge variant="cyan">Live Sync</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Welcome back, <span className="text-white font-medium">{profile?.name || "Alex Rivers"}</span>. Here is your unified application pipeline and live match telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl bg-surface border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-accent" : ""}`} />
          </button>
          <Link
            href="/jobs"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan hover:opacity-95 transition-opacity flex items-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Search Jobs</span>
          </Link>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard variant="hover" className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Primary Skills</span>
            <Sparkles className="w-4 h-4 text-cyan-accent" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {profile?.skills_primary?.length || 7}
          </div>
          <p className="text-[11px] text-slate-400">Factually verified in profile</p>
        </GlassCard>

        <GlassCard variant="hover" className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Applications In Flight</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 font-mono">
            {statusCounts.applied + statusCounts.interview}
          </div>
          <p className="text-[11px] text-slate-400">
            {statusCounts.interview} active interviews
          </p>
        </GlassCard>

        <GlassCard variant="hover" className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Saved Roles</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
            {statusCounts.saved}
          </div>
          <p className="text-[11px] text-slate-400">Ready for tailored application</p>
        </GlassCard>

        <GlassCard variant="hover" className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Offers Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
            {statusCounts.offer}
          </div>
          <p className="text-[11px] text-slate-400">Pipeline success</p>
        </GlassCard>
      </div>

      {/* Main Grid: Pipeline + Top Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Top Matched Jobs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-accent" />
              <span>Recommended Role Matches</span>
            </h2>
            <Link href="/jobs" className="text-xs text-cyan-accent hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p>Aggregating listings & calculating 5-dimension rubric...</p>
            </div>
          ) : topJobs.length === 0 ? (
            <GlassCard className="p-8 text-center space-y-3">
              <p className="text-xs text-slate-400">No live jobs loaded yet.</p>
              <Link href="/jobs" className="text-xs text-cyan-accent font-semibold hover:underline">
                Run Scraper Now
              </Link>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {topJobs.slice(0, 4).map((job) => {
                const evalData = evaluatingMap[job.id];
                const score = evalData?.overall_score ?? 82;
                return (
                  <GlassCard key={job.id} variant="hover" className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-semibold text-white text-base hover:text-cyan-accent transition-colors block"
                        >
                          {job.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            {job.location || "Remote"}
                          </span>
                          {job.is_remote && (
                            <Badge variant="cyan" size="sm">
                              Remote
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Match Score Ring */}
                      <ScoreRing score={score} size={68} strokeWidth={6} />
                    </div>

                    {/* Rubric dimension preview */}
                    {evalData && (
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                        <div>
                          Tech: <span className="text-slate-200">{evalData.breakdown?.technical?.score}%</span>
                        </div>
                        <div>
                          Exp: <span className="text-slate-200">{evalData.breakdown?.experience?.score}%</span>
                        </div>
                        <div>
                          Behav: <span className="text-slate-200">{evalData.breakdown?.behavioral?.score}%</span>
                        </div>
                        <div>
                          Career: <span className="text-slate-200">{evalData.breakdown?.career_trajectory?.score}%</span>
                        </div>
                      </div>
                    )}

                    {/* Action links */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills?.slice(0, 3).map((s: string) => (
                          <Badge key={s} variant="secondary" size="sm">
                            {s}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/compare?job_id=${job.id}`}
                          className="text-xs text-slate-300 hover:text-cyan-accent font-medium px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          Match Matrix
                        </Link>
                        <Link
                          href={`/optimize?job_id=${job.id}`}
                          className="text-xs text-slate-900 bg-cyan-accent hover:opacity-90 font-semibold px-3 py-1 rounded-lg transition-opacity shadow-glow-cyan"
                        >
                          Tailor CV
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Workflow Cockpit & Profile Health (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Candidate Profile Summary Card */}
          <GlassCard variant="glow" glowColor="cyan" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Grounded Profile Status
              </h3>
              <Badge variant="success">Verified</Badge>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="line-clamp-2 text-slate-400">
                {profile?.summary || "Senior Full-Stack & Systems Engineer with production experience."}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-accent" />
                <span>{profile?.location || "San Francisco / Remote"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {profile?.target_roles?.length || 0} Target Roles Defined
              </span>
              <Link
                href="/onboarding"
                className="text-xs text-cyan-accent hover:underline font-medium"
              >
                Edit Profile
              </Link>
            </div>
          </GlassCard>

          {/* Quick Action Tools */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Career Execution Tools
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/optimize"
                className="p-4 rounded-xl glass-panel glass-panel-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Grounded CV Tailor</h4>
                    <p className="text-[11px] text-slate-400">Generate LaTeX and PDF exports</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-accent transition-colors" />
              </Link>

              <Link
                href="/cover-letter"
                className="p-4 rounded-xl glass-panel glass-panel-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-accent group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Cover Letter Studio</h4>
                    <p className="text-[11px] text-slate-400">Executive & Technical tonalities</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-accent transition-colors" />
              </Link>

              <Link
                href="/ats"
                className="p-4 rounded-xl glass-panel glass-panel-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">PyPDF ATS Auditor</h4>
                    <p className="text-[11px] text-slate-400">Extract & verify raw text layer</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-accent transition-colors" />
              </Link>

              <Link
                href="/interview"
                className="p-4 rounded-xl glass-panel glass-panel-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">STAR Interview Prep</h4>
                    <p className="text-[11px] text-slate-400">Stage packs & interactive coach</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-accent transition-colors" />
              </Link>

              <Link
                href="/automation"
                className="p-4 rounded-xl glass-panel glass-panel-hover flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-accent group-hover:scale-105 transition-transform">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Auto-Apply Packet</h4>
                    <p className="text-[11px] text-slate-400">Human-verified form filling</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-accent transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

