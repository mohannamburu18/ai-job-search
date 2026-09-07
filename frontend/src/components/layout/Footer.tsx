import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, Code2, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07090e]/90 text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-accent" />
              <span className="font-bold text-sm text-white tracking-tight">
                LetMe<span className="text-cyan-accent">Apply</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Autonomous, strictly fact-grounded career search and application system with ATS verification and live job aggregators.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Core Engine</h4>
            <ul className="space-y-2">
              <li><Link href="/jobs" className="hover:text-cyan-accent transition-colors">Live Aggregator</Link></li>
              <li><Link href="/compare" className="hover:text-cyan-accent transition-colors">5-Dimension Fit Scorer</Link></li>
              <li><Link href="/optimize" className="hover:text-cyan-accent transition-colors">Grounded CV Tailor</Link></li>
              <li><Link href="/ats" className="hover:text-cyan-accent transition-colors">PyPDF ATS Validator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Preparation</h4>
            <ul className="space-y-2">
              <li><Link href="/cover-letter" className="hover:text-cyan-accent transition-colors">Cover Letter Generator</Link></li>
              <li><Link href="/interview" className="hover:text-cyan-accent transition-colors">STAR Interview Simulator</Link></li>
              <li><Link href="/tracker" className="hover:text-cyan-accent transition-colors">Application Pipeline</Link></li>
              <li><Link href="/automation" className="hover:text-cyan-accent transition-colors">Human-in-the-Loop Apply</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 uppercase tracking-wider text-[11px]">Guardrails</h4>
            <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Hallucination Guarantee</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                CV modifications strictly reflect your verified experience without fabricated metrics or fake skills.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} LetMeApply. Built with Next.js, Three.js, ReportLab & FastAPI.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-400" />
              API: Local 8000
            </span>
            <span className="flex items-center gap-1">
              <Code2 className="w-3 h-3 text-cyan-400" />
              Thin-Pointer Agent Spec
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

