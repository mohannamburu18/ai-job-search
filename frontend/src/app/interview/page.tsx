"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  Headphones,
  Sparkles,
  Send,
  Building2,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Bot,
  User,
  ShieldAlert
} from "lucide-react";

function InterviewContent() {
  const searchParams = useSearchParams();
  const initialCompany = searchParams.get("company") || "TechCorp";
  const initialTitle = searchParams.get("title") || "Senior Full Stack Engineer";
  const initialJobId = searchParams.get("job_id") || "job_demo";

  const [company, setCompany] = useState(initialCompany);
  const [title, setTitle] = useState(initialTitle);
  const [stage, setStage] = useState("technical");
  const [description, setDescription] = useState(
    "Developing high-throughput microservices, managing relational databases, and designing scalable UI applications."
  );

  const [prepLoading, setPrepLoading] = useState(false);
  const [prepPack, setPrepPack] = useState<any>(null);

  // Mock Chatbot State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "assistant" | "user"; text: string; time: string }>
  >([
    {
      sender: "assistant",
      text: `Hello! I'm your technical interviewer for the ${title} role at ${company}. Let's begin: Could you describe a recent complex architectural decision you made and how you verified its reliability?`,
      time: "Just now",
    },
  ]);
  const [userReply, setUserReply] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleGeneratePrep = async () => {
    setPrepLoading(true);
    try {
      const res = await api.generateInterviewPrep({
        job_id: initialJobId,
        job_title: title,
        company_name: company,
        job_description: description,
        stage,
      });
      setPrepPack(res.prep_pack);
    } catch (err) {
      console.error(err);
    } finally {
      setPrepLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReply.trim() || chatLoading) return;

    const currentText = userReply.trim();
    setUserReply("");
    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: currentText, time: "Just now" },
    ]);
    setChatLoading(true);

    try {
      const history = chatMessages.map((m) => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      const res = await api.interviewChat({
        job_id: initialJobId,
        job_title: title,
        company_name: company,
        message: currentText,
        history,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: res.reply || "Thank you for sharing. Could you elaborate on how you handled monitoring and error recovery in that setup?",
          time: "Just now",
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Interesting perspective. Let's delve into the trade-offs of that architectural approach versus alternative models.",
          time: "Just now",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">STAR Methodology Engine</Badge>
          <span className="text-xs text-slate-400">Situation • Task • Action • Result</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Stage-Specific Interview Intelligence & Simulation
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Prepare for each round with grounded STAR talking points, and practice responses live with an interactive interviewer simulator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Prep Parameters & STAR Packs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Interview Scenario Setup
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Interview Round</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs bg-surface text-white"
              >
                <option value="screening">Initial Recruiter Screen</option>
                <option value="technical">Technical Deep-Dive / Coding</option>
                <option value="system_design">System Architecture & Design</option>
                <option value="behavioral">Behavioral & Culture Fit (STAR)</option>
                <option value="final">Executive / Bar Raiser Final</option>
              </select>
            </div>

            <button
              onClick={handleGeneratePrep}
              disabled={prepLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
            >
              {prepLoading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Stage Prep Pack</span>
                </>
              )}
            </button>
          </GlassCard>

          {/* Prep Pack Content */}
          {prepPack ? (
            <div className="space-y-4">
              {/* STAR Stories */}
              <GlassCard variant="glow" glowColor="cyan" className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-accent" />
                    <span>Grounded STAR Stories ({prepPack.star_stories?.length || 0})</span>
                  </span>
                  <Badge variant="cyan">Real Profile Grounded</Badge>
                </div>

                <div className="space-y-4">
                  {prepPack.star_stories?.map((story: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-surface/80 border border-white/5 space-y-2 text-xs">
                      <div className="font-semibold text-white">{story.title || `Story #${idx + 1}`}</div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
                        <p><span className="text-cyan-accent font-semibold">S:</span> {story.situation}</p>
                        <p><span className="text-indigo-400 font-semibold">T:</span> {story.task}</p>
                        <p><span className="text-amber-400 font-semibold">A:</span> {story.action}</p>
                        <p><span className="text-emerald-400 font-semibold">R:</span> {story.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Reverse Questions */}
              {prepPack.questions_to_ask && (
                <GlassCard className="p-6 space-y-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>High-Impact Questions to Ask Them</span>
                  </span>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    {prepPack.questions_to_ask.map((q: string, i: number) => (
                      <li key={i} className="leading-relaxed">{q}</li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </div>
          ) : (
            <GlassCard className="p-8 text-center text-xs text-slate-500 space-y-2">
              <Headphones className="w-8 h-8 mx-auto text-slate-600" />
              <p>Click "Generate Stage Prep Pack" to load STAR stories and strategic reverse questions.</p>
            </GlassCard>
          )}
        </div>

        {/* Right Column: Live Interactive Mock Interviewer (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <GlassCard variant="glow" glowColor="indigo" className="p-6 flex flex-col h-[680px]">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">AI Interviewer Simulator</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Coaching Active
                  </span>
                </div>
              </div>
              <Badge variant="secondary" size="sm">
                Round: {stage}
              </Badge>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      msg.sender === "user"
                        ? "bg-cyan-accent text-slate-950 font-bold"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {msg.sender === "user" ? "Me" : "AI"}
                  </div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-medium"
                        : "bg-surface border border-white/10 text-slate-200"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-8">
                  <span className="w-2 h-2 rounded-full bg-cyan-accent animate-ping" />
                  Interviewer is reviewing your response...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={userReply}
                onChange={(e) => setUserReply(e.target.value)}
                placeholder="Type your response to the interviewer..."
                className="flex-1 px-3.5 py-2.5 glass-input rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={chatLoading || !userReply.trim()}
                className="px-4 py-2.5 rounded-xl bg-cyan-accent text-slate-950 font-bold text-xs shadow-glow-cyan hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-slate-400">Loading interview simulator...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
