# Running MedTrack Locally

This guide walks you through running the Flask backend and React frontend on your own machine.

---

## Prerequisites

- Python 3.9 or newer
- Node.js 18 or newer
- A Gemini API key (get one free at https://aistudio.google.com/app/apikey)

---

## 1. Open two terminals

You will need **two terminal windows open at the same time** — one for the backend, one for the frontend.

---

## 2. Set up the Python backend

All commands in this section are run from the `backend/` folder.

```bash
cd backend
```

### Create a virtual environment

A virtual environment keeps the Python packages for this project isolated from the rest of your system.

```bash
python -m venv venv
```

### Activate the virtual environment

**Mac / Linux:**
```bash
source venv/bin/activate
```

**Windows (Command Prompt):**
```bat
venv\Scripts\activate
```

**Windows (Git Bash):**
```bash
source venv/Scripts/activate
```

You'll know it worked when you see `(venv)` at the start of your terminal prompt.

### Install dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, the Gemini SDK, Pillow, and everything else the backend needs.

---

## 3. Add your Gemini API key

Copy the example env file:

**Mac / Linux / Git Bash:**
```bash
cp .env.example .env
```

**Windows (Command Prompt):**
```bat
copy .env.example .env
```

Open the new `.env` file in any text editor and replace `your_key_here` with your actual key:

```
GEMINI_API_KEY=AIza...your_real_key_here
```

The `.env` file is listed in `.gitignore` — it will never be committed to Git.

---

## 4. Start the Flask backend

Make sure your virtual environment is still active (you see `(venv)` in the prompt), then run:

```bash
python app.py
```

You should see:

```
Starting MedTrack backend on http://localhost:5000
 * Running on http://127.0.0.1:5000
```

Leave this terminal running.

---

## 5. Start the React frontend (second terminal)

Open a **new terminal window**, navigate to the root of the project (the folder that contains `package.json`), and run:

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## Ports at a glance

| Service        | URL                      |
|----------------|--------------------------|
| Flask backend  | http://localhost:5000    |
| React frontend | http://localhost:5173    |

Both must be running at the same time for the app to work.

---

## Where files are saved

| What                          | Location                  |
|-------------------------------|---------------------------|
| Uploaded prescription images  | `backend/uploads/`        |
| Extracted prescription data   | `backend/extractions/`    |

Each upload produces two files: the original image in `uploads/` and a `.json` file with the same base name in `extractions/`. The JSON files are what the `GET /api/prescriptions` endpoint reads from.

---

## Stopping the servers

Press `Ctrl + C` in each terminal to stop Flask and Vite.

To deactivate the virtual environment when you're done:

```bash
deactivate
```
