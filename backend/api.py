import os
import shutil
import uuid
import torch
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from model import CNN_GRU
from audio_processing import preprocess_audio, extract_mfcc

app = FastAPI(title="ALS Speech Clarity API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CNN_GRU().to(device)

try:
    model_path = os.path.join(os.path.dirname(__file__), "cnn_gru_model.pth")
    model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
    model.eval()
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Failed to load model: {e}")

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/predict")
async def predict_clarity(audio: UploadFile = File(...)):
    if not audio.filename.lower().endswith('.wav'):
        raise HTTPException(status_code=400, detail="Only .wav files are supported.")
    
    # Prevent path traversal and race conditions
    file_id = uuid.uuid4().hex
    temp_path = os.path.join(TEMP_DIR, f"{file_id}.wav")
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        result = preprocess_audio(temp_path, delete_if_silent=False)
        if result is None:
            raise HTTPException(status_code=400, detail="Audio invalid, too short, or too silent.")
            
        signal, sr = result
        features = extract_mfcc(signal, sr)
        
        tensor_features = torch.tensor(features, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
        
        with torch.no_grad():
            score = model(tensor_features).item()
            
        return {"clarity_score": float(np.clip(score, 0.0, 1.0))}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
