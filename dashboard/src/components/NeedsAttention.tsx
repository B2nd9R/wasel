"use client";

import React from "react";
import {
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  Flame,
  AlertTriangle,
} from "lucide-react";
import type { MunicipalIncident } from "@/types";
import { formatRelativeTime, SEV_INFO, STATUS_INFO } from "@/lib/utils";

interface NeedsAttentionProps {
  incident: MunicipalIncident;
  onSelect: (incident: MunicipalIncident) => void;
}

export function NeedsAttention({ incident, onSelect }: NeedsAttentionProps) {
  const sev = SEV_INFO[incident.aiAnalysis.severityLevel];
  const st = STATUS_INFO[incident.status];

  return (
    <section className="bg-white rounded-2xl border border-[#e6e4f5] shadow-sm overflow-hidden transition hover:border-[#dcd9ef]">
      {/* Banner Header */}
      <div className="px-5 py-3.5 bg-[#fbfaff] border-b border-[#e6e4f5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#4d4b66]">
            Needs Attention • Highest Priority
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#7c7aac] font-medium">
            {incident.id}
          </span>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
            style={{
              color: st.text,
              backgroundColor: st.bg,
              borderColor: st.border,
            }}
          >
            {st.label}
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Evidence Photo */}
        <div className="lg:col-span-4">
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-[#eeedf8] border border-[#e6e4f5] shadow-xs group">
            {incident.citizenInput.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={incident.citizenInput.photoUrl}
                alt="Evidence preview"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#7c7aac] gap-1">
                <ShieldAlert className="w-8 h-8" />
                <span className="text-xs">No image attached</span>
              </div>
            )}
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Evidence Photo</span>
            </div>
          </div>
        </div>

        {/* AI Analysis & Details */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div>
            {/* Category & Location */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#7c7aac] mb-1.5">
              <span className="font-semibold text-sm text-[#4d4b66]">
                {incident.aiAnalysis.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7c7aac]" />
                {incident.citizenInput.locationText}
              </span>
            </div>

            {/* AI Problem Summary */}
            <h3 className="text-base sm:text-lg font-bold text-[#4d4b66] leading-snug">
              {incident.aiAnalysis.problemDescription}
            </h3>

            {/* AI Rationale Snippet */}
            <p className="mt-2 text-xs text-[#7c7aac] leading-relaxed line-clamp-2">
              <strong className="text-[#4d4b66] font-semibold">AI Risk Assessment: </strong>
              {incident.aiAnalysis.severityReason}
            </p>
          </div>

          {/* Metric Bar & CTA */}
          <div className="pt-3 border-t border-[#f0effa] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 sm:gap-6 text-xs">
              {/* Priority Score */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7c7aac] block tracking-wider">
                  Priority Score
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-extrabold text-[#4d4b66]">
                    {incident.aiAnalysis.severityScore}
                  </span>
                  <span className="text-xs text-[#7c7aac]">/ 100</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                    style={{
                      color: sev.text,
                      backgroundColor: sev.bg,
                    }}
                  >
                    {sev.label}
                  </span>
                </div>
              </div>

              {/* SLA Target */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7c7aac] block tracking-wider">
                  Expected Resolution
                </span>
                <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold text-[#4d4b66]">
                  <Clock className="w-3.5 h-3.5 text-[#7c7aac]" />
                  <span>
                    {incident.sla.isOverdue
                      ? `Overdue (${Math.abs(incident.sla.remainingHours)}h)`
                      : `Within ${incident.sla.slaDays * 24} hours`}
                  </span>
                </div>
              </div>

              {/* Submitted Time */}
              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-[#7c7aac] block tracking-wider">
                  Received
                </span>
                <span className="mt-0.5 text-xs text-[#7c7aac] block font-medium">
                  {formatRelativeTime(incident.createdAt)}
                </span>
              </div>
            </div>

            {/* Review Action */}
            <button
              onClick={() => onSelect(incident)}
              className="px-4 py-2 rounded-xl bg-[#4d4b66] hover:bg-[#3b3952] active:scale-[0.98] text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Review Incident</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
