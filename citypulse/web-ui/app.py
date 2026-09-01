"""
app.py — Wasel (واصل) Web UI
Bilingual (EN/AR) Streamlit app with:
  - Motion detection trigger via JavaScript DeviceMotion API
  - Camera / file upload for manual reporting
  - GPS capture via browser Geolocation API
  - Full Wasel agent pipeline: vision → report → priority → alert
"""

import base64
import json
import uuid
import sys
import os
import random
import io

import streamlit as st
import streamlit.components.v1 as components
from PIL import Image

# Add citypulse root to path so we can import agent and tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from agent import make_agent_for_request
from tools import confirm_pothole, file_pothole_report, get_nearby_reports, calculate_priority, notify_construction

# Riyadh-area bounding box for demo coordinates
_RIYADH_LATS = (24.60, 24.85)
_RIYADH_LONS = (46.55, 46.85)

def _demo_coords() -> tuple[float, float]:
    """Return a random coordinate within Riyadh for demo purposes."""
    return (
        round(random.uniform(*_RIYADH_LATS), 6),
        round(random.uniform(*_RIYADH_LONS), 6),
    )

def _resize_b64(image_bytes: bytes, max_px: int = 800) -> str:
    """Resize image to max_px on longest side and return base64 JPEG string."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((max_px, max_px), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82)
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def _run_pipeline(image_b64: str, lat: float, lon: float) -> dict:
    """Run the full Wasel pipeline directly (bypass text agent for vision step)."""
    # Step 1 — vision confirmation
    vision_raw = confirm_pothole(image_b64)
    vision = json.loads(vision_raw)

    if not vision.get("confirmed"):
        return {"confirmed": False, "vision": vision}

    severity = vision.get("severity", "medium")

    # Step 2 — nearby reports
    nearby_raw = get_nearby_reports(lat, lon, 1.0)
    nearby = json.loads(nearby_raw)
    nearby_count = len(nearby)

    # Step 3 — priority
    priority_raw = calculate_priority(severity, nearby_count, 0)
    priority = json.loads(priority_raw)

    # Step 4 — file report
    report_raw = file_pothole_report(
        latitude=lat,
        longitude=lon,
        severity=severity,
        description=vision.get("description", "Road damage detected."),
        description_ar=vision.get("description_ar", "تم اكتشاف ضرر في الطريق."),
        image_base64=image_b64,
        source="manual",
    )
    report = json.loads(report_raw)

    # Step 5 — alert
    msg_id = notify_construction(
        report_id=report["report_id"],
        latitude=lat,
        longitude=lon,
        severity=severity,
        priority_label=priority["priority_label"],
        description=vision.get("description", ""),
        nearby_count=nearby_count,
        sla_days=priority["recommended_sla_days"],
    )

    return {
        "confirmed": True,
        "vision": vision,
        "priority": priority,
        "report_id": report["report_id"],
        "nearby_count": nearby_count,
        "sns_message_id": msg_id,
        "lat": lat,
        "lon": lon,
    }

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="واصل | Wasel",
    page_icon="🚧",
    layout="centered",
)

# ── Language toggle ───────────────────────────────────────────────────────────
lang = st.sidebar.radio("🌐 Language / اللغة", ["English", "العربية"], index=0)
AR = lang == "العربية"

T = {
    "title":          ("واصل | Wasel", "واصل | Wasel"),
    "tagline":        ("Smart Road Reporting for Saudi Arabia",
                       "تقارير الطرق الذكية للمملكة العربية السعودية"),
    "motion_header":  ("Motion Detection", "كشف الحركة"),
    "motion_info":    ("Enable motion detection to auto-detect potholes while driving.",
                       "فعّل كشف الحركة لاكتشاف الحفر تلقائياً أثناء القيادة."),
    "motion_btn":     ("Enable Motion Detection 📳", "تفعيل كشف الحركة 📳"),
    "pothole_prompt": ("Pothole detected! Was that a pothole?",
                       "تم اكتشاف حفرة! هل كانت حفرة؟"),
    "yes":            ("Yes, report it ✅", "نعم، أبلّغ عنها ✅"),
    "no":             ("No, ignore ❌", "لا، تجاهل ❌"),
    "manual_header":  ("Manual Report 📷", "تقرير يدوي 📷"),
    "upload_label":   ("Take a photo or upload an image of the road damage:",
                       "التقط صورة أو ارفع صورة لأضرار الطريق:"),
    "gps_header":     ("Location 📍", "الموقع 📍"),
    "gps_btn":        ("Get My Location 📍", "احصل على موقعي 📍"),
    "gps_manual":     ("Or enter coordinates manually:", "أو أدخل الإحداثيات يدوياً:"),
    "lat":            ("Latitude", "خط العرض"),
    "lon":            ("Longitude", "خط الطول"),
    "submit":         ("Submit Report 🚧", "إرسال التقرير 🚧"),
    "analyzing":      ("Analyzing road damage with AI...", "جارٍ تحليل أضرار الطريق بالذكاء الاصطناعي..."),
    "chat_header":    ("Chat with Wasel 💬", "تحدث مع واصل 💬"),
    "chat_input":     ("Ask about a report or road issue...", "اسأل عن تقرير أو مشكلة طريق..."),
    "how_it_works":   ("How it works", "كيف يعمل"),
}

def t(key: str) -> str:
    """Return the translated string for the current language."""
    return T[key][1] if AR else T[key][0]

# RTL styling for Arabic
if AR:
    st.markdown("""
    <style>
        .main { direction: rtl; text-align: right; }
        .stTextInput > label, .stFileUploader > label { text-align: right; }
        .stButton button { float: right; }
    </style>
    """, unsafe_allow_html=True)

# ── Session state ─────────────────────────────────────────────────────────────
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if "gps" not in st.session_state:
    st.session_state.gps = {"lat": 24.7136, "lon": 46.6753}  # Default: Riyadh
if "motion_triggered" not in st.session_state:
    st.session_state.motion_triggered = False
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# ── Header ────────────────────────────────────────────────────────────────────
st.markdown(f"# 🚧 {t('title')}")
st.markdown(f"*{t('tagline')}*")
st.divider()

# ── How it works expander ─────────────────────────────────────────────────────
with st.expander(t("how_it_works")):
    if AR:
        st.markdown("""
1. 📳 **كشف الحركة**: يكتشف التطبيق الاهتزاز أثناء القيادة
2. 📷 **تأكيد الصورة**: يحلل الذكاء الاصطناعي الصورة للتحقق من الحفرة
3. 📍 **التقاط الموقع**: يسجل إحداثيات GPS تلقائياً
4. 📊 **حساب الأولوية**: يصنّف الذكاء الاصطناعي الحفرة حسب الخطورة
5. 🚧 **تنبيه شركة البناء**: يُرسل تنبيهاً فورياً لأقرب فريق إصلاح
        """)
    else:
        st.markdown("""
1. 📳 **Motion Detection**: App detects vibration while driving
2. 📷 **Vision Confirmation**: AI analyzes photo to verify it's a real pothole
3. 📍 **GPS Capture**: Coordinates recorded automatically
4. 📊 **Priority Scoring**: AI ranks urgency by severity and cluster size
5. 🚧 **Construction Alert**: Instant notification sent to nearest repair team
        """)

# ── GPS capture via browser ───────────────────────────────────────────────────
st.subheader(t("gps_header"))

# JavaScript component to get browser GPS
gps_html = """
<script>
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                const data = {lat: pos.coords.latitude, lon: pos.coords.longitude};
                window.parent.postMessage({type: 'GPS', data: data}, '*');
                document.getElementById('gps-status').innerText =
                    '✅ ' + data.lat.toFixed(5) + ', ' + data.lon.toFixed(5);
            },
            function(err) {
                document.getElementById('gps-status').innerText = '❌ ' + err.message;
            }
        );
    }
}
</script>
<button onclick="getLocation()" style="
    background:#2ecc71; color:white; border:none; padding:8px 16px;
    border-radius:6px; cursor:pointer; font-size:14px;">
    📍 Get Location
</button>
<p id="gps-status" style="color:#666; margin-top:8px;">Click to capture GPS coordinates</p>
"""
components.html(gps_html, height=90)

# Manual coordinate fallback
col1, col2 = st.columns(2)
with col1:
    lat = st.number_input(t("lat"), value=st.session_state.gps["lat"],
                          format="%.6f", key="lat_input")
with col2:
    lon = st.number_input(t("lon"), value=st.session_state.gps["lon"],
                          format="%.6f", key="lon_input")

st.divider()

# ── Motion detection section ──────────────────────────────────────────────────
st.subheader(t("motion_header"))
st.info(t("motion_info"))

motion_html = """
<script>
var motionEnabled = false;
var lastAlert = 0;
var threshold = 15;  // m/s² — tune for road conditions

function enableMotion() {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(function(state) {
            if (state === 'granted') startListening();
        });
    } else {
        startListening();
    }
    document.getElementById('motion-status').innerText = '✅ Motion detection active';
}

function startListening() {
    motionEnabled = true;
    window.addEventListener('devicemotion', function(e) {
        if (!motionEnabled) return;
        var acc = e.accelerationIncludingGravity;
        if (!acc) return;
        var mag = Math.sqrt(acc.x*acc.x + acc.y*acc.y + acc.z*acc.z);
        var now = Date.now();
        if (mag > threshold && now - lastAlert > 3000) {
            lastAlert = now;
            window.parent.postMessage({type: 'MOTION_TRIGGER', magnitude: mag}, '*');
            document.getElementById('motion-status').innerText =
                '🚨 Bump detected! Magnitude: ' + mag.toFixed(1);
        }
    });
}
</script>
<button onclick="enableMotion()" style="
    background:#e74c3c; color:white; border:none; padding:8px 16px;
    border-radius:6px; cursor:pointer; font-size:14px;">
    📳 Enable Motion Detection
</button>
<p id="motion-status" style="color:#666; margin-top:8px;">Tap to activate (works on mobile)</p>
"""
components.html(motion_html, height=90)

# Simulate motion trigger for demo purposes
if st.button("🚗 Simulate Pothole Detection (Demo)", use_container_width=True):
    st.session_state.motion_triggered = True

if st.session_state.motion_triggered:
    st.warning(f"⚠️ {t('pothole_prompt')}")
    col_yes, col_no = st.columns(2)
    with col_yes:
        if st.button(t("yes"), use_container_width=True, type="primary"):
            st.session_state.motion_triggered = False
            demo_lat, demo_lon = _demo_coords()
            with st.spinner(t("analyzing")):
                # No photo for motion trigger — file directly with medium severity
                priority_raw = calculate_priority("medium", 0, 0)
                priority = json.loads(priority_raw)
                report_raw = file_pothole_report(
                    latitude=demo_lat, longitude=demo_lon,
                    severity="medium",
                    description="Pothole detected via motion sensor while driving.",
                    description_ar="تم اكتشاف حفرة عبر مستشعر الحركة أثناء القيادة.",
                    source="motion",
                )
                report = json.loads(report_raw)
                notify_construction(
                    report_id=report["report_id"],
                    latitude=demo_lat, longitude=demo_lon,
                    severity="medium",
                    priority_label=priority["priority_label"],
                    description="Pothole detected via motion sensor.",
                    nearby_count=0,
                    sla_days=priority["recommended_sla_days"],
                )
            st.success(f"""
✅ **Motion report filed!**
**Report ID:** `{report["report_id"]}`
📊 Priority: {priority["priority_label"]}
📍 Location: {demo_lat:.5f}, {demo_lon:.5f}
🚧 Construction team alerted!
""")
            st.markdown(f"[📍 View on Google Maps](https://www.google.com/maps?q={demo_lat},{demo_lon})")
    with col_no:
        if st.button(t("no"), use_container_width=True):
            st.session_state.motion_triggered = False
            st.info("Ignored. Keep driving safely! / تم التجاهل. قُد بأمان!")

st.divider()

# ── Manual photo upload section ───────────────────────────────────────────────
st.subheader(t("manual_header"))
uploaded = st.file_uploader(
    t("upload_label"),
    type=["jpg", "jpeg", "png"],
    accept_multiple_files=False,
)

if uploaded:
    st.image(uploaded, caption="📷 Uploaded image", use_container_width=True)
    image_bytes = uploaded.read()

    if st.button(t("submit"), use_container_width=True, type="primary"):
        # Use demo coords (random Riyadh location) instead of default fixed point
        demo_lat, demo_lon = _demo_coords()

        with st.spinner(t("analyzing")):
            image_b64 = _resize_b64(image_bytes)
            result = _run_pipeline(image_b64, demo_lat, demo_lon)

        if not result["confirmed"]:
            confidence = result["vision"].get("confidence", "low")
            desc = result["vision"].get("description", "No road damage detected.")
            st.warning(f"⚠️ Not confirmed as a pothole ({confidence} confidence)\n\n{desc}")
        else:
            v = result["vision"]
            p = result["priority"]
            severity_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(v["severity"], "⚪")

            st.success(f"""
### ✅ Pothole Confirmed & Reported!

**Report ID:** `{result['report_id']}`

{severity_emoji} **Severity:** {v['severity'].upper()}
📊 **Priority Score:** {p['score']}/100 — {p['priority_label']}
⏱️ **SLA:** Fix within {p['recommended_sla_days']} day(s)
📍 **Location:** {result['lat']:.5f}, {result['lon']:.5f}
🗺️ **Nearby reports:** {result['nearby_count']} within 1 km
🚧 **Construction team alerted!**

> {v['description']}
> {v['description_ar']}
""")
            st.markdown(
                f"[📍 View on Google Maps](https://www.google.com/maps?q={result['lat']},{result['lon']})"
            )

st.divider()

# ── Chat interface ────────────────────────────────────────────────────────────
st.subheader(t("chat_header"))

# Render chat history
for message in st.session_state.chat_history:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat input
if prompt := st.chat_input(t("chat_input")):
    st.session_state.chat_history.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("واصل يفكر... / Wasel is thinking..."):
            reply = make_agent_for_request(
                session_id=st.session_state.session_id,
                actor_id="user",
                user_message=prompt,
            )
        st.markdown(reply)
    st.session_state.chat_history.append({"role": "assistant", "content": reply})

# ── Footer ────────────────────────────────────────────────────────────────────
st.divider()
st.caption("واصل | Wasel — Built with Amazon Bedrock & Strands Agents 🇸🇦")
