"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  Bot,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Send,
  Building2,
  FileCheck2
} from "lucide-react";

function AutomationContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job_id") || "job_demo";
  const initialUrl = searchParams.get("url") || "https://jobs.example.com/apply";

  const [jobId, setJobId] = useState(initialJobId);
  const [jobUrl, setJobUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [packet, setPacket] = useState<any>(null);

  // Verification & Sign-off State
  const [confirmed, setConfirmed] = useState(false);
  const [userSignature, setUserSignature] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    preparePacket();
  }, []);

  const preparePacket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.prepareAutomation({
        job_id: jobId,
        job_url: jobUrl,
        portal_type: "generic_ats",
      });
      setPacket(res);

      // Initialize field inputs from mapped packet
      const initialMap: Record<string, string> = {};
      res.fields?.forEach((f: any) => {
        initialMap[f.field_id] = f.mapped_value || "";
      });
      setFieldValues(initialMap);
    } catch (err: any) {
      setError(err.message || "Failed to initialize application packet.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, val: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed || !userSignature.trim()) {
      setError("Explicit user signature and confirmation required before transmission.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitAutomation({
        packet_id: packet.packet_id,
        confirmed: true,
        user_signature: userSignature,
        field_values: fieldValues,
      });
      setSubmissionResult(res);
    } catch (err: any) {
      setError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Human-in-the-Loop Protocol</Badge>
          <span className="text-xs text-slate-400">Zero Autonomous Blind Submissions</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Application Packet & Safe Submission Boundary
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          To protect candidate reputation and enforce zero-hallucination standards, the system prepares all application payloads for explicit human inspection before any external transmission.
        </p>
      </div>

      {/* Trust & Boundary Alert */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-accent shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-semibold text-white">Guaranteed Safe Boundary</h4>
          <p className="text-slate-300 leading-relaxed">
            The AI engine automatically maps your verified profile details into the portal's expected fields. Review all field values below, verify accuracy, and sign to approve transmission.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 space-y-2">
          <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p>Analyzing job portal schema & mapping verified credentials...</p>
        </div>
      ) : submissionResult ? (
        <GlassCard variant="glow" glowColor="emerald" className="p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Application Successfully Transmitted!</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Packet <span className="font-mono text-cyan-accent">{submissionResult.packet_id}</span> has been processed. Application status has transitioned to <span className="text-white font-semibold">"applied"</span> in your Tracker.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Audit Token: {submissionResult.audit_token}
          </div>
        </GlassCard>
      ) : packet ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mapped Fields Card */}
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Extracted Field Mappings
              </h3>
              <Badge variant="cyan">{packet.fields?.length || 0} Fields Mapped</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packet.fields?.map((field: any) => (
                <div key={field.field_id} className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    {field.label} {field.required && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type="text"
                    value={fieldValues[field.field_id] || ""}
                    onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
                    className="w-full px-3.5 py-2 glass-input rounded-xl text-xs"
                  />
                  <div className="text-[10px] text-slate-400">
                    Source: <span className="text-slate-300">{field.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Explicit Sign-off & Confirmation Boundary */}
          <GlassCard variant="glow" glowColor="cyan" className="p-6 space-y-5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Mandatory Human Verification Checkpoint</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-cyan-accent focus:ring-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I have personally inspected all mapped fields above, verified that all contact details and qualifications are 100% accurate, and explicitly authorize this submission.
                </span>
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Candidate Digital Signature (Type your full name to confirm)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivers"
                  value={userSignature}
                  onChange={(e) => setUserSignature(e.target.value)}
                  className="w-full max-w-sm px-3.5 py-2 glass-input rounded-xl text-xs"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="submit"
                disabled={submitting || !confirmed || !userSignature.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-2 hover:opacity-95 disabled:opacity-40 transition-opacity"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Authorize & Transmit Application</span>
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </form>
      ) : null}
    </div>
  );
}

export default function AutomationPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-12 text-center text-xs text-slate-400">Loading application packet...</div>}>
      <AutomationContent />
    </Suspense>
  );
}
