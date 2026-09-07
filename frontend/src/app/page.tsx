"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroScene } from "@/components/3d/HeroScene";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  Sliders,
  FileCheck2,
  Headphones,
  Bot,
  Zap,
  Globe2,
  Target
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/jobs");
    }
  };

  const pipelineSteps = [
    {
      step: "01",
      title: "Live Aggregation",
      desc: "Aggregates across ~50 ATS platforms (Greenhouse, Lever, Ashby, Workday) and European portals.",
      icon: Globe2,
      color: "cyan",
    },
    {
      step: "02",
      title: "5-Dimension Scoring",
      desc: "Scores Technical (30%), Experience (25%), Behavioral (15%), Career (30%) plus hard gates.",
      icon: Sliders,
      color: "indigo",
    },
    {
      step: "03",
      title: "Fact-Grounded CV",
      desc: "Aligns your actual accomplishments to job requirements with zero invented claims.",
      icon: FileCheck2,
      color: "emerald",
    },
    {
      step: "04",
      title: "PyPDF ATS Auditor",
      desc: "Extracts physical text layers to prevent multi-column parsing traps and font encoding errors.",
      icon: CheckCircle2,
      color: "cyan",
    },
    {
      step: "05",
      title: "STAR Interview Prep",
      desc: "Generates stage-tailored interview packs and simulates mock interviews in real-time.",
      icon: Headphones,
      color: "indigo",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-accent animate-spin-slow" />
                <span>Next-Gen Career Copilot with 3D Constellation</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Master Your Job Search with <span className="gradient-text">Autonomous AI Intelligence</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Connect live multi-portal scrapers, fact-grounded resume tailoring, ATS text-layer audits, and STAR interview preparation into one unified application.
              </p>

              {/* Quick Search Bar */}
              <form onSubmit={handleHeroSearch} className="max-w-xl mx-auto lg:mx-0 pt-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search roles (e.g. Senior Full Stack Engineer, ML Lead, Remote)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-32 py-3.5 bg-surface/90 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-glass transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-900 font-semibold text-xs rounded-xl shadow-glow-cyan hover:opacity-95 transition-opacity"
                  >
                    Search Jobs
                  </button>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-sm shadow-glow-cyan hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  <span>Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/onboarding"
                  className="px-6 py-3 rounded-xl bg-surface border border-white/10 hover:border-white/25 text-white font-medium text-sm backdrop-blur-lg hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <FileCheck2 className="w-4 h-4 text-cyan-accent" />
                  <span>Upload & Parse CV</span>
                </Link>
              </div>

              {/* Guardrails Trust Bar */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Strict Fact Grounding</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-accent" />
                  <span>ReportLab + LaTeX Engine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Human-in-the-Loop Safe Submit</span>
                </div>
              </div>
            </div>

            {/* Right 3D Interactive Scene */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-surface/80 to-surface/20 shadow-2xl backdrop-blur-md">
                <HeroScene />
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-surface/80 border border-white/10 backdrop-blur-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    <span className="text-slate-300 font-medium">Neural Career Constellation</span>
                  </div>
                  <span className="font-mono text-cyan-accent text-[11px]">Three.js R160</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="py-10 border-y border-white/10 bg-surface/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-extrabold text-white font-mono">50+</div>
              <div className="text-xs text-slate-400 mt-1">Aggregated ATS Portals</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-cyan-accent font-mono">5 Dims</div>
              <div className="text-xs text-slate-400 mt-1">Weighted Fit Rubric</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">ATS Text Layer Verified</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-400 font-mono">0 Fake</div>
              <div className="text-xs text-slate-400 mt-1">Fact-Grounded Integrity</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Pipeline */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="cyan" size="md">Autonomous Architecture</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              An End-to-End System, Not a Isolated Tool
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              From finding raw listings across Europe and global tech platforms to walking into the final interview with STAR stories prepared.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <GlassCard key={step.step} variant="hover" className="flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-accent">
                        {step.step}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Grid */}
      <section className="py-16 bg-surface/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard variant="glow" glowColor="cyan" className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-accent">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">5-Dimension Match Rubric</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches are evaluated strictly based on Technical Alignment (30%), Experience Level (25%), Behavioral & Culture (15%), Career Trajectory (30%), plus hard location/remote gates.
              </p>
              <Link href="/compare" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-accent hover:underline pt-2">
                Explore Scorer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>

            <GlassCard variant="glow" glowColor="indigo" className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Dual Format PDF + LaTeX</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate clean, professional moderncv banking format LaTeX code and high-resolution ReportLab PDFs directly viewable in the browser without installing external compilers.
              </p>
              <Link href="/optimize" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:underline pt-2">
                Tailor Resume <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>

            <GlassCard variant="glow" glowColor="emerald" className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Interactive STAR Interviewer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Walk into interviews with stage-by-stage intelligence: recruiter screenings, system architecture defense, and behavioral STAR stories with our interactive AI coach.
              </p>
              <Link href="/interview" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline pt-2">
                Simulate Interview <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlassCard variant="glow" glowColor="indigo" className="py-12 px-6 sm:px-12 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to accelerate your career?
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Start by uploading your current resume or launch the dashboard with our pre-loaded candidate profile.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-sm shadow-glow-cyan hover:scale-105 transition-transform"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/jobs"
                className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Search Live Jobs
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}

