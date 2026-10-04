import os
import sys
import gc

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gradio as gr
from api import app

# Gradio user interface for manual testing in Hugging Face browser
def gradio_predict(audio_path):
    if not audio_path:
        return "Please upload an audio file."
    try:
        from audio_processing import preprocess_audio, extract_mfcc
        import torch
        from model import CNN_GRU
        import numpy as np

        device = torch.device('cpu')
        model = CNN_GRU().to(device)
        model_path = os.path.join(os.path.dirname(__file__), "cnn_gru_model.pth")
        model.load_state_dict(torch.load(model_path, map_location=device, weights_only=True))
        model.eval()

        result = preprocess_audio(audio_path)
        if result is None:
            return "⚠️ Audio invalid, too silent, or too short."
        signal, sr = result
        features = extract_mfcc(signal, sr)
        tensor_features = torch.tensor(features, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
        
        with torch.inference_mode():
            score = model(tensor_features).item()
            
        del tensor_features, features, signal, result
        gc.collect()
        
        clarity_pct = float(np.clip(score, 0.0, 1.0)) * 100
        return f"🎯 Clarity Score: {clarity_pct:.1f}% ({score:.4f})"
    except Exception as e:
        return f"❌ Error: {str(e)}"

# Create interactive visual interface for the Space page
demo = gr.Interface(
    fn=gradio_predict,
    inputs=gr.Audio(type="filepath", label="Test Audio"),
    outputs=gr.Textbox(label="Clarity Evaluation"),
    title="🎙️ Speech Clarity Analyzer API",
    description="This Space hosts the FastAPI backend for your Vercel Speech Clarity App. The `/predict` REST endpoint is live and accessible."
)

# Mount Gradio onto the existing FastAPI app at root (or /) while keeping /predict and /health live
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
