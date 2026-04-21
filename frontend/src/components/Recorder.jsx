import { useState, useRef } from 'react';
import { Mic, Square, UploadCloud, Activity, Trash2 } from 'lucide-react';
import { predictClarity, uploadAudio, saveRecord } from '../api';

function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(offset, data, true);
    offset += 2;
  }

  function setUint32(data) {
    view.setUint32(offset, data, true);
    offset += 4;
  }

  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"
  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit
  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArray], { type: "audio/wav" });
}

const PHRASES = [
  "The quick brown fox jumps over the lazy dog.",
  "Bright sunlight glimmers on the calm ocean waves.",
  "A gentle breeze rustled the leaves in the quiet forest.",
  "Early birds catch the worms in the lush green garden.",
  "Mountains reach high toward the crystal blue sky.",
  "Raindrops pitter-patter gently on the window pane.",
  "Stars twinkle brightly in the deep velvet night.",
  "Freshly baked bread smells wonderful in the morning.",
  "Children laugh and play in the sunny neighborhood park.",
  "Science explores the mysteries of the vast universe."
];

export default function Recorder({ session, onNewRecord, recordCount }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activePhrase, setActivePhrase] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current);
        audioChunksRef.current = [];
        try {
          const arrayBuffer = await rawBlob.arrayBuffer();
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(audioBuffer);
          setAudioBlob(wavBlob);
        } catch (err) {
          console.error("Error converting to WAV:", err);
          const fallbackBlob = new Blob([rawBlob], { type: 'audio/wav' });
          setAudioBlob(fallbackBlob);
        }
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();

      const randomPhrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      setActivePhrase(randomPhrase);

      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.includes('audio')) {
      setAudioBlob(file);
      setError(null);
    } else {
      setError("Please select a valid audio file (.wav preferred).");
    }
  };

  const analyzeAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await predictClarity(audioBlob);
      const score = result.clarity_score;

      const audioUrl = await uploadAudio(session.user.id, audioBlob, recordCount + 1);
      const savedData = await saveRecord(session.user.id, score, audioUrl);

      if (savedData && savedData.length > 0) {
        onNewRecord(savedData[0]);
      }

      setAudioBlob(null);
    } catch (err) {
      let errMsg = err.message || JSON.stringify(err);
      if (err.response && err.response.data) {
        errMsg = JSON.stringify(err.response.data);
      }
      setError(`Failed to process audio: ${errMsg}`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ margin: 0 }}>Speech Assessment</h3>
      </div>

      <div className="instructions mb-8 p-6">
        <p style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}>Quick Start Guide</p>
        <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          <li>Tap "Start Recording" & read the prompt aloud.</li>
          <li>Ensure your environment is quiet for better accuracy.</li>
          <li>Review and click "Submit Analysis" for processing.</li>
        </ul>
      </div>

      <div className="flex gap-4 mb-8 justify-center">
        {!isRecording ? (
          <button onClick={startRecording} className="flex-1">
            <Mic size={20} /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex-1 rec-pulse"
          >
            <Square size={20} /> Stop Recording
          </button>
        )}

        <div style={{ position: 'relative', flex: 0.8 }}>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{
              position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10
            }}
          />
          <button className="secondary flex-1 w-full" style={{ background: 'white' }}>
            <UploadCloud size={20} /> Upload
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="phrase-box text-center p-8 mb-8">
          <p className="text-muted mb-3" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>Reading Prompt</p>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 }}>"{activePhrase}"</h2>
        </div>
      )}

      {audioBlob && !isRecording && (
        <div className="flex-col gap-6 mt-8 p-6" style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', borderRadius: 'var(--radius-md)' }}>
          <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%' }} />

          <div className="flex gap-4" style={{ width: '100%' }}>
            <button
              onClick={() => { setAudioBlob(null); setError(null); }}
              disabled={isProcessing}
              className="secondary danger flex-1"
              style={{ background: 'white' }}
            >
              <Trash2 size={20} /> Discard
            </button>

            <button
              onClick={analyzeAudio}
              disabled={isProcessing}
              style={{ flex: 2 }}
            >
              {isProcessing ? (
                <><div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'white' }}></div> Processing...</>
              ) : (
                <><Activity size={20} /> Submit Analysis</>
              )}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error-msg mt-4 text-center">{error}</p>}
    </div>
  );
}
