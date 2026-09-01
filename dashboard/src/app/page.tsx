"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Activity,
  Sparkles,
  RefreshCw,
  Check,
  Crosshair,
} from "lucide-react";
import type { MunicipalIncident } from "@/types";

interface SampleIncident {
  id: string;
  categoryName: string;
  shortType: string;
  imageUrl: string;
  defaultDescription: string;
  defaultLocation: string;
}

const SAMPLE_INCIDENTS: SampleIncident[] = [
  {
    id: "sample-pothole",
    categoryName: "Road Damage",
    shortType: "Deep Pothole",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80",
    defaultDescription: "Deep pothole in active fast lane causing vehicles to swerve suddenly.",
    defaultLocation: "King Fahd Road, Al-Olaya, Riyadh",
  },
  {
    id: "sample-flooding",
    categoryName: "Drainage Issue",
    shortType: "Road Flooding",
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
    defaultDescription: "Stormwater accumulation across two lanes blocking vehicle flow.",
    defaultLocation: "Prince Mohammed Bin Abdulaziz Rd, Al-Munsiyah, Riyadh",
  },
  {
    id: "sample-streetlight",
    categoryName: "Infrastructure",
    shortType: "Broken Streetlight",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    defaultDescription: "Non-functional streetlight creating nighttime blind spot on crossing.",
    defaultLocation: "Tahlia Street, Al-Wurud District, Riyadh",
  },
  {
    id: "sample-waste",
    categoryName: "Sanitation",
    shortType: "Waste Overflow",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80",
    defaultDescription: "Commercial waste receptacle overflowing onto public pavement.",
    defaultLocation: "Prince Sultan Street, Al-Nuzha, Riyadh",
  },
  {
    id: "sample-cracking",
    categoryName: "Road Damage",
    shortType: "Asphalt Cracks",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    defaultDescription: "Extensive pavement cracking spanning 20 meters near intersection.",
    defaultLocation: "Al-Uruba Road, Al-Sulaimaniyah, Riyadh",
  },
];

export default function PublicHomePage() {
  const [selectedSample, setSelectedSample] = useState<SampleIncident>(SAMPLE_INCIDENTS[0]);
  const [locationText, setLocationText] = useState(SAMPLE_INCIDENTS[0].defaultLocation);
  const [description, setDescription] = useState(SAMPLE_INCIDENTS[0].defaultDescription);
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 24.7136,
    lon: 46.6753,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>("");
  const [submittedIncident, setSubmittedIncident] = useState<MunicipalIncident | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectSample = (sample: SampleIncident) => {
    setSelectedSample(sample);
    setDescription(sample.defaultDescription);
    setLocationText(sample.defaultLocation);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationText(
            `GPS Coordinates (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}), Riyadh`
          );
        },
        () => {
          setLocationText("King Fahd Road, Al-Olaya, Riyadh");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage("Please enter a short description of the issue.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      setSubmitStep("Processing evidence...");
      await new Promise((r) => setTimeout(r, 400));

      setSubmitStep("Analyzing issue with AI agent...");
      await new Promise((r) => setTimeout(r, 500));

      setSubmitStep("Evaluating priority & filing report...");

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          photoBase64: selectedSample.imageUrl,
          locationText,
          latitude: coords.lat,
          longitude: coords.lon,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setSubmittedIncident(data.report);
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  };

  const handleReset = () => {
    setSelectedSample(SAMPLE_INCIDENTS[0]);
    setLocationText(SAMPLE_INCIDENTS[0].defaultLocation);
    setDescription(SAMPLE_INCIDENTS[0].defaultDescription);
    setSubmittedIncident(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#f7f6ff] text-[#4d4b66] flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-[#e6e4f5] bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4d4b66] text-white flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#4d4b66]">
                CityPulse
              </span>
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-[#eeedf8] text-[#7c7aac] font-medium border border-[#dcd9ef]">
                Resident Portal
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#4d4b66] hover:bg-[#3b3952] text-white transition shadow-xs"
          >
            <span>Municipal Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {!submittedIncident ? (
          <div className="bg-white rounded-2xl border border-[#e6e4f5] shadow-xs p-6 sm:p-8">
            {/* Hero Heading */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eeedf8] text-[#7c7aac] text-[11px] font-semibold mb-2.5 border border-[#dcd9ef]">
                <Sparkles className="w-3.5 h-3.5 text-[#4d4b66]" />
                <span>AI-Powered City Response</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#4d4b66]">
                Report an issue.
                <br />
                We’ll take it from here.
              </h1>
              <p className="mt-1.5 text-xs text-[#7c7aac] leading-relaxed">
                Select the issue, confirm the location, and CityPulse will analyze and route it automatically.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Sample Incident Image Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#7c7aac]">
                    Select Incident Evidence
                  </label>
                  <span className="text-[11px] text-[#7c7aac]">
                    Choose from verified evidence samples
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SAMPLE_INCIDENTS.map((sample) => {
                    const isSelected = selectedSample.id === sample.id;
                    return (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer transition border-2 ${
                          isSelected
                            ? "border-[#4d4b66] shadow-sm ring-2 ring-[#4d4b66]/20 bg-[#fbfaff]"
                            : "border-[#e6e4f5] hover:border-[#7c7aac] bg-[#fbfaff]"
                        }`}
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-[#eeedf8]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sample.imageUrl}
                            alt={sample.shortType}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#4d4b66] truncate">
                              {sample.shortType}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-[#4d4b66] text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-[#7c7aac] block mt-0.5 truncate">
                            {sample.categoryName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Location Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c7aac] mb-2">
                  Location
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 w-4 h-4 text-[#7c7aac]" />
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="Enter street or district name"
                    className="w-full pl-10 pr-32 py-2.5 bg-[#fbfaff] border border-[#dcd9ef] focus:border-[#4d4b66] focus:bg-white focus:outline-none rounded-xl text-xs text-[#4d4b66] transition"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="absolute right-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#eeedf8] hover:bg-[#e4e2f5] text-[#4d4b66] transition flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>GPS Location</span>
                  </button>
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7c7aac] mb-2">
                  What happened?
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue briefly..."
                  className="w-full p-3 bg-[#fbfaff] border border-[#dcd9ef] focus:border-[#4d4b66] focus:bg-white focus:outline-none rounded-xl text-xs text-[#4d4b66] transition resize-none leading-relaxed"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#4d4b66] hover:bg-[#3b3952] active:scale-[0.99] text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{submitStep || "Analyzing issue..."}</span>
                  </>
                ) : (
                  <>
                    <span>Submit Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Submission Confirmation Card */
          <div className="bg-white rounded-2xl border border-[#e6e4f5] shadow-xs p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#4d4b66]">
                Report Received
              </h2>
              <p className="text-xs text-[#7c7aac] mt-1">
                Your report has been received and will be reviewed by the municipal operations team.
              </p>
            </div>

            <div className="bg-[#fbfaff] rounded-xl border border-[#e6e4f5] p-4 space-y-3 mb-6 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#e6e4f5]">
                <span className="text-[#7c7aac]">Report ID</span>
                <span className="font-mono font-bold text-[#4d4b66]">
                  {submittedIncident.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#7c7aac]">Category</span>
                <span className="font-semibold text-[#4d4b66]">
                  {submittedIncident.aiAnalysis.category}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#7c7aac]">Status</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Submitted for review
                </span>
              </div>

              <div className="pt-2 border-t border-[#e6e4f5] text-[11px] text-[#7c7aac]">
                CityPulse is analyzing the issue and routing it to the appropriate workflow.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl bg-[#4d4b66] hover:bg-[#3b3952] text-white font-semibold text-xs text-center transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>View Municipal Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-[#dcd9ef] hover:bg-[#f7f6ff] text-[#4d4b66] font-semibold text-xs transition"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e6e4f5] py-4 text-center text-xs text-[#7c7aac]">
        CityPulse Municipal Operations • Powered by AWS Bedrock & Strands Agents
      </footer>
    </div>
  );
}
