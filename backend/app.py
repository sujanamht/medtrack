"""
MedTrack Flask Backend
Handles prescription image uploads, Gemini AI extraction, and serving saved prescriptions.
"""

import os
import json
import uuid
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

# ---------------------------------------------------------------------------
# Config & Setup
# ---------------------------------------------------------------------------

# Load environment variables from .env file (GEMINI_API_KEY, etc.)
load_dotenv()

app = Flask(__name__)

# Allow requests from the Vite dev server running on localhost:5173
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

# Folders for uploads, extracted JSONs, and diet data
BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
EXTRACTION_FOLDER = BASE_DIR / "extractions"
DIETS_FOLDER = BASE_DIR / "diets"

# Create folders if they don't already exist
UPLOAD_FOLDER.mkdir(exist_ok=True)
EXTRACTION_FOLDER.mkdir(exist_ok=True)
DIETS_FOLDER.mkdir(exist_ok=True)

# File types we'll accept
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "pdf"}

# Configure the Gemini client with the API key from .env
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")

client = genai.Client(api_key=gemini_api_key)


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def allowed_file(filename: str) -> bool:
    """Return True if the file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}


def read_image_bytes(file_path: Path) -> tuple[bytes, str]:
    """Read a file from disk and return (raw_bytes, mime_type)."""
    suffix = file_path.suffix.lower()
    mime_type = MIME_TYPES.get(suffix, "application/octet-stream")
    with open(file_path, "rb") as f:
        data = f.read()
    return data, mime_type


def extract_prescription_with_gemini(file_path: Path) -> dict:
    """
    Send the image/PDF to Gemini and return the parsed prescription as a dict.
    Raises ValueError if Gemini returns something that isn't valid JSON.
    """
    raw_bytes, mime_type = read_image_bytes(file_path)

    # The exact prompt instructing Gemini to return only raw JSON
    prompt = (
        "Parse this prescription and return ONLY valid JSON, no markdown, no explanation: "
        '{ "patientName": "", "doctorName": "", "dateIssued": "", '
        '"medications": [{ "name": "", "dosage": "", "frequency": "", '
        '"durationDays": 0, "notes": "" }] }'
    )

    image_part = types.Part.from_bytes(data=raw_bytes, mime_type=mime_type)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[image_part, prompt],
    )
    raw_text = response.text.strip()

    # Gemini sometimes wraps JSON in ```json ... ``` even when asked not to —
    # strip markdown fences defensively.
    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        # Remove first and last fence lines
        raw_text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned non-JSON response: {raw_text}") from exc


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload_prescription():
    """
    POST /api/upload
    Accepts a multipart/form-data request with a 'file' field.
    Saves the file, calls Gemini to extract data, saves the JSON, and returns it.
    """
    # 1. Validate that a file was included in the request
    if "file" not in request.files:
        return jsonify({"error": "No file field in request"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # 2. Generate a unique filename to avoid collisions
    original_ext = Path(file.filename).suffix.lower()
    unique_stem = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    safe_filename = unique_stem + original_ext

    # 3. Save the uploaded file to the uploads/ folder
    upload_path = UPLOAD_FOLDER / safe_filename
    file.save(upload_path)

    # 4. Call Gemini to extract prescription data
    try:
        prescription_data = extract_prescription_with_gemini(upload_path)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502  # Bad Gateway — upstream AI issue
    except Exception as exc:
        return jsonify({"error": f"Gemini API error: {str(exc)}"}), 502

    # 5. Attach metadata and save the extraction as a JSON file
    prescription_data["_meta"] = {
        "filename": safe_filename,
        "uploadedAt": datetime.now().isoformat(),
        "filepath": str(upload_path),
    }

    extraction_path = EXTRACTION_FOLDER / (unique_stem + ".json")
    with open(extraction_path, "w", encoding="utf-8") as f:
        json.dump(prescription_data, f, indent=2, ensure_ascii=False)

    # 6. Return the extracted data to the frontend
    return jsonify(prescription_data), 200


@app.route("/api/prescriptions", methods=["GET"])
def list_prescriptions():
    """
    GET /api/prescriptions
    Returns a list of all saved prescription extractions, newest first.
    """
    prescriptions = []

    for json_file in sorted(EXTRACTION_FOLDER.glob("*.json"), reverse=True):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            prescriptions.append(data)
        except (json.JSONDecodeError, OSError):
            # Skip corrupted or unreadable files silently
            continue

    return jsonify(prescriptions), 200


DIET_CACHE_FILE = DIETS_FOLDER / "diet_cache.json"


def collect_meds() -> list[str]:
    """Return list of 'name dosage' strings from all saved prescription extractions."""
    meds = []
    for json_file in sorted(EXTRACTION_FOLDER.glob("*.json"), reverse=True):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            for med in data.get("medications", []):
                name = med.get("name", "").strip()
                dosage = med.get("dosage", "").strip()
                if name:
                    meds.append(f"{name} {dosage}".strip())
        except (json.JSONDecodeError, OSError):
            continue
    return meds


def call_gemini(prompt: str) -> dict:
    """Call Gemini, strip markdown fences if present, and return parsed JSON dict."""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[prompt],
    )
    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        raw_text = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
    return json.loads(raw_text)


@app.route("/api/diet-recommendations", methods=["GET"])
def diet_recommendations():
    """
    GET /api/diet-recommendations
    Reads saved prescriptions, sends only med name+dosage to Gemini,
    and returns minified diet recommendations with short keys.
    Result is cached in diets/diet_cache.json.
    """
    # Return cached result if it exists
    if DIET_CACHE_FILE.exists():
        try:
            with open(DIET_CACHE_FILE, "r", encoding="utf-8") as f:
                return jsonify(json.load(f)), 200
        except (json.JSONDecodeError, OSError):
            pass  # Cache corrupted — fall through to regenerate

    meds = collect_meds()
    if not meds:
        return jsonify({"error": "No prescriptions found"}), 404

    prompt = (
        f'Patient takes: {", ".join(meds)}. '
        'Return ONLY minified JSON (no spaces, no markdown): '
        '{"conditions":[{"name":"","icon":"fa-solid fa-x","color":""}],'
        '"eat":["",""],'
        '"avoid":["",""],'
        '"meals":[{"m":"","t":"","s":""}]} '
        'Rules: max 6 items in eat, max 6 in avoid, exactly 5 meals '
        '(Breakfast, Mid-morning, Lunch, Afternoon, Dinner). '
        'For meals use specific real food names (e.g. "Grilled salmon with brown rice and steamed broccoli" '
        'not "healthy protein with grains"). Be concrete, no generic terms like "lean protein" or "whole grains".'
    )

    try:
        result = call_gemini(prompt)
    except json.JSONDecodeError:
        return jsonify({"error": "Gemini returned non-JSON"}), 502
    except Exception as exc:
        return jsonify({"error": f"Gemini API error: {str(exc)}"}), 502

    with open(DIET_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    return jsonify(result), 200


@app.route("/api/meal-plan/regenerate", methods=["POST"])
def regenerate_meal_plan():
    """
    POST /api/meal-plan/regenerate
    Generates a fresh meal plan from Gemini, updates only the meals key
    in diets/diet_cache.json, and returns {"meals": [...]}.
    """
    meds = collect_meds()
    if not meds:
        return jsonify({"error": "No prescriptions found"}), 404

    prompt = (
        f'Patient takes: {", ".join(meds)}. '
        'Suggest a daily meal plan safe for their medications. '
        'Use specific real food names (e.g. "Grilled salmon with brown rice and steamed broccoli" '
        'not "healthy protein with grains"). '
        'Be concrete, no generic terms like "lean protein" or "whole grains". '
        'Return ONLY minified JSON, no markdown: '
        '{"meals":[{"m":"","t":"","s":""}]} '
        'Exactly 5 meals (Breakfast, Mid-morning, Lunch, Afternoon, Dinner).'
    )

    try:
        result = call_gemini(prompt)
    except json.JSONDecodeError:
        return jsonify({"error": "Gemini returned non-JSON"}), 502
    except Exception as exc:
        return jsonify({"error": f"Gemini API error: {str(exc)}"}), 502

    new_meals = result.get("meals", [])

    # Load existing cache and update only the meals key
    cache = {}
    if DIET_CACHE_FILE.exists():
        try:
            with open(DIET_CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
        except (json.JSONDecodeError, OSError):
            pass

    cache["meals"] = new_meals

    with open(DIET_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)

    return jsonify({"meals": new_meals}), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # debug=True enables auto-reload on code changes (handy during development)
    print("Starting MedTrack backend on http://localhost:5001")
    app.run(debug=True, port=5001)
