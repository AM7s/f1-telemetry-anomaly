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
      // Рассчитываем длительность в минутах
      const start = new Date(data.date_start).getTime();
      const end = new Date(data.date_end).getTime();
      const durationMin = Math.round((end - start) / 60000);
      setEndMin(durationMin > 0 ? durationMin : 60);
      setStartMin(0);
    });
  }, [sessionKey]);

  if (!info) return null;

  const start = new Date(info.date_start).getTime();
  const end = new Date(info.date_end).getTime();
  const duration = Math.round((end - start) / 60000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
      <div style={{ fontSize: '0.9em', color: '#555' }}>
        Длительность сессии: <b>{duration} мин</b>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label>
          С минуты:{' '}
          <input
            type="number"
            value={startMin}
            onChange={(e) => setStartMin(Number(e.target.value))}
            min={0}
            max={duration}
            style={{ width: 60 }}
          />
        </label>
        <label>
          По минуту:{' '}
          <input
            type="number"
            value={endMin}
            onChange={(e) => setEndMin(Number(e.target.value))}
            min={0}
            max={duration}
            style={{ width: 60 }}
          />
        </label>
        <button onClick={() => onRangeChange(startMin, endMin)}>
          Построить график
        </button>
      </div>
    </div>
  );
}