"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  Search,
  Briefcase,
  MapPin,
  Building2,
  Filter,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Sliders,
  FileCheck2,
  Calendar,
  AlertCircle
} from "lucide-react";

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery || "Full Stack Engineer");
  const [market, setMarket] = useState("global");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    executeSearch();
  }, []);

  const executeSearch = async () => {
    setLoading(true);
    try {
      const results = await api.searchJobs(query, market, remoteOnly, 25);
      setJobs(results || []);
    } catch (err) {
      console.error(err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (job: any) => {
    setEvaluatingId(job.id);
    try {
      const res = await api.evaluateJob(job.id, job);
      setEvaluations((prev) => ({
        ...prev,
        [job.id]: res.evaluation,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleSaveToTracker = async (job: any) => {
    try {
      await api.createApplication({
        job_id: job.id,
        job_title: job.title,
        company_name: job.company,
        job_url: job.job_url,
        location: job.location,
        status: "saved",
        match_score: evaluations[job.id]?.overall_score || 80,
      });
      setSavedSuccessId(job.id);
      setTimeout(() => setSavedSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Multi-Portal Live Search</Badge>
          <span className="text-xs text-slate-400">Aggregating Greenhouse, Lever, Ashby, FreeHire, LinkedIn</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Explore Live Openings
        </h1>

        {/* Filter Controls Bar */}
        <GlassCard variant="default" className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch();
            }}
            className="flex flex-col md:flex-row gap-3 items-center"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search job title, tech stack, or keyword..."
                className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="px-3.5 py-2.5 glass-input rounded-xl text-xs bg-surface text-slate-200"
              >
                <option value="global">Global Markets</option>
                <option value="dk">Denmark / Nordic</option>
                <option value="linkedin">LinkedIn Direct</option>
              </select>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer whitespace-nowrap px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded text-cyan-accent focus:ring-0"
                />
                <span>Remote Only</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan hover:opacity-95 transition-opacity disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </GlassCard>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Found {jobs.length} listings</span>
        <span>Rubric: Tech (30%) • Exp (25%) • Behav (15%) • Career (30%)</span>
      </div>

      {/* Job Listings Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p>Querying aggregators and calculating semantic match parameters...</p>
        </div>
      ) : jobs.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">No jobs found for "{query}"</h3>
          <p className="text-xs text-slate-400">
            Try broadening your search term or checking "Global Markets".
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const evalData = evaluations[job.id];
            const isEvaluating = evaluatingId === job.id;
            const isSaved = savedSuccessId === job.id;

            return (
              <GlassCard
                key={job.id}
                variant="hover"
                className="p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-bold text-base text-white hover:text-cyan-accent transition-colors line-clamp-1"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          {job.company}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {job.location || "Remote"}
                        </span>
                      </div>
                    </div>

                    {evalData ? (
                      <ScoreRing score={evalData.overall_score} size={64} strokeWidth={5} />
                    ) : (
                      <button
                        onClick={() => handleEvaluate(job)}
                        disabled={isEvaluating}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium hover:bg-indigo-500/25 transition-colors whitespace-nowrap"
                      >
                        {isEvaluating ? "Scoring..." : "Calculate Fit"}
                      </button>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.is_remote && <Badge variant="cyan">Remote</Badge>}
                    {job.portal && <Badge variant="secondary">{job.portal}</Badge>}
                    {job.skills?.slice(0, 4).map((skill: string) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* 5-Dimension Rubric Breakdown if evaluated */}
                  {evalData && (
                    <div className="p-3 rounded-xl bg-surface/80 border border-white/5 space-y-2 text-[11px]">
                      <div className="flex justify-between items-center text-slate-300 font-medium">
                        <span>5-Dimension Rubric Score:</span>
                        <span className="font-mono text-cyan-accent">{evalData.overall_score}/100</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <div>Technical: {evalData.breakdown?.technical?.score}%</div>
                        <div>Experience: {evalData.breakdown?.experience?.score}%</div>
                        <div>Behavioral: {evalData.breakdown?.behavioral?.score}%</div>
                        <div>Career: {evalData.breakdown?.career_trajectory?.score}%</div>
                      </div>
                      {evalData.gates && (!evalData.gates.location_pass || !evalData.gates.language_pass) && (
                        <div className="text-[10px] text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Fails location/language gate</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveToTracker(job)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                        isSaved
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSaved ? "Saved" : "Save"}</span>
                    </button>
                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                        title="Open external posting"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/compare?job_id=${job.id}`}
                      className="text-xs text-slate-300 hover:text-cyan-accent px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Match Matrix
                    </Link>
                    <Link
                      href={`/optimize?job_id=${job.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-accent text-slate-950 hover:opacity-90 shadow-glow-cyan transition-all"
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
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-slate-400">Loading jobs explorer...</div>}>
      <JobsContent />
    </Suspense>
  );
}
