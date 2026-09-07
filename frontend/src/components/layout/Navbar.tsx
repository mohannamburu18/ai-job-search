"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Compass,
  FileText,
  Briefcase,
  CheckCircle2,
  Kanban,
  Headphones,
  Sliders,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  Bot
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Check backend health periodically
    const checkHealth = async () => {
      try {
        await api.health();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: Compass },
    { name: "Live Jobs", href: "/jobs", icon: Briefcase },
    { name: "Match Matrix", href: "/compare", icon: Sliders },
    { name: "Optimize CV", href: "/optimize", icon: FileText },
    { name: "Cover Letter", href: "/cover-letter", icon: Sparkles },
    { name: "ATS Check", href: "/ats", icon: CheckCircle2 },
    { name: "Tracker", href: "/tracker", icon: Kanban },
    { name: "Interview AI", href: "/interview", icon: Headphones },
    { name: "Auto Apply", href: "/automation", icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#07090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-accent animate-pulse" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              LetMe<span className="text-cyan-accent">Apply</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block -mt-1">
              AI CAREER SUITE
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-500/15 text-white border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-accent" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-3">
          {/* Backend Health Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-white/10 bg-surface/50"
            title={backendOnline ? "FastAPI Backend Connected" : "Connecting to Backend..."}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                  : backendOnline === false
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-ping"
              }`}
            />
            <span className="text-slate-400">
              {backendOnline ? "API Online" : backendOnline === false ? "Offline" : "Checking"}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/onboarding"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-cyan-accent" />
                <span>Profile</span>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-accent to-cyan-400 hover:opacity-90 shadow-glow-cyan transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-white/10 bg-surface/95 backdrop-blur-2xl px-4 py-4 space-y-1 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500/20 text-white border border-indigo-500/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-accent" : "text-slate-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

