# MedTrack

A medication management app that uses AI to extract prescriptions, track adherence, send reminders, and recommend diet plans.

## Features

- **Prescription Upload** — Upload an image or PDF; Gemini AI extracts patient, doctor, and medication details automatically
- **Medication Tracking** — View all prescriptions in one place with supply status (Critical / Low / Good) and days remaining
- **Daily Adherence** — Mark doses as taken or skipped; weekly trend chart and live progress bar on the dashboard
- **Email Reminders** — Opt-in to automated dose reminders and low-supply alerts sent via email on a schedule
- **Diet Recommendations** — AI-generated foods to eat/avoid and a daily meal plan based on your medications
- **Doctor Contact** — All doctors from your prescriptions listed with phone numbers for one-tap calling

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Python, Flask, APScheduler |
| AI | Google Gemini 2.5 Flash |
| Email | smtplib (Gmail SMTP) |
| Storage | JSON files (no database) |

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```
GEMINI_API_KEY=your_key_here

# Optional — required only for email reminders
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password
```

Start the backend:

```bash
python app.py
```

Runs on `http://localhost:5001`.

### Frontend

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Project Structure

```
medtrack/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx          # Adherence tracking, weekly chart
│   │   ├── UploadPrescription.tsx # Upload, AI extraction, notification opt-in
│   │   ├── Medications.tsx        # All prescriptions, supply status
│   │   ├── Diet.tsx               # AI diet recommendations
│   │   └── Contact.tsx            # Doctor list with call links
│   └── App.tsx                    # Routing and layout
└── backend/
    ├── app.py                     # Flask API, Gemini integration, scheduler
    ├── extractions/               # Saved prescription JSON files
    ├── uploads/                   # Uploaded prescription images/PDFs
    ├── notifications/             # Email reminder configs
    └── diets/                     # Cached diet recommendations
```
