"use client";

import React, { useEffect } from "react";
import {
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Wrench,
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Radio,
} from "lucide-react";
import type { MunicipalIncident } from "@/types";
import {
  formatDateTime,
  formatRelativeTime,
  SEV_INFO,
  STATUS_INFO,
  PRIORITY_INFO,
} from "@/lib/utils";

interface IncidentDrawerProps {
  incident: MunicipalIncident | null;
  onClose: () => void;
}

export function IncidentDrawer({ incident, onClose }: IncidentDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!incident) return null;

  const sev = SEV_INFO[incident.aiAnalysis.severityLevel];
  const st = STATUS_INFO[incident.status];

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Slide-over Drawer */}
      <aside className="drawer-panel flex flex-col text-[#4d4b66]">
        {/* Drawer Header */}
        <div className="px-6 py-4.5 border-b border-[#e6e4f5] bg-white sticky top-0 z-20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#4d4b66]">
                {incident.id}
              </span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: st.text,
                  backgroundColor: st.bg,
                  borderColor: st.border,
                }}
              >
                {st.label}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#4d4b66] mt-0.5">
              {incident.aiAnalysis.category}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f0effa] text-[#7c7aac] hover:text-[#4d4b66] transition"
            title="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Evidence & Citizen Submission */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c7aac] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Evidence & Resident Submission</span>
            </h3>

            {/* Evidence Image */}
            <div className="relative rounded-xl overflow-hidden bg-[#eeedf8] border border-[#e6e4f5] aspect-[16/10]">
              {incident.citizenInput.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={incident.citizenInput.photoUrl}
                  alt="Incident Evidence"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#7c7aac]">
                  <ShieldAlert className="w-8 h-8" />
                  <span className="text-xs mt-1">No image provided</span>
                </div>
              )}
            </div>

            {/* Submission Metadata */}
            <div className="bg-[#fbfaff] rounded-xl border border-[#e6e4f5] p-4 space-y-2.5 text-xs">
              <div>
                <span className="text-[#7c7aac] font-medium block">Resident Description:</span>
                <p className="text-[#4d4b66] font-medium mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-[#e6e4f5]">
                  &ldquo;{incident.citizenInput.description}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-[#7c7aac]">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#4d4b66]" />
                  <span className="truncate">{incident.citizenInput.locationText}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#7c7aac]">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-[#4d4b66]" />
                  <span>{formatDateTime(incident.createdAt)}</span>
                </div>
              </div>

              {incident.citizenInput.latitude && incident.citizenInput.longitude && (
                <div className="text-[11px] text-[#7c7aac] pt-1 flex items-center justify-between border-t border-[#f0effa]">
                  <span>
                    GPS: {incident.citizenInput.latitude.toFixed(5)},{" "}
                    {incident.citizenInput.longitude.toFixed(5)}
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${incident.citizenInput.latitude},${incident.citizenInput.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4d4b66] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: AI Analysis */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c7aac] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#4d4b66]" />
              <span>AI Agent Analysis</span>
            </h3>

            <div className="bg-[#fbfaff] rounded-xl border border-[#e6e4f5] p-4 space-y-3.5 text-xs">
              {/* Problem Statement */}
              <div>
                <span className="text-[#7c7aac] font-medium block">Problem Statement:</span>
                <p className="text-[#4d4b66] font-semibold mt-0.5 leading-relaxed">
                  {incident.aiAnalysis.problemDescription}
                </p>
              </div>

              {/* Priority & Severity Score */}
              <div className="p-3 bg-white rounded-lg border border-[#e6e4f5] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#7c7aac]">
                    Calculated Priority Score
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-extrabold text-[#4d4b66]">
                      {incident.aiAnalysis.severityScore}
                    </span>
                    <span className="text-xs text-[#7c7aac]">/ 100</span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.2 rounded"
                      style={{
                        color: sev.text,
                        backgroundColor: sev.bg,
                      }}
                    >
                      {sev.label} Severity
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#7c7aac]">
                    Vision AI Confidence
                  </span>
                  <p className="text-xs font-bold text-[#4d4b66] mt-0.5">
                    {incident.aiAnalysis.confidence
                      ? `${Math.round(incident.aiAnalysis.confidence * 100)}%`
                      : "96%"}
                  </p>
                </div>
              </div>

              {/* Severity Reason */}
              <div>
                <span className="text-[#7c7aac] font-medium block">Severity & Urgency Rationale:</span>
                <p className="text-[#4d4b66] mt-0.5 leading-relaxed">
                  {incident.aiAnalysis.severityReason}
                </p>
              </div>

              {/* Detected Risks */}
              {incident.aiAnalysis.detectedRisks?.length > 0 && (
                <div>
                  <span className="text-[#7c7aac] font-medium block mb-1.5">
                    Detected Safety Risks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {incident.aiAnalysis.detectedRisks.map((risk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200 text-[11px] font-medium flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0 text-red-600" />
                        <span>{risk}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Recommended Solutions */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c7aac] flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>Recommended Solutions</span>
            </h3>

            <div className="space-y-2.5">
              {incident.aiAnalysis.recommendedSolutions?.map((sol, idx) => {
                const pri =
                  PRIORITY_INFO[sol.priority] || PRIORITY_INFO.normal;
                const Icon =
                  sol.priority === "immediate"
                    ? ShieldAlert
                    : idx === 1
                    ? Wrench
                    : ScanSearch;

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#fbfaff] rounded-xl border border-[#e6e4f5] flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#eeedf8] text-[#4d4b66] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#4d4b66]">
                          {sol.title}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{
                            color: pri.text,
                            backgroundColor: pri.bg,
                            borderColor: pri.border,
                          }}
                        >
                          {pri.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#7c7aac] mt-1 leading-relaxed">
                        {sol.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: SLA Tracking */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c7aac] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>SLA & Resolution Timeline</span>
            </h3>

            <div className="bg-[#fbfaff] rounded-xl border border-[#e6e4f5] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#7c7aac]">Target Resolution</span>
                <span className="font-semibold text-[#4d4b66]">
                  {formatDateTime(incident.sla.expectedResolutionDate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#7c7aac]">Time Remaining</span>
                <span
                  className={`font-bold ${
                    incident.sla.isOverdue
                      ? "text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200"
                      : "text-emerald-700"
                  }`}
                >
                  {incident.sla.isOverdue
                    ? `Overdue by ${Math.abs(incident.sla.remainingHours)}h`
                    : `${incident.sla.remainingHours} hours remaining`}
                </span>
              </div>

              <div className="pt-2 border-t border-[#f0effa] text-[11px] text-[#7c7aac]">
                <span>Policy Source: </span>
                <span className="text-[#4d4b66] font-medium">
                  {incident.sla.policySource}
                </span>
              </div>
            </div>
          </section>

          {/* Section 5: Spatial Clustering */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c7aac] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Spatial Clustering & Related Reports</span>
            </h3>

            <div className="bg-[#fbfaff] rounded-xl border border-[#e6e4f5] p-4 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-[#4d4b66]">
                  {incident.relatedReports.count} Related Incidents Found Nearby
                </span>
                <p className="text-[11px] text-[#7c7aac] mt-0.5">
                  Cluster detected within 1.0 km radius on same road corridor
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {incident.relatedReports.reportIds?.map((refId) => (
                  <span
                    key={refId}
                    className="font-mono text-[10px] font-bold px-2 py-1 rounded bg-white border border-[#e6e4f5] text-[#4d4b66]"
                  >
                    {refId}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Agent Observable Actions Timeline */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c7aac] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#4d4b66]" />
              <span>Agent Activity Timeline</span>
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e6e4f5]">
              {incident.agentActions?.map((act) => (
                <div key={act.id} className="relative text-xs">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#4d4b66] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4d4b66]" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4d4b66]">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-[#7c7aac] font-mono">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-[#7c7aac] mt-0.5 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
