"use client";

import React, { useEffect, useRef, useState } from "react";
import type { MunicipalIncident } from "@/types";
import { Navigation, Layers } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";

interface OperationalMapProps {
  incidents: MunicipalIncident[];
  selectedId?: string;
  onSelect: (incident: MunicipalIncident) => void;
}

export function OperationalMap({
  incidents,
  selectedId,
  onSelect,
}: OperationalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainer.current || mapInstance.current) return;

      try {
        const maplibreModule = await import("maplibre-gl");
        const maplibregl = (maplibreModule as any).default || maplibreModule;

        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              "osm-tiles": {
                type: "raster",
                tiles: [
                  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [
              {
                id: "osm-layer",
                type: "raster",
                source: "osm-tiles",
                paint: {
                  "raster-opacity": 0.82,
                  "raster-saturation": -0.65,
                  "raster-contrast": 0.05,
                },
              },
            ],
          },
          center: [46.6753, 24.7136], // Riyadh
          zoom: 12.5,
          pitch: 20,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        mapInstance.current = map;
      } catch (err) {
        console.warn("MapLibre initialization fallback:", err);
        if (isMounted) setMapError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current || mapError) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("maplibre-gl").then((maplibreModule) => {
      const maplibregl = (maplibreModule as any).default || maplibreModule;

      incidents.forEach((inc) => {
        const lat = inc.citizenInput.latitude || 24.7136;
        const lon = inc.citizenInput.longitude || 46.6753;
        const isCritical = inc.aiAnalysis.severityLevel === "critical" || inc.status === "escalated";
        const isSelected = inc.id === selectedId;

        const el = document.createElement("div");
        el.className = "cursor-pointer transition transform hover:scale-125 duration-150";
        el.style.width = isSelected ? "32px" : "26px";
        el.style.height = isSelected ? "32px" : "26px";

        el.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            border-radius: 9999px;
            background: ${isCritical ? "#dc2626" : "#4d4b66"};
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(77, 75, 102, 0.35);
            font-size: 11px;
            font-weight: 800;
          ">
            ${isCritical ? "!" : "•"}
          </div>
        `;

        el.addEventListener("click", () => {
          onSelect(inc);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(mapInstance.current);

        markersRef.current.push(marker);
      });
    });
  }, [incidents, selectedId, onSelect, mapError]);

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-[#e6e4f5] bg-[#eeedf8] shadow-xs">
      {!mapError ? (
        <div ref={mapContainer} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#fbfaff] p-6 text-center">
          <Layers className="w-8 h-8 text-[#7c7aac] mb-2" />
          <p className="text-xs font-semibold text-[#4d4b66]">
            Spatial Command Radar Active
          </p>
          <p className="text-[11px] text-[#7c7aac] mt-0.5">
            {incidents.length} geolocated municipal incidents tracked in Riyadh region
          </p>
        </div>
      )}

      {/* Map Header Floating Overlay */}
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-[#e6e4f5] shadow-xs flex items-center gap-2 text-xs">
        <Navigation className="w-3.5 h-3.5 text-[#4d4b66]" />
        <span className="font-bold text-[#4d4b66]">Riyadh Municipal Sector</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#eeedf8] text-[#7c7aac] font-medium">
          {incidents.length} Pins
        </span>
      </div>
    </div>
  );
}
