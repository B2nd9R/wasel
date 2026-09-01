"use client";

import React from "react";
import { MapPin, ShieldAlert, ArrowUpRight } from "lucide-react";
import type { MunicipalIncident } from "@/types";
import { formatRelativeTime, SEV_INFO, STATUS_INFO } from "@/lib/utils";

interface RecentIncidentsProps {
  incidents: MunicipalIncident[];
  selectedId?: string;
  onSelect: (incident: MunicipalIncident) => void;
}

export function RecentIncidents({
  incidents,
  selectedId,
  onSelect,
}: RecentIncidentsProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e6e4f5] shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e4f5] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#4d4b66]">
            Recent Incident Reports
          </h2>
          <p className="text-xs text-[#7c7aac] mt-0.5">
            Real-time feed of citizen and sensor submissions
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#eeedf8] text-[#4d4b66]">
          {incidents.length} Total
        </span>
      </div>

      <div className="divide-y divide-[#f0effa] overflow-x-auto">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7c7aac]">
            No incidents reported yet.
          </div>
        ) : (
          incidents.map((inc) => {
            const isSelected = inc.id === selectedId;
            const sev = SEV_INFO[inc.aiAnalysis.severityLevel];
            const st = STATUS_INFO[inc.status];

            return (
              <div
                key={inc.id}
                onClick={() => onSelect(inc)}
                className={`p-4 sm:px-5 sm:py-3.5 flex items-center justify-between gap-4 cursor-pointer transition hover:bg-[#fbfaff] ${
                  isSelected ? "bg-[#f4f3fc] border-l-4 border-l-[#4d4b66]" : ""
                }`}
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Photo Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-[#eeedf8] overflow-hidden shrink-0 border border-[#e6e4f5]">
                    {inc.citizenInput.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inc.citizenInput.photoUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#7c7aac]">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#4d4b66] truncate">
                        {inc.aiAnalysis.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#7c7aac]">
                        {inc.id}
                      </span>
                    </div>

                    <p className="text-xs text-[#7c7aac] truncate mt-0.5">
                      {inc.aiAnalysis.problemDescription}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-[#7c7aac] mt-1">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {inc.citizenInput.locationText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Status */}
                <div className="flex items-center gap-4 shrink-0 text-right">
                  {/* Severity & Score */}
                  <div className="hidden sm:block text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-sm font-bold text-[#4d4b66]">
                        {inc.aiAnalysis.severityScore}
                      </span>
                      <span className="text-[10px] text-[#7c7aac]">/ 100</span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block"
                      style={{
                        color: sev.text,
                        backgroundColor: sev.bg,
                      }}
                    >
                      {sev.label}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <div>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-block"
                      style={{
                        color: st.text,
                        backgroundColor: st.bg,
                        borderColor: st.border,
                      }}
                    >
                      {st.label}
                    </span>
                    <span className="block text-[10px] text-[#7c7aac] mt-1">
                      {formatRelativeTime(inc.createdAt)}
                    </span>
                  </div>

                  <ArrowUpRight className="w-4 h-4 text-[#7c7aac] opacity-60 hidden md:block" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
