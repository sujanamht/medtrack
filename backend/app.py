"""
MedTrack Flask Backend
Handles prescription uploads, Gemini AI extraction, email notifications, and serving saved prescriptions.
"""

import os
import json
import uuid
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

# ---------------------------------------------------------------------------
# Config & Setup
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)

BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
EXTRACTION_FOLDER = BASE_DIR / "extractions"
NOTIFICATIONS_FOLDER = BASE_DIR / "notifications"

UPLOAD_FOLDER.mkdir(exist_ok=True)
EXTRACTION_FOLDER.mkdir(exist_ok=True)
NOTIFICATIONS_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}

gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")

client = genai.Client(api_key=gemini_api_key)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "MedTrack")


# ---------------------------------------------------------------------------
# Helper: file utilities
# ---------------------------------------------------------------------------

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}


def read_image_bytes(file_path: Path) -> tuple[bytes, str]:
    suffix = file_path.suffix.lower()
    mime_type = MIME_TYPES.get(suffix, "application/octet-stream")
    with open(file_path, "rb") as f:
        data = f.read()
    return data, mime_type


# ---------------------------------------------------------------------------
# Helper: Gemini extraction
# ---------------------------------------------------------------------------

def extract_prescription_with_gemini(file_path: Path) -> dict:
    """Send image/PDF to Gemini and return parsed prescription as a dict."""
    raw_bytes, mime_type = read_image_bytes(file_path)

    prompt = (
        "Parse this prescription and return ONLY valid JSON, no markdown, no explanation: "
        '{ "patientName": "", "doctorName": "", "dateIssued": "", '
        '"clinicName": "", "clinicPhone": "", "clinicWebsite": "", '
        '"medications": [{ "name": "", "dosage": "", "frequency": "", '
        '"durationDays": 0, "notes": "" }] }'
    )

    image_part = types.Part.from_bytes(data=raw_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[image_part, prompt],
    )
    raw_text = response.text.strip()

    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        raw_text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned non-JSON response: {raw_text}") from exc


# ---------------------------------------------------------------------------
# Helper: frequency parsing
# ---------------------------------------------------------------------------

def parse_frequency(frequency_str: str) -> tuple[int, list[str]]:
    """Return (times_per_day, [HH:MM, ...]) from a human frequency string."""
    freq = (frequency_str or "").lower().strip()

    if any(x in freq for x in ["four times", "qid", "4x", "q6h", "every 6 hour"]):
        return 4, ["07:00", "12:00", "17:00", "21:00"]
    if any(x in freq for x in ["three times", "thrice", "tid", "3x", "q8h", "every 8 hour"]):
        return 3, ["08:00", "14:00", "20:00"]
    if any(x in freq for x in ["twice", "two times", "bid", "2x", "q12h", "every 12 hour"]):
        return 2, ["08:00", "20:00"]
    return 1, ["08:00"]


# ---------------------------------------------------------------------------
# Helper: email
# ---------------------------------------------------------------------------

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured — skipping email to %s", to_email)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info("Email sent to %s — %s", to_email, subject)
        return True
    except Exception as exc:
        logger.error("Email failed to %s: %s", to_email, exc)
        return False


def _reminder_html(patient_name: str, med_name: str, dosage: str, frequency: str, notes: str) -> str:
    notes_row = f'<div style="font-size:12px;color:#9ca3af;margin-top:6px;font-style:italic">{notes}</div>' if notes else ""
    return f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <div style="background:#2563eb;color:white;padding:20px 24px;border-radius:12px 12px 0 0">
    <h2 style="margin:0;font-size:20px">&#128138; Medicine Reminder</h2>
    <p style="margin:4px 0 0;opacity:.85;font-size:14px">MedTrack &mdash; Your Health Companion</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
    <p style="margin:0 0 16px;font-size:15px;color:#374151">
      Hello {patient_name or "there"}, it&rsquo;s time to take your medication.
    </p>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px">
      <div style="font-size:18px;font-weight:700;color:#1e40af;margin-bottom:4px">{med_name}</div>
      <div style="font-size:13px;color:#6b7280"><b>Dosage:</b> {dosage or "As prescribed"}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:2px"><b>Frequency:</b> {frequency or "As prescribed"}</div>
      {notes_row}
    </div>
    <p style="font-size:12px;color:#9ca3af;margin:0">
      Automated reminder from MedTrack. Take medication as prescribed by your doctor.
    </p>
  </div>
</div>"""


def _low_supply_html(
    patient_name: str,
    med_name: str,
    dosage: str,
    days_remaining: int,
    doctor_name: str,
    clinic_name: str,
    clinic_phone: str,
    clinic_website: str,
) -> str:
    urgency = "#ef4444" if days_remaining <= 1 else "#f97316"
    actions = ""
    if clinic_website:
        actions += (
            f'<a href="{clinic_website}" style="display:block;background:#2563eb;color:white;'
            f'text-align:center;padding:12px;border-radius:8px;text-decoration:none;'
            f'font-size:14px;font-weight:600;margin-bottom:8px">&#128197; Book an Appointment Online</a>'
        )
    if clinic_phone:
        contact_label = clinic_name or doctor_name or "Your Doctor"
        actions += (
            f'<a href="tel:{clinic_phone}" style="display:block;background:white;color:#2563eb;'
            f'border:2px solid #2563eb;text-align:center;padding:12px;border-radius:8px;'
            f'text-decoration:none;font-size:14px;font-weight:600">'
            f'&#128222; Call {contact_label}: {clinic_phone}</a>'
        )
    if not actions:
        actions = '<p style="font-size:13px;color:#6b7280;text-align:center">Contact your doctor to arrange a prescription refill.</p>'

    day_word = "day" if days_remaining == 1 else "days"
    return f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <div style="background:{urgency};color:white;padding:20px 24px;border-radius:12px 12px 0 0">
    <h2 style="margin:0;font-size:20px">&#9888;&#65039; Medication Running Low</h2>
    <p style="margin:4px 0 0;opacity:.85;font-size:14px">MedTrack &mdash; Refill Alert</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
    <p style="margin:0 0 16px;font-size:15px;color:#374151">
      Hello {patient_name or "there"}, your medication needs a refill soon.
    </p>
    <div style="background:white;border:2px solid {urgency};border-radius:10px;padding:16px;margin-bottom:20px">
      <div style="font-size:18px;font-weight:700;color:#1e40af;margin-bottom:4px">{med_name}</div>
      <div style="font-size:13px;color:#6b7280"><b>Dosage:</b> {dosage or "As prescribed"}</div>
      <div style="font-size:15px;font-weight:700;color:{urgency};margin-top:8px">
        Only <b>{days_remaining} {day_word}</b> of supply remaining!
      </div>
    </div>
    <p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:12px">What would you like to do?</p>
    {actions}
    <p style="font-size:11px;color:#9ca3af;margin-top:16px;text-align:center">
      Automated alert from MedTrack. Always consult your doctor before stopping any medication.
    </p>
  </div>
</div>"""


def _welcome_html(patient_name: str, welcome_times: list[str]) -> str:
    rows = "".join(
        f'<div style="font-size:13px;color:#4b5563;padding:4px 0;border-bottom:1px solid #f3f4f6">&#9200; {t}</div>'
        for t in welcome_times
    )
    return f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <div style="background:#2563eb;color:white;padding:20px 24px;border-radius:12px 12px 0 0">
    <h2 style="margin:0;font-size:20px">&#9989; Reminders Activated!</h2>
    <p style="margin:4px 0 0;opacity:.85;font-size:14px">MedTrack &mdash; Your Health Companion</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
    <p style="margin:0 0 16px;font-size:15px;color:#374151">
      Hello {patient_name or "there"}, your medication reminders have been set up successfully.
    </p>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">Your scheduled reminders:</p>
      {rows}
    </div>
    <p style="font-size:13px;color:#6b7280">
      You&rsquo;ll also receive alerts 3 days before your medication runs out, with options to book an appointment or call your doctor.
    </p>
  </div>
</div>"""


# ---------------------------------------------------------------------------
# Notification config helpers
# ---------------------------------------------------------------------------

def _load_configs() -> list[dict]:
    configs = []
    for f in NOTIFICATIONS_FOLDER.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as fp:
                configs.append(json.load(fp))
        except Exception:
            continue
    return configs


def _save_config(config: dict) -> None:
    path = NOTIFICATIONS_FOLDER / f"{config['prescriptionId']}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Scheduler jobs
# ---------------------------------------------------------------------------

def run_medicine_reminders() -> None:
    """Send per-dose reminders. Runs hourly — fires within 30 min of scheduled time."""
    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute
    today = now.strftime("%Y-%m-%d")

    for config in _load_configs():
        if not config.get("active"):
            continue
        sent_log = config.setdefault("sentReminders", {})

        for med in config.get("medications", []):
            for sched_time in med.get("scheduledTimes", []):
                sh, sm = map(int, sched_time.split(":"))
                if abs(current_minutes - (sh * 60 + sm)) > 30:
                    continue
                key = f"{today}_{med['name']}_{sched_time}"
                if key in sent_log:
                    continue
                subject = f"Time to take your {med['name']} \U0001f48a"
                body = _reminder_html(
                    config.get("patientName", ""),
                    med["name"],
                    med.get("dosage", ""),
                    med.get("frequency", ""),
                    med.get("notes", ""),
                )
                if send_email(config["userEmail"], subject, body):
                    sent_log[key] = now.isoformat()
                    _save_config(config)


def run_low_supply_check() -> None:
    """Send refill alerts when supply drops to ≤3 days. Runs daily at 8am."""
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")

    for config in _load_configs():
        if not config.get("active"):
            continue
        sent_alerts = config.setdefault("sentAlerts", {})
        try:
            start = datetime.fromisoformat(config.get("startDate", today_str))
        except ValueError:
            start = today

        for med in config.get("medications", []):
            days_remaining = max(0, med.get("durationDays", 30) - (today - start).days)
            if days_remaining > 3:
                continue
            key = f"{today_str}_{med['name']}_low"
            if key in sent_alerts:
                continue
            subject = f"⚠️ {med['name']} is running low — {days_remaining} day{'s' if days_remaining != 1 else ''} remaining"
            body = _low_supply_html(
                config.get("patientName", ""),
                med["name"],
                med.get("dosage", ""),
                days_remaining,
                config.get("doctorName", ""),
                config.get("clinicName", ""),
                config.get("clinicPhone", ""),
                config.get("clinicWebsite", ""),
            )
            if send_email(config["userEmail"], subject, body):
                sent_alerts[key] = today.isoformat()
                _save_config(config)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload_prescription():
    """POST /api/upload — accept prescription image/PDF, extract with Gemini, save and return."""
    if "file" not in request.files:
        return jsonify({"error": "No file field in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    original_ext = Path(file.filename).suffix.lower()
    unique_stem = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    safe_filename = unique_stem + original_ext

    upload_path = UPLOAD_FOLDER / safe_filename
    file.save(upload_path)

    try:
        prescription_data = extract_prescription_with_gemini(upload_path)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        return jsonify({"error": f"Gemini API error: {str(exc)}"}), 502

    prescription_data["_meta"] = {
        "filename": safe_filename,
        "uploadedAt": datetime.now().isoformat(),
        "filepath": str(upload_path),
    }

    extraction_path = EXTRACTION_FOLDER / (unique_stem + ".json")
    with open(extraction_path, "w", encoding="utf-8") as f:
        json.dump(prescription_data, f, indent=2, ensure_ascii=False)

    return jsonify(prescription_data), 200


@app.route("/api/prescriptions", methods=["GET"])
def list_prescriptions():
    """GET /api/prescriptions — return all saved extractions, newest first."""
    prescriptions = []
    for json_file in sorted(EXTRACTION_FOLDER.glob("*.json"), reverse=True):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            prescriptions.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    return jsonify(prescriptions), 200


@app.route("/api/notifications/setup", methods=["POST"])
def setup_notifications():
    """
    POST /api/notifications/setup
    Body: { prescriptionId, userEmail, startDate }
    Registers email reminders for a saved prescription and sends a welcome email.
    """
    body = request.get_json(silent=True) or {}
    prescription_id = body.get("prescriptionId", "").strip()
    user_email = body.get("userEmail", "").strip()
    start_date = body.get("startDate", "").strip() or datetime.now().strftime("%Y-%m-%d")

    if not prescription_id:
        return jsonify({"error": "prescriptionId is required"}), 400
    if not user_email or "@" not in user_email:
        return jsonify({"error": "A valid userEmail is required"}), 400

    extraction_path = EXTRACTION_FOLDER / f"{prescription_id}.json"
    if not extraction_path.exists():
        return jsonify({"error": f"Prescription '{prescription_id}' not found"}), 404

    with open(extraction_path, "r", encoding="utf-8") as f:
        rx = json.load(f)

    meds_with_schedule = []
    for med in rx.get("medications", []):
        times_per_day, scheduled_times = parse_frequency(med.get("frequency", ""))
        meds_with_schedule.append({
            "name": med.get("name", ""),
            "dosage": med.get("dosage", ""),
            "frequency": med.get("frequency", ""),
            "durationDays": med.get("durationDays", 30),
            "notes": med.get("notes", ""),
            "timesPerDay": times_per_day,
            "scheduledTimes": scheduled_times,
        })

    config = {
        "prescriptionId": prescription_id,
        "userEmail": user_email,
        "startDate": start_date,
        "active": True,
        "createdAt": datetime.now().isoformat(),
        "patientName": rx.get("patientName", ""),
        "doctorName": rx.get("doctorName", ""),
        "clinicName": rx.get("clinicName", ""),
        "clinicPhone": rx.get("clinicPhone", ""),
        "clinicWebsite": rx.get("clinicWebsite", ""),
        "medications": meds_with_schedule,
        "sentReminders": {},
        "sentAlerts": {},
    }
    _save_config(config)

    welcome_times = [
        f"{m['name']} at {t}"
        for m in meds_with_schedule
        for t in m.get("scheduledTimes", [])
        if m["name"]
    ]
    send_email(
        user_email,
        "✅ MedTrack Reminders Activated",
        _welcome_html(rx.get("patientName", ""), welcome_times),
    )

    return jsonify({"success": True, "scheduledTimes": welcome_times}), 200


@app.route("/api/notifications", methods=["GET"])
def list_notifications():
    """GET /api/notifications — return active prescription IDs that have reminders configured."""
    configs = _load_configs()
    active_ids = [c["prescriptionId"] for c in configs if c.get("active")]
    return jsonify({"activeIds": active_ids}), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_medicine_reminders, CronTrigger(minute=0), id="reminders", replace_existing=True)
    scheduler.add_job(run_low_supply_check, CronTrigger(hour=8, minute=0), id="supply_check", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started — reminders hourly, supply check daily at 8am")

    print("Starting MedTrack backend on http://localhost:5001")
    # use_reloader=False prevents APScheduler from starting twice in debug mode
    app.run(debug=True, port=5001, use_reloader=False)
