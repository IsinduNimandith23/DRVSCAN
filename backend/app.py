from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models
import io
import os
import cv2
import tempfile
from pathlib import Path

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:5174'])

# Config
MODEL_PATH = os.path.join(os.path.dirname(__file__), os.getenv('MODEL_PATH', 'models/efficientnet_b3_final.pth'))
MAX_FILE_SIZE = 5 * 1024 * 1024
INPUT_SIZE = 300  # EfficientNet-B3 uses 300x300
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv'}
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB for videos

# Class labels - adjust to match your model's output
CLASS_LABELS = {
    0: 'safe_driving',
    1: 'texting_right',
    2: 'talking_phone_right',
    3: 'texting_left',
    4: 'talking_phone_left',
    5: 'operating_radio',
    6: 'drinking',
    7: 'reaching_behind',
    8: 'hair_makeup',
    9: 'talking_passenger'
}

SEVERITY_MAP = {
    'safe_driving': 'Low',
    'texting_right': 'High',
    'talking_phone_right': 'Medium',
    'texting_left': 'High',
    'talking_phone_left': 'Medium',
    'operating_radio': 'Medium',
    'drinking': 'Medium',
    'reaching_behind': 'High',
    'hair_makeup': 'High',
    'talking_passenger': 'Low'
}

EXPLANATIONS = {
    'Low': 'No strong distraction indicators detected. The driver appears focused on the road.',
    'Medium': 'Some distraction cues detected. Consider removing potential distractions.',
    'High': 'Strong distraction signs present. Immediate attention required for safety.'
}

model = None
NUM_CLASSES = 10


def load_model():
    """Load PyTorch EfficientNet-B3 model from disk."""
    global model
    
    if not os.path.exists(MODEL_PATH):
        print(f"[Error] Model not found: {MODEL_PATH}")
        return False
    
    try:
        # Create EfficientNet-B3 architecture
        model = models.efficientnet_b3(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, NUM_CLASSES)
        
        # Load checkpoint
        checkpoint = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
        state_dict = checkpoint['model_state_dict']
        
        # Remove 'efficientnet.' prefix if present
        new_state_dict = {}
        for k, v in state_dict.items():
            new_key = k.replace('efficientnet.', '') if k.startswith('efficientnet.') else k
            new_state_dict[new_key] = v
        
        model.load_state_dict(new_state_dict)
        model.eval()
        
        print(f"[Model] Loaded: {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"[Error] Failed to load model: {e}")
        return False


def preprocess_image(image_bytes):
    """Preprocess image for PyTorch model."""
    image = Image.open(io.BytesIO(image_bytes))
    
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    image = image.resize((INPUT_SIZE, INPUT_SIZE), Image.Resampling.LANCZOS)
    img_array = np.array(image, dtype=np.float32) / 255.0
    
    # HWC -> CHW format for PyTorch
    img_array = np.transpose(img_array, (2, 0, 1))
    tensor = torch.from_numpy(img_array).unsqueeze(0)
    
    return tensor


def predict_distraction(image_bytes):
    """Run CNN prediction on the image."""
    global model
    
    if model is None:
        return None
    
    try:
        tensor = preprocess_image(image_bytes)
        
        with torch.no_grad():
            outputs = model(tensor)
            probabilities = F.softmax(outputs, dim=1)
        
        predicted_idx = torch.argmax(probabilities, dim=1).item()
        confidence = probabilities[0][predicted_idx].item()
        
        class_label = CLASS_LABELS.get(predicted_idx, 'unknown')
        severity = SEVERITY_MAP.get(class_label, 'Medium')
        
        # Score: 0 = safe, 1 = distracted
        score = 1.0 - confidence if class_label == 'safe_driving' else confidence
        
        explanation = f"{EXPLANATIONS[severity]} Detected: {class_label.replace('_', ' ')}."
        
        return {
            'severity': severity,
            'score': score,
            'explanation': explanation,
            'class': class_label,
            'confidence': confidence
        }
    except Exception as e:
        print(f"[Error] Prediction failed: {e}")
        return None


def extract_frames_from_video(video_path, frames_per_second=1):
    """Extract frames from video at specified frames per second."""
    frames = []
    timestamps = []  # in seconds
    
    try:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate frame interval, ensure it's at least 1
        frame_interval = max(1, int(fps / frames_per_second)) if frames_per_second > 0 else 1
        
        frame_count = 0
        captured_frames = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Extract frames at specified rate
            if frame_count % frame_interval == 0:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
                
                # Calculate timestamp in seconds
                timestamp = frame_count / fps if fps > 0 else 0
                timestamps.append(timestamp)
                captured_frames += 1
            
            frame_count += 1
        
        cap.release()
        print(f"[Video] Source FPS: {fps:.1f} | Extracted {captured_frames} frames from {frame_count} total")
        return frames, timestamps
    
    except Exception as e:
        print(f"[Error] Failed to extract frames: {e}")
        return [], []


def analyze_video(video_path, severity_threshold='Low'):
    """Analyze video and return distraction detections."""
    frames, timestamps = extract_frames_from_video(video_path, frames_per_second=1)
    
    if not frames:
        return None
    
    distracted_detections = []
    safe_detections = []
    distracted_frames = 0
    safe_frames = 0
    
    for i, (frame, timestamp) in enumerate(zip(frames, timestamps)):
        # Convert frame to PIL Image, serialize to bytes
        pil_image = Image.fromarray(frame)
        img_bytes = io.BytesIO()
        pil_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        result = predict_distraction(img_bytes.getvalue())
        
        if result:
            if result['class'] == 'safe_driving':
                # Record safe driving
                safe_detections.append({
                    'timestamp': timestamp,
                    'frame_number': i,
                    'class': result['class'],
                    'severity': 'Low',
                    'confidence': result['confidence'],
                    'explanation': 'Driver focused on road. No distractions detected.'
                })
                safe_frames += 1
            else:
                # Record distraction
                if result['severity'] in ['High', 'Medium', 'Low']:
                    if severity_threshold == 'High' and result['severity'] != 'High':
                        pass
                    elif severity_threshold == 'Medium' and result['severity'] not in ['High', 'Medium']:
                        pass
                    else:
                        distracted_detections.append({
                            'timestamp': timestamp,
                            'frame_number': i,
                            'class': result['class'],
                            'severity': result['severity'],
                            'confidence': result['confidence'],
                            'explanation': result['explanation']
                        })
                        distracted_frames += 1
        
        # Progress indicator
        if (i + 1) % 10 == 0:
            print(f"[Analysis] Processed {i + 1}/{len(frames)} frames")
    
    # Combine detections: distracted first, then safe
    all_detections = distracted_detections + safe_detections
    
    analysis_results = {
        'total_frames_analyzed': len(frames),
        'distracted_frames': distracted_frames,
        'safe_frames': safe_frames,
        'distraction_percentage': round((distracted_frames / len(frames) * 100), 2) if frames else 0,
        'detections': all_detections
    }
    
    return analysis_results


def format_timestamp(seconds):
    """Convert seconds to MM:SS format."""
    minutes = int(seconds) // 60
    secs = int(seconds) % 60
    return f"{minutes:02d}:{secs:02d}"


@app.route('/api/detect', methods=['POST'])
def detect_distraction_endpoint():
    """POST /api/detect - Analyze driver image."""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded. Please add model file.'}), 503
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided.'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No image file provided.'}), 400
        
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large. Maximum size is 5MB.'}), 400
        
        if not file.content_type.startswith('image/'):
            return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400
        
        image_bytes = file.read()
        
        print(f"[Request] {secure_filename(file.filename)}, {file_size / 1024:.1f}KB")
        
        result = predict_distraction(image_bytes)
        
        if result is None:
            return jsonify({'error': 'Prediction failed. Please try again.'}), 500
        
        print(f"[Result] {result['severity']} ({result['score']:.3f})")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"[Error] {e}")
        return jsonify({'error': 'Internal server error.'}), 500


@app.route('/api/analyze-video', methods=['POST'])
def analyze_video_endpoint():
    """POST /api/analyze-video - Analyze driver video for distraction."""
    temp_video_path = None
    
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded. Please add model file.'}), 503
        
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided.'}), 400
        
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({'error': 'No video file provided.'}), 400
        
        # Check file size
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_VIDEO_SIZE:
            return jsonify({'error': 'Video file too large. Maximum size is 100MB.'}), 400
        
        # Check file extension
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if file_ext not in ALLOWED_VIDEO_EXTENSIONS:
            return jsonify({'error': f'Invalid video format. Allowed: {", ".join(ALLOWED_VIDEO_EXTENSIONS)}'}), 400
        
        # Get parameters
        severity_threshold = request.form.get('severity_threshold', 'Low')
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=f'.{file_ext}', delete=False) as tmp:
            temp_video_path = tmp.name
            file.save(temp_video_path)
        
        print(f"[Request] Video: {secure_filename(file.filename)}, {file_size / (1024*1024):.1f}MB")
        print(f"[Processing] Analyzing at 1 frame per second, Severity threshold: {severity_threshold}")
        
        # Analyze video
        results = analyze_video(temp_video_path, severity_threshold)
        
        if results is None:
            return jsonify({'error': 'Failed to process video.'}), 500
        
        # Format timestamps
        for detection in results['detections']:
            detection['timestamp_formatted'] = format_timestamp(detection['timestamp'])
        
        print(f"[Result] Found {results['distracted_frames']} distracted frames ({results['distraction_percentage']}%)")
        
        return jsonify(results)
        
    except Exception as e:
        print(f"[Error] {e}")
        return jsonify({'error': 'Internal server error.'}), 500
    
    finally:
        # Clean up temp file
        if temp_video_path and os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
                print(f"[Cleanup] Removed temp video file")
            except:
                pass



@app.route('/api/health', methods=['GET'])
def health_check():
    """GET /api/health - Check server status."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("  Driver Distraction Detector - Backend")
    print("=" * 50)
    
    model_loaded = load_model()
    
    if not model_loaded:
        print(f"\n[!] Place your model at: {MODEL_PATH}")
        print("[!] Server will return errors until model is loaded.\n")
    
    print(f"[Server] http://localhost:3000")
    print("=" * 50 + "\n")
    
    app.run(host='0.0.0.0', port=3000, debug=True)