FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install audio processing system dependencies (libsndfile & ffmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code and model weights
COPY . .

# Ensure temp directory exists and has write permissions
RUN mkdir -p /app/temp && chmod 777 /app/temp

EXPOSE 8000

# Start FastAPI server on dynamic PORT provided by host (Render/Koyeb/HF/Railway)
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]
