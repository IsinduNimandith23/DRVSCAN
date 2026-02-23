# Driver Distraction Severity Detector - Backend

Python Flask backend with CNN model inference for driver distraction detection.

## Setup

1. Create a virtual environment:

   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Place your trained model in the `models/` directory:
   ```
   backend/
   └── models/
       └── distraction_model.h5
   ```

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:3000`.

## API Endpoints

### POST /api/detect

Upload an image for distraction detection.

**Request:**

- Content-Type: `multipart/form-data`
- Field: `image` (image file)

**Response:**

```json
{
  "severity": "Low" | "Medium" | "High",
  "score": 0.0 - 1.0,
  "explanation": "string",
  "class": "predicted_class_name",
  "confidence": 0.0 - 1.0
}
```

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true | false
}
```

## Model Configuration

Edit `app.py` to configure:

- `CLASS_LABELS`: Map model output indices to class names
- `SEVERITY_MAP`: Map class names to severity levels
- `preprocess_image()`: Adjust image preprocessing for your model
- Input size (default: 224x224)

## Using PyTorch Instead of TensorFlow

1. In `requirements.txt`, comment out TensorFlow and uncomment PyTorch
2. In `app.py`, update the import statements and `load_model()` function
