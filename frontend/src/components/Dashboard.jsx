import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { deleteRecord } from '../api';
import Recorder from './Recorder';
import Chart from './Chart';
import AudioList from './AudioList';
import { LogOut, Activity } from 'lucide-react';

export default function Dashboard({ session }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRecord, setActiveRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, [session.user.id]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('speech_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecord = (record) => {
    setRecords([...records, record]);
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteRecord(record.id, record.audio_url);
      setRecords(records.filter(r => r.id !== record.id));
      if (activeRecord?.id === record.id) {
        setActiveRecord(null);
      }
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  return (
    <div className="container">
      <header className="dashboard-header">
        <div className="logo-container">
          <div className="card" style={{ padding: '8px', borderRadius: '12px', background: 'var(--primary)', display: 'flex' }}>
            <Activity size={24} color="white" />
          </div>
          <h2>Speech Clarity Analyser</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-2">
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Patient Dashboard</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{session.user.email}</span>
          </div>
          <button 
            className="secondary btn-icon-only" 
            onClick={() => supabase.auth.signOut()}
            title="Sign Out"
            style={{ border: 'none', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LogOut size={20} color="var(--primary)" />
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="flex-col gap-6" style={{ display: 'flex' }}>
          <Recorder 
            session={session} 
            onNewRecord={handleNewRecord} 
            recordCount={records.length} 
          />
          <Chart records={records} activeRecord={activeRecord} />
        </div>
        
        <div>
          <AudioList 
            records={records} 
            activeRecord={activeRecord} 
            onSelectRecord={setActiveRecord} 
            onDeleteRecord={handleDeleteRecord}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
