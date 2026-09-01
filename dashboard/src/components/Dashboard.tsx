"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./Header";
import { OperationalSummary } from "./OperationalSummary";
import { NeedsAttention } from "./NeedsAttention";
import { RecentIncidents } from "./RecentIncidents";
import { IncidentDrawer } from "./IncidentDrawer";
import { OperationalMap } from "./OperationalMap";
import type { MunicipalIncident, OperationalStats, IncidentsApiResponse } from "@/types";
import { Bell, AlertCircle } from "lucide-react";

export function Dashboard() {
  const [incidents, setIncidents] = useState<MunicipalIncident[]>([]);
  const [stats, setStats] = useState<OperationalStats>({
    totalOpen: 0,
    highOrCritical: 0,
    overdue: 0,
    escalated: 0,
  });
  const [lastSynced, setLastSynced] = useState<string>(new Date().toISOString());
  const [source, setSource] = useState<"dynamodb" | "fallback">("fallback");
  const [selectedIncident, setSelectedIncident] = useState<MunicipalIncident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevIncidentIdsRef = useRef<Set<string>>(new Set());

  const fetchIncidents = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load incidents from server");
      const data: IncidentsApiResponse = await res.json();

      // Check if new incident arrived for toast
      if (prevIncidentIdsRef.current.size > 0) {
        const newItems = data.reports.filter(
          (r) => !prevIncidentIdsRef.current.has(r.id)
        );
        if (newItems.length > 0) {
          setToastMessage(`New incident received: ${newItems[0].aiAnalysis.category}`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      }

      prevIncidentIdsRef.current = new Set(data.reports.map((r) => r.id));
      setIncidents(data.reports);
      setStats(data.stats);
      setLastSynced(data.synced);
      setSource(data.source);
      setErrorMessage(null);

      // Keep selected incident up to date if open in drawer
      setSelectedIncident((prev) => {
        if (!prev) return null;
        return data.reports.find((r) => r.id === prev.id) || prev;
      });
    } catch (err: any) {
      if (incidents.length === 0) {
        setErrorMessage(err?.message || "Unable to reach server");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [incidents.length]);

  // Initial load + 3-second live polling
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(() => {
      fetchIncidents();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const highestPriorityIncident = incidents[0] || null;

  return (
    <div className="min-h-screen bg-[#f7f6ff] text-[#4d4b66] flex flex-col">
      {/* Top Header */}
      <Header
        lastSynced={lastSynced}
        source={source}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchIncidents(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#4d4b66] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-[#7c7aac]/40 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Operations Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => fetchIncidents(true)}
              className="font-bold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-white rounded-2xl border border-[#e6e4f5]"></div>
            <div className="h-20 bg-white rounded-xl border border-[#e6e4f5]"></div>
            <div className="h-80 bg-white rounded-2xl border border-[#e6e4f5]"></div>
          </div>
        ) : (
          <>
            {/* FIRST MAJOR SECTION: Map Command Center */}
            <section className="space-y-4">
              {/* Interactive Operational Map */}
              <OperationalMap
                incidents={incidents}
                selectedId={selectedIncident?.id}
                onSelect={(inc) => setSelectedIncident(inc)}
              />

              {/* Operational Summary Strip */}
              <OperationalSummary stats={stats} />
            </section>

            {/* NEEDS ATTENTION: Flagship High-Priority Incident */}
            {highestPriorityIncident && (
              <NeedsAttention
                incident={highestPriorityIncident}
                onSelect={(inc) => setSelectedIncident(inc)}
              />
            )}

            {/* RECENT INCIDENTS: Clean Operational List */}
            <RecentIncidents
              incidents={incidents}
              selectedId={selectedIncident?.id}
              onSelect={(inc) => setSelectedIncident(inc)}
            />
          </>
        )}
      </main>

      {/* Same-page Incident Drawer Inspector */}
      <IncidentDrawer
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </div>
  );
}
