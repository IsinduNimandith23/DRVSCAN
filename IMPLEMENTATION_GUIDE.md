# DRVSCAN Video Analysis Implementation Guide

## 🎯 Overview

This guide walks you through the complete video upload, analysis, and alarm system for driver distraction detection. Your application now supports:

- ✅ **Image Analysis** - Detect driver distraction in single images
- ✅ **Video Analysis** - Process entire videos frame-by-frame
- ✅ **Real-time Alarms** - Audio alerts when high-severity distractions detected
- ✅ **Detailed Reports** - Timestamp and severity breakdown of all distractions

---

## 🚀 Setup Instructions

### Step 1: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `opencv-python` - Video frame extraction
- `torchvision` - Preprocessing support
- `flask` & `flask-cors` - Backend API
- `torch`, `pillow`, `numpy` - ML/Image processing

### Step 2: Start the Backend Server

```bash
cd backend
python app.py
```

Expected output:
```
==================================================
  Driver Distraction Detector - Backend
==================================================
[Model] Loaded: models/efficientnet_b3_final.pth
[Server] http://localhost:3000
==================================================
```

### Step 3: Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📱 How to Use

### **Image Analysis**
1. Click the **📷 Image** tab
2. Drag & drop an image or click to select
3. Click **🔍 Analyze Image**
4. View severity level and distraction details

### **Video Analysis**
1. Click the **📹 Video** tab
2. Drag & drop a video or click to select
3. Click **🔍 Analyze Video**
4. Wait for frame-by-frame analysis
5. View results:
   - 📊 Total distracted frames percentage
   - 🚨 High-severity distractions with timestamps
   - 🔔 Option to trigger manual alarm if needed

### **Alarm System**
- **Automatic**: Alarm triggers automatically when high-severity distraction is detected during video analysis
- **Manual**: Click "🔔 Trigger Alarm" button in results to play alarm manually
- **Duration**: 3-second alert with pulsing sound
- **Feedback**: Visual shake animation and badge notification

---

## 🔧 Architecture Overview

### **Backend Flow**
```
Video Upload
    ↓
Extract Frames (every 10th frame)
    ↓
Preprocess Each Frame
    ↓
Run EfficientNet-B3 Model
    ↓
Classify: Safe/Distracted + Severity
    ↓
Return Detections with Timestamps
    ↓
Frontend Triggers Alarm if High Severity
```

### **Key Backend Endpoints**

#### **POST /api/detect** (Image Analysis)
```json
Request:
{
  "image": <File>
}

Response:
{
  "severity": "High|Medium|Low",
  "score": 0.95,
  "class": "texting_right",
  "confidence": 0.98,
  "explanation": "Strong distraction signs..."
}
```

#### **POST /api/analyze-video** (Video Analysis)
```json
Request:
{
  "video": <File>,
  "frame_interval": 10,
  "severity_threshold": "Low"
}

Response:
{
  "total_frames_analyzed": 150,
  "distracted_frames": 45,
  "distraction_percentage": 30.0,
  "detections": [
    {
      "timestamp": 2.5,
      "timestamp_formatted": "00:02",
      "frame_number": 25,
      "class": "texting_right",
      "severity": "High",
      "confidence": 0.92,
      "explanation": "..."
    }
  ]
}
```

---

## 🎓 Distraction Classes

Your model detects 10 driver distraction types:

| Class | Description | Severity |
|-------|-------------|----------|
| `safe_driving` | Focused on road | Low ✅ |
| `texting_right` | Using phone (right) | High 🚨 |
| `texting_left` | Using phone (left) | High 🚨 |
| `talking_phone_right` | Phone call (right) | Medium ⚠️ |
| `talking_phone_left` | Phone call (left) | Medium ⚠️ |
| `operating_radio` | Adjusting radio | Medium ⚠️ |
| `drinking` | Consuming beverage | Medium ⚠️ |
| `reaching_behind` | Reaching back seat | High 🚨 |
| `hair_makeup` | Personal grooming | High 🚨 |
| `talking_passenger` | Conversation (normal) | Low ✅ |

---

## ⚙️ Advanced Configuration

### **Backend (app.py)**
```python
# Adjust video processing
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # Max 100MB
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'}

# Frame extraction rate (higher = faster but less accurate)
frame_interval = 10  # Analyze every 10th frame
```

### **Frontend (Home.jsx)**
```javascript
// Customize alarm parameters
formData.append('frame_interval', 10)
formData.append('severity_threshold', 'Low')  // 'Low', 'Medium', 'High'

// In VideoResultCard.jsx - adjust alarm sound
alarmSound.playAlarm(3000,  // Duration (ms)
                     800,   // Frequency 1 (Hz)
                     600)   // Frequency 2 (Hz)
```

### **Alarm Sound (utils/alarmSound.js)**
```javascript
// Custom alarm parameters
alarmSound.playAlarm(duration = 3000, frequency1 = 800, frequency2 = 600)
alarmSound.playBeep(frequency = 1000, duration = 200)
alarmSound.stopAlarm()
```

---

## 🐛 Troubleshooting

### **Issue: "Model not loaded" error**
- ✅ Ensure `models/efficientnet_b3_final.pth` exists in backend folder
- ✅ Check file path in `.env`: `MODEL_PATH=models/efficientnet_b3_final.pth`

### **Issue: Video upload fails**
- ✅ Check file size (max 100MB)
- ✅ Verify video format (MP4 is most compatible)
- ✅ May need to install: `pip install opencv-python`

### **Issue: Alarm doesn't play**
- ✅ Browser must grant audio permission (click anywhere first)
- ✅ Check browser console for errors: Press F12 → Console tab
- ✅ Unmute system volume

### **Issue: Slow video processing**
- ✅ Increase `frame_interval` (e.g., 20 = every 20th frame)
- ✅ Use GPU: Check if CUDA is available in backend logs
- ✅ Reduce video resolution before uploading

### **Issue: CORS errors**
- ✅ Backend must allow frontend origin
- ✅ In `app.py`: `CORS(app, origins=['http://localhost:5173'])`

---

## 📊 Example Workflow

### Processing a 60-second video:

1. **Upload** (2 sec) - Send 50MB video
2. **Extract Frames** (5 sec) - ~150 frames extracted
3. **Analyze** (30-45 sec) - Run model on each frame
4. **Aggregate** (1 sec) - Compile results
5. **Display + Alarm** (automatic) - Show results instantly

**Total Time**: ~45-65 seconds for 60-second video

---

## 🔐 Security Considerations

1. **File Validation**: All uploads checked for type and size
2. **Temp Cleanup**: Video files deleted after processing
3. **CORS Restricted**: Backend only accepts requests from frontend
4. **Model Safety**: Model runs inference on GPU or CPU securely

---

## 📈 Next Steps (Optional Enhancements)

- [ ] Add video preview/playback in results
- [ ] Store analysis history/reports
- [ ] Real-time camera feed analysis
- [ ] Export results as PDF report
- [ ] Multi-detection tracking (identify recurring drivers)
- [ ] Custom alert sounds
- [ ] SMS/Email notifications for fleet management

---

## 📞 Support

For issues or questions:
1. Check backend logs: `python app.py` output
2. Check frontend console: Press F12 → Console
3. Verify model path and dependencies
4. Ensure CORS is properly configured

---

**You're all set! Start analyzing videos now! 🚗🎯**
