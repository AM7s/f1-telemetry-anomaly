import { useEffect, useState } from 'react';
import { fetchLapsInfo } from '../api';

interface Props {
  sessionKey: number;
  onLapSelected: (lapNumber: number) => void;
}

export function LapSelector({ sessionKey, onLapSelected }: Props) {
  const [info, setInfo] = useState<{ is_race: boolean; total_laps: number } | null>(null);
  const [selectedLap, setSelectedLap] = useState<number>(1);

  useEffect(() => {
    if (!sessionKey) return;
    fetchLapsInfo(sessionKey).then(setInfo);
  }, [sessionKey]);

  if (!info || !info.is_race) return null; // Показываем только для гонок

  return (
    <div style={{ marginTop: 12, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
      <p>Всего кругов в гонке: <b>{info.total_laps}</b></p>
      <label>
        Выберите круг: 
        <input 
          type="number" 
          min={1} 
          max={info.total_laps} 
          value={selectedLap} 
          onChange={(e) => setSelectedLap(Number(e.target.value))} 
          style={{ width: 60, marginLeft: 8 }}
        />
      </label>
      <button onClick={() => onLapSelected(selectedLap)} style={{ marginLeft: 12 }}>
        Построить график по кругу
      </button>
    </div>
  );
}