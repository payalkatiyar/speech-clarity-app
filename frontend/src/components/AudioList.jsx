import { Play, Pause, Trash2, Activity } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function AudioList({ records, activeRecord, onSelectRecord, onDeleteRecord, loading }) {
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (playingId && records.length) {
      const record = records.find(r => r.id === playingId);
      if (record && audioRef.current) {
        audioRef.current.src = record.audio_url;
        audioRef.current.load(); // Ensure the new source is loaded
        audioRef.current.play().catch(e => console.error(e));
      }
    } else if (!playingId && audioRef.current) {
      audioRef.current.pause();
    }
  }, [playingId]);

  const togglePlay = (id) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      onSelectRecord(records.find(r => r.id === id));
    }
  };

  if (loading) {
    return (
      <div className="card h-full flex justify-center items-center">
        <div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="card h-full" style={{ maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      <div className="flex justify-between items-center mb-6">
        <h3 style={{ margin: 0 }}>Assessed History</h3>
        <span className="text-muted" style={{ fontWeight: 600, fontSize: '0.75rem' }}>{records.length} TOTAL</span>
      </div>
      
      {records.length === 0 ? (
        <div className="flex-col items-center justify-center p-8 text-center" style={{ flex: 1 }}>
          <div style={{ background: 'var(--primary-light)', padding: '20px', borderRadius: '50%', marginBottom: '1rem' }}>
            <Activity size={32} color="var(--primary)" />
          </div>
          <p className="text-muted">No assessments found.<br/>Start your first recording to begin tracking.</p>
        </div>
      ) : (
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.4rem' }}>
          <audio 
            ref={audioRef} 
            onEnded={() => setPlayingId(null)} 
            style={{ display: 'none' }} 
          />
          
          {[...records].reverse().map((record) => {
            const isPlaying = playingId === record.id;
            const isActive = activeRecord?.id === record.id;
            
            return (
              <div 
                key={record.id} 
                className={`audio-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectRecord(record)}
                style={{ cursor: 'pointer', padding: '1.25rem' }}
              >
                <div className="flex items-center gap-4">
                  <button 
                    className="btn-icon-only" 
                    style={{ 
                      background: isPlaying ? 'var(--primary)' : 'white',
                      color: isPlaying ? 'white' : 'var(--primary)',
                      border: isPlaying ? 'none' : '1px solid var(--border)',
                      boxShadow: isPlaying ? '0 4px 12px rgba(11, 61, 59, 0.2)' : 'none'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay(record.id);
                    }}
                  >
                    {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="currentColor" />}
                  </button>
                  
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      Audio {records.findIndex(r => r.id === record.id) + 1}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {new Date(record.created_at).toLocaleString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="score-badge">
                    {(record.clarity_score * 100).toFixed(0)}%
                  </div>
                  <button 
                    className="btn-icon-only"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(record);
                    }}
                    title="Delete Record"
                    style={{ 
                      width: '32px', 
                      height: '32px',
                      background: 'rgba(200, 122, 122, 0.1)', 
                      color: 'var(--error)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
