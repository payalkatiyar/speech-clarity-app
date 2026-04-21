import numpy as np
import wave
import struct

# Create a valid silent audio file
file_path = "test.wav"
sr = 16000
duration = 1.0  # seconds
num_samples = int(sr * duration)
audio_data = np.random.normal(0, 0.1, num_samples) * 32767

with wave.open(file_path, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    for sample in audio_data:
        w.writeframesraw(struct.pack("<h", int(sample)))

from fastapi.testclient import TestClient
from api import app

client = TestClient(app)
with open(file_path, "rb") as f:
    response = client.post("/predict", files={"audio": ("test.wav", f, "audio/wav")})

print("Status:", response.status_code)
print("Response:", response.json())
