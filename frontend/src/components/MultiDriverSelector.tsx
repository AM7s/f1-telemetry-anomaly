import { useEffect, useState } from 'react';
import type { DriverInfo } from '../types/telemetry';
import { fetchDrivers } from '../api';

interface Props {
  sessionKey: number;
  selectedDrivers: number[];
  onChange: (drivers: number[]) => void;
}

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
    <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #ccc', padding: 8 }}>
      <p style={{ margin: '0 0 8px 0', fontSize: '0.9em' }}>Выберите пилотов (от 1 до 22):</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {drivers.map((d) => (
          <label key={d.driver_number} style={{ fontSize: '0.85em', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedDrivers.includes(d.driver_number)}
              onChange={() => toggleDriver(d.driver_number)}
            />
            {' '}#{d.driver_number} {d.name_acronym}
          </label>
        ))}
      </div>
    </div>
  );
}