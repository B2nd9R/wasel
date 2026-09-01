import type { MunicipalIncident } from "@/types";

const NOW = Date.now();
const min = (m: number) => new Date(NOW - m * 60_000).toISOString();
const hr = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const day = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const plus = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

export const FALLBACK_INCIDENTS: MunicipalIncident[] = [
  // ── 1. Flagship Critical Pothole on King Fahd Road ─────────────────────────
  {
    id: "R-260901-1842",
    createdAt: min(12),
    status: "escalated",
    citizenInput: {
      description: "A deep pothole in the fast lane is forcing vehicles to brake hard and swerve into adjacent lanes.",
      photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=960&q=80",
      locationText: "King Fahd Road, Al-Olaya District, Riyadh",
      latitude: 24.7136,
      longitude: 46.6753,
      source: "manual",
    },
    aiAnalysis: {
      category: "Road Damage — Pothole",
      problemDescription: "A large pothole was detected inside an active traffic lane. Its position and visible depth create a high risk of vehicle damage and sudden evasive maneuvers.",
      severityScore: 87,
      severityLevel: "critical",
      severityReason: "The pothole occupies a high-speed arterial lane with depth exceeding 15cm. Spatial clustering indicates 3 recurring structural reports nearby.",
      detectedRisks: [
        "Vehicle tire blowout and suspension failure",
        "Loss of vehicle control during high-speed traffic",
        "Secondary rear-end collisions from emergency braking",
        "Severe hazard for two-wheelers and delivery riders",
      ],
      recommendedSolutions: [
        {
          title: "Immediate Safety Control",
          description: "Place temporary warning barriers and reflective lane cones around the defect within 2 hours.",
          priority: "immediate",
        },
        {
          title: "Road Surface Repair",
          description: "Mill out compromised sub-base, patch with hot-mix asphalt, and compact to road level.",
          priority: "high",
        },
        {
          title: "Pavement Core Inspection",
          description: "Inspect 400m perimeter for subsurface voids caused by water runoff.",
          priority: "normal",
        },
      ],
      confidence: 0.96,
    },
    sla: {
      expectedResolutionDate: plus(4),
      remainingHours: 4,
      isOverdue: false,
      policySource: "Municipal SLA Standard — Critical Road Hazard (24h)",
      slaDays: 1,
    },
    relatedReports: {
      count: 3,
      reportIds: ["R-1002", "R-1003", "R-260829-1621"],
    },
    agentActions: [
      {
        id: "act-101",
        timestamp: min(12),
        action: "image_analyzed",
        title: "Claude Vision Analyzed Photo",
        description: "Confirmed deep asphalt fracture with high confidence (96%). Visual severity classified as Critical.",
        success: true,
      },
      {
        id: "act-102",
        timestamp: min(11),
        action: "nearby_reports_checked",
        title: "Spatial Clustering Evaluated",
        description: "Scanned 1.0 km radius: Found 3 related pothole reports on King Fahd Rd (Cluster bonus +15).",
        success: true,
      },
      {
        id: "act-103",
        timestamp: min(11),
        action: "sla_retrieved",
        title: "Priority & SLA Assigned",
        description: "Priority score calculated at 87/100. Resolution target set to 24 Hours.",
        success: true,
      },
      {
        id: "act-104",
        timestamp: min(10),
        action: "report_created",
        title: "Incident Filed in DynamoDB",
        description: "Report record persisted with GPS (24.7136, 46.6753) and S3 evidence photo.",
        success: true,
      },
      {
        id: "act-105",
        timestamp: min(10),
        action: "report_escalated",
        title: "Auto-Escalated by Agent",
        description: "Escalated due to high traffic volume on arterial King Fahd Road and active hazard level.",
        success: true,
      },
      {
        id: "act-106",
        timestamp: min(9),
        action: "contractor_notified",
        title: "Construction Dispatch Alerted",
        description: "Bilingual SNS alert dispatched to Municipal Road Maintenance Contractor with GPS location.",
        success: true,
      },
    ],
  },

  // ── 2. Road Flooding — Prince Mohammed Bin Abdulaziz ──────────────────────
  {
    id: "R-260901-1205",
    createdAt: hr(1),
    status: "new",
    citizenInput: {
      description: "Severe stormwater accumulation blocking right lanes. Water level rising.",
      photoUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=960&q=80",
      locationText: "Prince Mohammed Bin Abdulaziz Rd, Al-Munsiyah, Riyadh",
      latitude: 24.6641,
      longitude: 46.7731,
      source: "manual",
    },
    aiAnalysis: {
      category: "Drainage Failure — Road Flooding",
      problemDescription: "Standing floodwater spanning 35 meters across two traffic lanes following storm drainage blockage.",
      severityScore: 91,
      severityLevel: "critical",
      severityReason: "Concealed road depth and water buildup present immediate risk of vehicle hydroplaning and engine stalling.",
      detectedRisks: [
        "Vehicle engine hydro-lock and electrical stalling",
        "Hydroplaning at normal travel speeds",
        "Concealed pavement obstacles under murky water",
      ],
      recommendedSolutions: [
        {
          title: "Immediate Traffic Diversion",
          description: "Deploy mobile traffic barriers to guide traffic away from flooded lanes.",
          priority: "immediate",
        },
        {
          title: "Deploy Stormwater Pumping Unit",
          description: "Dispatch heavy suction tanker to discharge standing water into secondary main.",
          priority: "immediate",
        },
        {
          title: "Clear Catch Basin Blockage",
          description: "Remove debris and sediment from storm drain inlets along the curb.",
          priority: "high",
        },
      ],
      confidence: 0.98,
    },
    sla: {
      expectedResolutionDate: plus(2),
      remainingHours: 2,
      isOverdue: false,
      policySource: "Municipal Emergency Protocol — Storm Drainage (3h)",
      slaDays: 1,
    },
    relatedReports: {
      count: 1,
      reportIds: ["R-1005"],
    },
    agentActions: [
      {
        id: "act-201",
        timestamp: hr(1),
        action: "image_analyzed",
        title: "Vision Model Verified Flooding",
        description: "Water accumulation confirmed across active roadway (Confidence: 98%).",
        success: true,
      },
      {
        id: "act-202",
        timestamp: hr(1),
        action: "report_created",
        title: "Emergency Incident Created",
        description: "Filed incident R-260901-1205 under Drainage / Water category.",
        success: true,
      },
      {
        id: "act-203",
        timestamp: hr(1),
        action: "contractor_notified",
        title: "Emergency Drainage Unit Notified",
        description: "SNS broadcast sent to Public Works rapid response fleet.",
        success: true,
      },
    ],
  },

  // ── 3. Overdue High Severity Cracking — Al-Uruba Road ───────────────────────
  {
    id: "R-260829-1621",
    createdAt: day(3),
    status: "escalated",
    citizenInput: {
      description: "Severe alligator cracking along 20m of asphalt near the intersection.",
      photoUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=960&q=80",
      locationText: "Al-Uruba Road, Al-Sulaimaniyah, Riyadh",
      latitude: 24.7189,
      longitude: 46.6801,
      source: "manual",
    },
    aiAnalysis: {
      category: "Road Damage — Pavement Cracking",
      problemDescription: "Extensive alligator cracking pattern indicating subgrade pavement fatigue under repeated heavy vehicle loading.",
      severityScore: 74,
      severityLevel: "high",
      severityReason: "Cracking has expanded over 20 meters. Surface water penetration will cause full asphalt detachment.",
      detectedRisks: [
        "Rapid degradation into multiple large potholes",
        "Loose asphalt aggregate damaging car windshields",
        "Increased road surface vibration",
      ],
      recommendedSolutions: [
        {
          title: "Crack Sealing & Joint Filling",
          description: "Inject hot-pour elastomeric sealant to prevent water infiltration.",
          priority: "high",
        },
        {
          title: "Surface Overlay Resurfacing",
          description: "Schedule mill-and-fill resurfacing for a 50m road segment.",
          priority: "normal",
        },
      ],
      confidence: 0.91,
    },
    sla: {
      expectedResolutionDate: day(1),
      remainingHours: -22,
      isOverdue: true,
      policySource: "Municipal Road Maintenance Policy — High Severity (48h)",
      slaDays: 2,
    },
    relatedReports: {
      count: 2,
      reportIds: ["R-260901-1842", "R-1002"],
    },
    agentActions: [
      {
        id: "act-301",
        timestamp: day(3),
        action: "report_created",
        title: "Incident Registered",
        description: "Pavement crack report logged in municipal queue.",
        success: true,
      },
      {
        id: "act-302",
        timestamp: day(1),
        action: "report_escalated",
        title: "Automatic Overdue Escalation",
        description: "SLA deadline passed by 22 hours without crew dispatch — escalated to Operations Lead.",
        success: true,
      },
    ],
  },

  // ── 4. Broken Streetlight on Tahlia Street ──────────────────────────────────
  {
    id: "R-260901-0731",
    createdAt: hr(4),
    status: "under_review",
    citizenInput: {
      description: "Streetlight fixture knocked out and dark for 40 meters on pedestrian walkway.",
      photoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=960&q=80",
      locationText: "Tahlia Street, Al-Wurud District, Riyadh",
      latitude: 24.6877,
      longitude: 46.7219,
      source: "manual",
    },
    aiAnalysis: {
      category: "Infrastructure — Streetlight Failure",
      problemDescription: "Non-operational luminaire along pedestrian crossing creating a nighttime blind spot.",
      severityScore: 62,
      severityLevel: "high",
      severityReason: "Nighttime safety risk for pedestrians crossing multi-lane commercial corridor.",
      detectedRisks: [
        "Reduced pedestrian visibility to turning drivers",
        "Safety concerns for evening foot traffic",
      ],
      recommendedSolutions: [
        {
          title: "Temporary Auxiliary Lighting",
          description: "Deploy portable solar lighting beacon at the pedestrian crossing.",
          priority: "immediate",
        },
        {
          title: "Replace Luminaire & Driver",
          description: "Inspect electrical feeder line and install replacement LED unit.",
          priority: "high",
        },
      ],
      confidence: 0.92,
    },
    sla: {
      expectedResolutionDate: plus(20),
      remainingHours: 20,
      isOverdue: false,
      policySource: "Municipal Lighting SLA — High Foot-Traffic Corridor (24h)",
      slaDays: 1,
    },
    relatedReports: {
      count: 1,
      reportIds: ["R-1001"],
    },
    agentActions: [
      {
        id: "act-401",
        timestamp: hr(4),
        action: "image_analyzed",
        title: "Visual Lamp Inspection Complete",
        description: "Detected darkened luminaire fixture on Tahlia Street.",
        success: true,
      },
      {
        id: "act-402",
        timestamp: hr(4),
        action: "report_created",
        title: "Assigned to Electrical Department",
        description: "Routed to Utilities & Public Lighting Division.",
        success: true,
      },
    ],
  },

  // ── 5. Waste Overflow — Al-Nuzha ──────────────────────────────────────────
  {
    id: "R-260901-0412",
    createdAt: hr(7),
    status: "in_progress",
    citizenInput: {
      description: "Commercial bin overflow spilled onto sidewalk curb.",
      locationText: "Prince Sultan Street, Al-Nuzha, Riyadh",
      latitude: 24.7258,
      longitude: 46.6432,
      source: "manual",
    },
    aiAnalysis: {
      category: "Public Sanitation — Waste Overflow",
      problemDescription: "Overfilled refuse receptacle with approximately 3 square meters of debris on walkway.",
      severityScore: 38,
      severityLevel: "medium",
      severityReason: "Sanitation and odor concern; no immediate vehicular traffic impediment.",
      detectedRisks: [
        "Pedestrian walkway obstruction",
        "Public health and pest attraction",
      ],
      recommendedSolutions: [
        {
          title: "Dispatch Compactor Truck",
          description: "Empty overflowing bin and clean sidewalk zone.",
          priority: "high",
        },
        {
          title: "Re-evaluate Route Frequency",
          description: "Adjust daily collection cycle for commercial zone.",
          priority: "normal",
        },
      ],
      confidence: 0.93,
    },
    sla: {
      expectedResolutionDate: plus(41),
      remainingHours: 41,
      isOverdue: false,
      policySource: "Sanitation Service Agreement (48h)",
      slaDays: 2,
    },
    relatedReports: {
      count: 0,
      reportIds: [],
    },
    agentActions: [
      {
        id: "act-501",
        timestamp: hr(7),
        action: "report_created",
        title: "Sanitation Work Order Dispatched",
        description: "Compactor vehicle #14 assigned for scheduled pickup.",
        success: true,
      },
    ],
  },
];
