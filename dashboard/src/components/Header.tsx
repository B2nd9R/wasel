"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, Activity, Database, ShieldCheck, ArrowLeft } from "lucide-react";
import { formatClockTime } from "@/lib/utils";

interface HeaderProps {
  lastSynced: string;
  source: "dynamodb" | "fallback";
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Header({
  lastSynced,
  source,
  isRefreshing,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#e6e4f5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#4d4b66] flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#4d4b66]">
                CityPulse
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#eeedf8] text-[#4d4b66] font-semibold border border-[#dcd9ef]">
                Municipal Operations
              </span>
            </div>
            <p className="text-[11px] text-[#7c7aac] tracking-wide font-medium">
              Incident Response & Infrastructure Command
            </p>
          </div>
        </div>

        {/* Live status & controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="hidden lg:flex items-center gap-1.5 text-xs text-[#7c7aac] hover:text-[#4d4b66] font-medium px-2.5 py-1 rounded-md hover:bg-[#f7f6ff] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Portal</span>
          </Link>

          {/* Connection Source */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fbfaff] border border-[#e6e4f5] text-[11px] text-[#7c7aac]">
            {source === "dynamodb" ? (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-[#4d4b66]">AWS DynamoDB</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#7c7aac]" />
                <span className="font-medium text-[#4d4b66]">Demo Cluster</span>
              </>
            )}
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="live-pulse"></span>
            <span>LIVE</span>
          </div>

          {/* Sync Time */}
          <div className="text-xs text-[#7c7aac] font-mono hidden sm:block">
            <span className="text-[#9e9cb8] mr-1">Synced:</span>
            <span className="text-[#4d4b66] font-semibold">
              {formatClockTime(lastSynced)}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-md bg-[#fbfaff] hover:bg-[#f0effa] active:scale-95 text-[#4d4b66] transition border border-[#dcd9ef] disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#4d4b66]" : ""}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
