import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function Chart({ records, activeRecord }) {
  if (records.length === 0) {
    return (
      <div className="card flex justify-center items-center" style={{ minHeight: '300px' }}>
        <p className="text-muted">No clarity data yet. Record speech to see your progress.</p>
      </div>
    );
  }

  const chartData = records.map((r, index) => ({
    name: `Audio ${index + 1}`,
    score: Number((r.clarity_score * 100).toFixed(1)), // percentage
    date: new Date(r.created_at).toLocaleDateString(),
    id: r.id
  }));

  const activeIndex = activeRecord ? chartData.findIndex(d => d.id === activeRecord.id) : -1;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card" style={{ padding: '1rem', border: '1px solid var(--border)', minWidth: '160px', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
          <p style={{ fontWeight: 800, margin: 0, color: 'var(--primary)', fontSize: '1rem' }}>{label}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            {payload[0].payload.date}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
            <p style={{ color: 'var(--text-main)', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
              {payload[0].value}% Clarity
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-8">
        <h3 style={{ margin: 0 }}>Analytics</h3>
        <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>CLARITY SCORE (%)</span>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            onClick={(e) => {
              // Optional: To make graph points clickable to select record, but we only have ID in payload
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <YAxis 
              domain={[0, 100]} 
              stroke="var(--text-muted)" 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="var(--primary)" 
              strokeWidth={3}
              activeDot={{ r: 8, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
              dot={{ r: 4, fill: 'var(--primary)' }}
            />
            {activeIndex !== -1 && (
              <ReferenceDot 
                x={chartData[activeIndex].name} 
                y={chartData[activeIndex].score} 
                r={8} 
                fill="var(--success)" 
                stroke="white" 
                strokeWidth={2} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
