"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Sparkles,
  MapPin,
  Save
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Profile Form State
  const [name, setName] = useState("Alex Rivers");
  const [email, setEmail] = useState("candidate@aijobsearch.dev");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [location, setLocation] = useState("San Francisco, CA / Remote");
  const [github, setGithub] = useState("https://github.com/candidate");
  const [linkedin, setLinkedin] = useState("https://linkedin.com/in/candidate");
  const [summary, setSummary] = useState(
    "Senior Full-Stack & Systems Engineer with 7+ years of experience architecting distributed cloud systems, modern React frontends, and production AI pipelines."
  );

  const [skillsPrimary, setSkillsPrimary] = useState<string[]>([
    "Python", "TypeScript", "React", "Next.js", "FastAPI", "Node.js", "PostgreSQL"
  ]);
  const [skillsSecondary, setSkillsSecondary] = useState<string[]>([
    "Docker", "Kubernetes", "AWS", "Three.js", "GraphQL", "Redis", "CI/CD"
  ]);
  const [toolsSoftware, setToolsSoftware] = useState<string[]>([
    "Git", "GitHub Actions", "Terraform", "Postman", "Linux", "PyTest"
  ]);

  const [targetRoles, setTargetRoles] = useState<string[]>([
    "Senior Full Stack Engineer", "Staff Software Engineer", "AI/ML Application Engineer", "Backend Architect"
  ]);
  const [targetLocations, setTargetLocations] = useState<string[]>([
    "Remote", "San Francisco, CA", "New York, NY", "London, UK", "Copenhagen, Denmark"
  ]);
  const [remotePreference, setRemotePreference] = useState("remote");
  const [minSalary, setMinSalary] = useState(140000);

  // Skill input buffers
  const [newPrimarySkill, setNewPrimarySkill] = useState("");
  const [newSecondarySkill, setNewSecondarySkill] = useState("");
  const [newRole, setNewRole] = useState("");

  // Load existing profile on mount if available
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getProfile();
        if (data && data.name) {
          setName(data.name || "Alex Rivers");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setLocation(data.location || "");
          setGithub(data.github || "");
          setLinkedin(data.linkedin || "");
          setSummary(data.summary || "");
          if (data.skills_primary && data.skills_primary.length > 0) setSkillsPrimary(data.skills_primary);
          if (data.skills_secondary && data.skills_secondary.length > 0) setSkillsSecondary(data.skills_secondary);
          if (data.tools_software && data.tools_software.length > 0) setToolsSoftware(data.tools_software);
          if (data.target_roles && data.target_roles.length > 0) setTargetRoles(data.target_roles);
          if (data.target_locations && data.target_locations.length > 0) setTargetLocations(data.target_locations);
          if (data.remote_preference) setRemotePreference(data.remote_preference);
          if (data.min_salary) setMinSalary(data.min_salary);
        }
      } catch {
        // use pre-loaded defaults
      }
    };
    loadProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setMessage(null);
    try {
      const res = await api.uploadResume(file);
      const parsed = res.parsed_profile || {};
      if (parsed.name) setName(parsed.name);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.skills_primary?.length) setSkillsPrimary(parsed.skills_primary);
      if (parsed.skills_secondary?.length) setSkillsSecondary(parsed.skills_secondary);
      if (parsed.tools_software?.length) setToolsSoftware(parsed.tools_software);
      if (parsed.summary) setSummary(parsed.summary);

      setMessage({
        text: `Successfully parsed ${file.name}! Review extracted fields below.`,
        type: "success",
      });
      setStep(2);
    } catch (err: any) {
      setMessage({
        text: err.message || "Failed to parse resume file.",
        type: "error",
      });
    } finally {
      setParsing(false);
    }
  };

  const addSkill = (type: "primary" | "secondary") => {
    if (type === "primary" && newPrimarySkill.trim()) {
      if (!skillsPrimary.includes(newPrimarySkill.trim())) {
        setSkillsPrimary([...skillsPrimary, newPrimarySkill.trim()]);
      }
      setNewPrimarySkill("");
    } else if (type === "secondary" && newSecondarySkill.trim()) {
      if (!skillsSecondary.includes(newSecondarySkill.trim())) {
        setSkillsSecondary([...skillsSecondary, newSecondarySkill.trim()]);
      }
      setNewSecondarySkill("");
    }
  };

  const removeSkill = (type: "primary" | "secondary", skill: string) => {
    if (type === "primary") {
      setSkillsPrimary(skillsPrimary.filter((s) => s !== skill));
    } else {
      setSkillsSecondary(skillsSecondary.filter((s) => s !== skill));
    }
  };

  const addTargetRole = () => {
    if (newRole.trim() && !targetRoles.includes(newRole.trim())) {
      setTargetRoles([...targetRoles, newRole.trim()]);
      setNewRole("");
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.updateProfile({
        name,
        email,
        phone,
        location,
        github,
        linkedin,
        summary,
        skills_primary: skillsPrimary,
        skills_secondary: skillsSecondary,
        tools_software: toolsSoftware,
        target_roles: targetRoles,
        target_locations: targetLocations,
        remote_preference: remotePreference,
        min_salary: minSalary,
      });

      await refreshUser();
      setMessage({ text: "Candidate profile successfully saved and synchronized!", type: "success" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-accent text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Profile & Grounded Knowledge Base</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Candidate Profile Configuration
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          All CV tailoring, ATS matching, and interview simulations draw strictly from this verified profile. No hallucinations or fake metrics are ever introduced.
        </p>
      </div>

      {/* Step Tabs */}
      <div className="flex border-b border-white/10 gap-2 pb-2">
        <button
          onClick={() => setStep(1)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            step === 1 ? "bg-indigo-500/20 text-white border border-indigo-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          1. Upload or Load CV
        </button>
        <button
          onClick={() => setStep(2)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            step === 2 ? "bg-indigo-500/20 text-white border border-indigo-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          2. Personal & Summary
        </button>
        <button
          onClick={() => setStep(3)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            step === 3 ? "bg-indigo-500/20 text-white border border-indigo-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          3. Skills & Technology
        </button>
        <button
          onClick={() => setStep(4)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            step === 4 ? "bg-indigo-500/20 text-white border border-indigo-500/40" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          4. Career Targets & Gates
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            message.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <GlassCard variant="default" className="space-y-6">
          <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 sm:p-12 text-center hover:border-cyan-400/50 transition-colors bg-white/[0.02]">
            <UploadCloud className="w-12 h-12 text-cyan-accent mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-1">
              Upload existing Resume / CV
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
              Drop your PDF, DOCX, or TXT file here. The parser extracts your contact details, core technical competencies, and project history.
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan cursor-pointer hover:opacity-95">
              <span>{parsing ? "Parsing Document..." : "Select Resume File"}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={parsing}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-xs text-slate-400">
              Or use pre-configured candidate profile from repository specifications:
            </div>
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-white font-medium text-xs hover:bg-white/10 flex items-center gap-1.5"
            >
              <span>Continue with Loaded Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Personal & Summary */}
      {step === 2 && (
        <GlassCard variant="default" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Location Base</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GitHub Profile</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">LinkedIn Profile</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Executive Summary / Grounded Narrative
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <span>Skills & Tech</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Skills & Tech */}
      {step === 3 && (
        <GlassCard variant="default" className="space-y-6">
          {/* Primary Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Primary Core Skills (30% Match Weight)
              </label>
              <span className="text-[11px] text-slate-400">{skillsPrimary.length} added</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsPrimary.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill("primary", skill)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newPrimarySkill}
                placeholder="Add core skill (e.g. Go, Rust, React)"
                onChange={(e) => setNewPrimarySkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill("primary")}
                className="w-full px-3 py-1.5 glass-input rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => addSkill("primary")}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Secondary Skills */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Secondary & Cloud Technologies
              </label>
              <span className="text-[11px] text-slate-400">{skillsSecondary.length} added</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsSecondary.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill("secondary", skill)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newSecondarySkill}
                placeholder="Add secondary skill (e.g. Kubernetes, AWS)"
                onChange={(e) => setNewSecondarySkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill("secondary")}
                className="w-full px-3 py-1.5 glass-input rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => addSkill("secondary")}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <span>Career Targets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Step 4: Career Targets & Gates */}
      {step === 4 && (
        <GlassCard variant="default" className="space-y-6">
          {/* Target Roles */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-white uppercase tracking-wider">
              Target Job Titles & Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {targetRoles.map((role) => (
                <Badge key={role} variant="primary" size="md">
                  {role}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newRole}
                placeholder="Add target title..."
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTargetRole()}
                className="w-full px-3 py-1.5 glass-input rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={addTargetRole}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium"
              >
                Add Role
              </button>
            </div>
          </div>

          {/* Hard Gates: Remote & Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Remote Preference Gate
              </label>
              <select
                value={remotePreference}
                onChange={(e) => setRemotePreference(e.target.value)}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm bg-surface"
              >
                <option value="any">Any (Remote, Hybrid, or On-site)</option>
                <option value="remote">Strictly Remote Only</option>
                <option value="hybrid">Hybrid Allowed</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                If strictly remote, non-remote listings fail the hard location gate.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Min Salary ($/yr)
              </label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 glass-input rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/10">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent via-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs shadow-glow-cyan hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile & Launch</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

