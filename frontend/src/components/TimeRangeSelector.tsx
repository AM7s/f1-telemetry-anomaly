import { useEffect, useState } from 'react';
import { fetchSessionInfo } from '../api';
import type { SessionDetail } from '../types/telemetry';

interface Props {
  sessionKey: number;
  onRangeChange: (startMin: number, endMin: number) => void;
}

export function TimeRangeSelector({ sessionKey, onRangeChange }: Props) {
  const [info, setInfo] = useState<SessionDetail | null>(null);
  const [startMin, setStartMin] = useState<number>(0);
  const [endMin, setEndMin] = useState<number>(30);

  useEffect(() => {
    if (!sessionKey) return;
    fetchSessionInfo(sessionKey).then((data) => {
      setInfo(data);
      const start = new Date(data.date_start).getTime();
      const end = new Date(data.date_end).getTime();
      const durationMin = Math.round((end - start) / 60000);
      setEndMin(durationMin > 0 ? durationMin : 60);
    });
  }, [sessionKey]);

  if (!info) return null;

  const start = new Date(info.date_start).getTime();
  const end = new Date(info.date_end).getTime();
  const duration = Math.round((end - start) / 60000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Длительность сессии: <b style={{ color: 'var(--text-main)' }}>{duration} мин</b>
      </div>
      
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            С минуты
          </label>
          <input 
            type="number" 
            value={startMin} 
            onChange={(e) => setStartMin(Number(e.target.value))} 
            min={0} 
            max={duration} 
            className="f1-input"
            style={{ width: '100%', padding: '10px 12px', fontSize: '1rem' }}
          />
        </div>
        
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            По минуту
          </label>
          <input 
            type="number" 
            value={endMin} 
            onChange={(e) => setEndMin(Number(e.target.value))} 
            min={0} 
            max={duration} 
            className="f1-input"
            style={{ width: '100%', padding: '10px 12px', fontSize: '1rem' }}
          />
        </div>
      </div>

      <button 
        onClick={() => onRangeChange(startMin, endMin)} 
        className="f1-button"
        style={{ padding: '10px 24px', borderRadius: 8, width: '100%', marginTop: 4 }}
      >
        Построить график
      </button>
    </div>
  );
}