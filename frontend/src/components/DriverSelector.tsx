import { useEffect, useState } from 'react';
import type { DriverInfo } from '../types/telemetry';
import { fetchDrivers } from '../api';

interface Props {
  sessionKey: number;
  onDriverSelected: (driverNumber: number) => void;
}

export function DriverSelector({ sessionKey, onDriverSelected }: Props) {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);

  useEffect(() => {
    if (!sessionKey) return;
    fetchDrivers(sessionKey).then(setDrivers).catch(console.error);
  }, [sessionKey]);

  return (
    <label style={{ marginLeft: 12 }}>
      Пилот:{' '}
      <select
        disabled={drivers.length === 0}
        onChange={(e) => onDriverSelected(Number(e.target.value))}
      >
        <option value="">-- выберите пилота --</option>
        {drivers.map((d) => (
          <option key={d.driver_number} value={d.driver_number}>
            #{d.driver_number} {d.name_acronym} ({d.team_name})
          </option>
        ))}
      </select>
    </label>
  );
}