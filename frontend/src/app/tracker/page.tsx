"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import {
  Kanban,
  Plus,
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  FileCheck2,
  Headphones,
  Sparkles,
  CheckCircle2
} from "lucide-react";

const COLUMNS = [
  { id: "saved", title: "Saved", badge: "secondary" as const },
  { id: "applied", title: "Applied", badge: "primary" as const },
  { id: "interview", title: "Interview", badge: "cyan" as const },
  { id: "offer", title: "Offer", badge: "success" as const },
  { id: "rejected", title: "Rejected", badge: "danger" as const },
];

export default function TrackerPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Application Form
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newLocation, setNewLocation] = useState("Remote");
  const [newStatus, setNewStatus] = useState("saved");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getApplications();
      setApplications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusMove = async (appId: number, nextStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, nextStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    try {
      const created = await api.createApplication({
        job_title: newTitle,
        company_name: newCompany,
        job_url: newUrl || undefined,
        location: newLocation,
        status: newStatus,
        match_score: 85,
      });
      setApplications([created, ...applications]);
      setShowAddModal(false);
      setNewTitle("");
      setNewCompany("");
      setNewUrl("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan">CSV & SQLite Bi-Directional Sync</Badge>
            <span className="text-xs text-slate-400">job_search_tracker.csv</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Application Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track status progression across all opportunities with persistent audit trail.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold text-xs shadow-glow-cyan flex items-center gap-2 hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Opportunity</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col, colIdx) => {
          const colApps = applications.filter((a) => a.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl bg-surface/50 border border-white/5 p-3 min-w-[240px] space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {col.title}
                </span>
                <Badge variant={col.badge} size="sm">
                  {colApps.length}
                </Badge>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 min-h-[300px]">
                {colApps.map((app) => (
                  <GlassCard
                    key={app.id}
                    variant="hover"
                    className="p-4 space-y-3 border-white/10"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-xs line-clamp-1">
                        {app.job_title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Building2 className="w-3 h-3 text-indigo-400" />
                        <span className="text-slate-300 font-medium">{app.company_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-cyan-accent">
                        Fit: {app.match_score || 85}%
                      </span>
                      <span>{app.location || "Remote"}</span>
                    </div>

                    {/* Quick Tools */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/interview?company=${encodeURIComponent(app.company_name)}&title=${encodeURIComponent(app.job_title)}`}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-white/5"
                          title="Interview Prep"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                        </Link>
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-cyan-accent hover:bg-white/5"
                            title="Job URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Stage Move Controls */}
                      <div className="flex items-center gap-1">
                        {colIdx > 0 && (
                          <button
                            onClick={() => handleStatusMove(app.id, COLUMNS[colIdx - 1].id)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                            title={`Move to ${COLUMNS[colIdx - 1].title}`}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {colIdx < COLUMNS.length - 1 && (
                          <button
                            onClick={() => handleStatusMove(app.id, COLUMNS[colIdx + 1].id)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-accent"
                            title={`Move to ${COLUMNS[colIdx + 1].title}`}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}

                {colApps.length === 0 && (
                  <div className="h-28 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-[11px] text-slate-500">
                    Empty Stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <GlassCard variant="glow" glowColor="cyan" className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add Application to Pipeline</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl"
                  placeholder="Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl"
                  placeholder="Stripe, GitHub, etc."
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Job URL (Optional)</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl bg-surface text-white"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-accent to-cyan-400 text-slate-950 font-bold"
                >
                  Save Card
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

