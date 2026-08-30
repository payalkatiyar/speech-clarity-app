# 🎙️ Speech Clarity App

An AI-powered web application designed to assess, analyze, and track speech clarity and intelligibility over time (e.g., for ALS speech monitoring and speech therapy progress).

---

## ✨ Features

- **🎙️ In-Browser Audio Recording**: Record voice samples directly from the microphone in `.wav` format.
- **🧠 Deep Learning Scoring**: Uses a pre-trained **CNN-BiGRU + Temporal Attention** PyTorch model to evaluate speech clarity (0.0 to 1.0 score).
- **📊 Interactive Dashboard**: Visual progress tracking and historical clarity score charts (powered by Recharts).
- **🔐 Secure Authentication & Storage**: User accounts and audio storage powered by **Supabase**.
- **⚡ Modern & Responsive UI**: Fast and intuitive interface built with React, Vite, and custom styling.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Recharts, Lucide Icons, Axios, Supabase Client
- **Backend**: FastAPI, PyTorch, Librosa, NumPy, SciPy, Uvicorn
- **Database & Storage**: Supabase (PostgreSQL & Storage Buckets)

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Supabase Account** (for authentication and audio storage)

---

### 1. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   uvicorn api:app --reload --port 8000
   ```
   The backend API will run at `http://localhost:8000`.

---

### 2. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables in `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```text
speech-app/
├── backend/
│   ├── api.py               # FastAPI application & /predict endpoint
│   ├── audio_processing.py  # Audio preprocessing & MFCC feature extraction
│   ├── cnn_gru_model.pth    # Trained PyTorch model weights
│   ├── model.py             # CNN-BiGRU with Temporal Attention architecture
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Recorder, Dashboard, Chart, AudioList, Auth
│   │   ├── api.js           # API calls and Supabase helper functions
│   │   └── supabase.js      # Supabase client setup
│   ├── package.json         # Node.js dependencies & scripts
│   └── vite.config.js       # Vite configuration
├── vercel.json              # Vercel deployment configuration
└── README.md                # Project documentation
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
