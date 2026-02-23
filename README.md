# Driver Distraction Severity Detector

AI-powered driver safety analysis system that detects driver distraction from images.

## Project Structure

```
DrvScan/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/           # Python Flask backend
│   ├── models/        # CNN model files
│   ├── app.py
│   └── requirements.txt
│
└── README.md
```

## Quick Start

### 1. Start the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

Backend runs on http://localhost:3000

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Adding Your Model

Place your trained CNN model at:

```
backend/models/distraction_model.h5
```

The backend will automatically load it on startup. Without a model, the system uses mock predictions for testing.

## License

MIT
