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

import streamlit as st
import streamlit.components.v1 as components

# Add citypulse root to path so we can import agent
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from agent import make_agent_for_request

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
            # Trigger report with no photo (motion-only detection)
            with st.spinner(t("analyzing")):
                msg = (
                    f"A pothole was detected by motion sensor at coordinates "
                    f"{lat:.6f}, {lon:.6f}. "
                    f"No photo available. Please file a report with severity estimate."
                )
                response = make_agent_for_request(
                    session_id=st.session_state.session_id,
                    actor_id="user",
                    user_message=msg,
                )
            st.success(response)
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
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    if st.button(t("submit"), use_container_width=True, type="primary"):
        with st.spinner(t("analyzing")):
            msg = (
                f"I have a road damage photo. Please confirm if it's a real pothole "
                f"and file a report at coordinates {lat:.6f}, {lon:.6f}. "
                f"Here is the image as base64:\n{image_b64}"
            )
            response = make_agent_for_request(
                session_id=st.session_state.session_id,
                actor_id="user",
                user_message=msg,
            )
        st.success(response)
        # Map link
        st.markdown(
            f"[📍 View on Google Maps](https://www.google.com/maps?q={lat},{lon})",
            unsafe_allow_html=False,
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
