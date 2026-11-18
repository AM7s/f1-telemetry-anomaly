import { useEffect, useState } from 'react';
import type { DriverInfo } from '../types/telemetry';
import { fetchDrivers } from '../api';

interface Props {
  sessionKey: number;
  selectedDrivers: number[];
  onChange: (drivers: number[]) => void;
}

// Примерные цвета команд
const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#FF87BC',
  'Williams': '#64C4FF',
  'RB': '#6692FF',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD',
};

export function MultiDriverSelector({ sessionKey, selectedDrivers, onChange }: Props) {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);

  useEffect(() => {
    if (!sessionKey) return;
    fetchDrivers(sessionKey).then(setDrivers).catch(console.error);
  }, [sessionKey]);

  const toggleDriver = (num: number) => {
    if (selectedDrivers.includes(num)) {
      onChange(selectedDrivers.filter(d => d !== num));
    } else {
      onChange([...selectedDrivers, num]);
    }
  };

  return (
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
        Выберите пилотов ({selectedDrivers.length} из {drivers.length})
      </div>
      <div className="driver-tag-container">
        {drivers.map((d) => {
          const isSelected = selectedDrivers.includes(d.driver_number);
          const teamColor = TEAM_COLORS[d.team_name] || '#888';
          
          return (
            <label key={d.driver_number} className={`driver-tag ${isSelected ? 'active' : ''}`}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleDriver(d.driver_number)}
              />
              <div className="team-color-bar" style={{ backgroundColor: teamColor }} />
              {d.name_acronym}
            </label>
          );
        })}
      </div>
    </div>
  );
}