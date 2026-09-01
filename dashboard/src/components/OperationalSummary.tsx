"use client";

import React from "react";
import { AlertTriangle, Clock, Flame, Inbox } from "lucide-react";
import type { OperationalStats } from "@/types";

interface OperationalSummaryProps {
  stats: OperationalStats;
}

export function OperationalSummary({ stats }: OperationalSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e6e4f5] shadow-xs p-3.5 sm:p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#f0effa]">
        {/* Open Reports */}
        <div className="flex items-center gap-3 px-2 pt-2 sm:pt-0">
          <div className="w-10 h-10 rounded-lg bg-[#eeedf8] text-[#4d4b66] flex items-center justify-center shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#4d4b66]">
              {stats.totalOpen}
            </span>
            <p className="text-[11px] font-semibold text-[#7c7aac] uppercase tracking-wider">
              Open Reports
            </p>
          </div>
        </div>

        {/* High Priority */}
        <div className="flex items-center gap-3 px-2 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-lg bg-[#fff7ed] text-[#c2410c] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#4d4b66]">
              {stats.highOrCritical}
            </span>
            <p className="text-[11px] font-semibold text-[#7c7aac] uppercase tracking-wider">
              High Priority
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div className="flex items-center gap-3 px-2 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-lg bg-[#fffbeb] text-[#b45309] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#4d4b66]">
              {stats.overdue}
            </span>
            <p className="text-[11px] font-semibold text-[#7c7aac] uppercase tracking-wider">
              Overdue
            </p>
          </div>
        </div>

        {/* Escalated */}
        <div className="flex items-center gap-3 px-2 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-lg bg-[#fef2f2] text-[#b91c1c] flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#4d4b66]">
              {stats.escalated}
            </span>
            <p className="text-[11px] font-semibold text-[#7c7aac] uppercase tracking-wider">
              Escalated
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
