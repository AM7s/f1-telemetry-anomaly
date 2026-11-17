import { useEffect, useState } from 'react';
import type { SessionInfo } from '../types/telemetry';
import { fetchSessions } from '../api';

interface Props {
  onSessionSelected: (sessionKey: number, meetingKey: number, sessionName: string) => void;
  onlyRaces?: boolean; // Если true, показывает только гонки и спринты
}

const YEARS = [2023, 2024, 2025];

export function SessionSelector({ onSessionSelected, onlyRaces = false }: Props) {
  const [year, setYear] = useState(2023);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchSessions(year)
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year]);

  // Фильтрация, если нужны только гонки/спринты
  const filteredSessions = onlyRaces
    ? sessions.filter(s => s.session_name.includes('Race') || s.session_name.includes('Sprint'))
    : sessions;

  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label>
        Год:{' '}
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>

      <label>
        Сессия (Этап + Тип):{' '}
        <select
          disabled={loading || sortedSessions.length === 0}
          onChange={(e) => {
            const selectedKey = Number(e.target.value);
            const selectedSession = sortedSessions.find(s => s.session_key === selectedKey);
            
            if (selectedSession) {
              onSessionSelected(
                selectedSession.session_key, 
                selectedSession.meeting_key || 0, 
                selectedSession.session_name
              );
            }
          }}
        >
          <option value="">-- выберите сессию --</option>
          {sortedSessions.map((s) => (
            <option key={s.session_key} value={s.session_key}>
              {s.country_name} — {s.session_name} ({new Date(s.date_start).toLocaleDateString()})
            </option>
          ))}
        </select>
      </label>

      {loading && <span>Загрузка...</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
}