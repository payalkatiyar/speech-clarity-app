import os
import sys
import gc
import shutil
import uuid
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from audio_processing import preprocess_audio, extract_mfcc

app = FastAPI(title="ALS Speech Clarity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load lightweight ONNX model (< 90MB RAM) with PyTorch fallback
onnx_path = os.path.join(os.path.dirname(__file__), "cnn_gru_model.onnx")
pth_path = os.path.join(os.path.dirname(__file__), "cnn_gru_model.pth")

ort_session = None
torch_model = None

if os.path.exists(onnx_path):
    try:
        import onnxruntime as ort
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        ort_session = ort.InferenceSession(onnx_path, sess_options=opts, providers=['CPUExecutionProvider'])
        dummy = np.zeros((1, 1, 120, 200), dtype=np.float32)
        _ = ort_session.run(None, {'input': dummy})
        print("✅ ONNX Model loaded and pre-warmed successfully (ultra-low memory)")
    except Exception as e:
        print(f"⚠️ ONNX load error: {e}")

if ort_session is None and os.path.exists(pth_path):
    try:
        import torch
        from model import CNN_GRU
        device = torch.device('cpu')
        torch_model = CNN_GRU().to(device)
        torch_model.load_state_dict(torch.load(pth_path, map_location=device, weights_only=True))
        torch_model.eval()
        print("✅ PyTorch fallback model loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load PyTorch model: {e}")

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Speech Clarity API",
        "version": "1.0.0",
        "engine": "ONNX Runtime (ultra-fast)" if ort_session else "PyTorch"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/predict")
async def predict_clarity(audio: UploadFile = File(...)):
    filename = audio.filename or "recording.wav"
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        ext = ".wav"
        
    file_id = uuid.uuid4().hex
    temp_path = os.path.join(TEMP_DIR, f"{file_id}{ext}")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        result = preprocess_audio(temp_path, delete_if_silent=False)
        if result is None:
            raise HTTPException(status_code=400, detail="Audio invalid, too short, or too silent.")
            
        signal, sr = result
        features = extract_mfcc(signal, sr)
        
        # Shape: (1, 1, 120, 200)
        input_data = np.expand_dims(np.expand_dims(features.astype(np.float32), axis=0), axis=0)
        
        if ort_session is not None:
            raw_out = ort_session.run(None, {'input': input_data})[0]
            score = float(raw_out)
        elif torch_model is not None:
            import torch
            tensor_features = torch.tensor(input_data, dtype=torch.float32)
            with torch.inference_mode():
                score = torch_model(tensor_features).item()
        else:
            raise HTTPException(status_code=500, detail="Model engine not loaded.")
            
        del input_data, features, signal, result
        gc.collect()
        
        return {"clarity_score": float(np.clip(score, 0.0, 1.0))}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        gc.collect()
