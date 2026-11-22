import { useEffect, useState } from 'react';
import type { SessionInfo } from '../types/telemetry';
import { fetchSessions } from '../api';

interface Props {
  onSessionSelected: (sessionKey: number, meetingKey: number, sessionName: string) => void;
  onlyRaces?: boolean;
}

const YEARS = [2023, 2024, 2025, 2026];

// ИСПОЛЬЗУЕМ РЕАЛЬНЫЕ ЭМОДЗИ-ФЛАГИ
const COUNTRY_FLAGS: Record<string, string> = {
  'Bahrain': '🇧🇭',
  'Saudi Arabia': '🇸🇦',
  'Australia': '🇦🇺',
  'Azerbaijan': '🇦🇿',
  'United States': '🇺🇸',
  'Italy': '🇮🇹',
  'Monaco': '🇲🇨',
  'Spain': '🇪🇸',
  'Canada': '🇨🇦',
  'Austria': '🇦🇹',
  'United Kingdom': '🇬🇧',
  'Hungary': '🇭🇺',
  'Belgium': '🇧🇪',
  'Netherlands': '🇳🇱',
  'Singapore': '🇸🇬',
  'Japan': '🇯🇵',
  'Qatar': '🇶🇦',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'China': '🇨🇳',
};

export function SessionSelector({ onSessionSelected, onlyRaces = false }: Props) {
  const [year, setYear] = useState(2026);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMeetingKey, setSelectedMeetingKey] = useState<number | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetchSessions(year)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  const uniqueEvents = Array.from(
    new Map(sessions.map(s => [s.meeting_key, s])).values()
  ).sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

  const eventSessions = sessions.filter(s => s.meeting_key === selectedMeetingKey);

  const handleEventClick = (meetingKey: number) => {
    setSelectedMeetingKey(meetingKey);
    setSelectedSessionType(''); 
  };

  const handleSessionTypeClick = (session: SessionInfo) => {
    setSelectedSessionType(session.session_name);
    onSessionSelected(session.session_key, session.meeting_key || 0, session.session_name);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <select 
          value={year} 
          onChange={(e) => setYear(Number(e.target.value))}
          className="f1-select"
          style={{ maxWidth: 120 }}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {loading && <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>Загрузка...</span>}
      </div>

      <div className="event-grid">
        {uniqueEvents.map(event => {
          // Пытаемся получить локацию. Если ее нет, берем название сессии и обрезаем.
          let locationText = event.location || '';
          
          if (!locationText && event.session_name) {
            // Например: "Miami Grand Prix" -> "Miami"
            locationText = event.session_name.split(' ')[0];
          }

          // Форматируем название
          const displayName = event.country_name === 'United States' 
            ? `${event.country_name} (${locationText})` 
            : event.country_name;
            
          // Берем эмодзи-флаг
          const flag = COUNTRY_FLAGS[event.country_name] || '🏁';

          return (
            <div 
              key={event.meeting_key}
              className={`event-card ${selectedMeetingKey === event.meeting_key ? 'active' : ''}`}
              onClick={() => handleEventClick(event.meeting_key)}
            >
              <div className="event-date">
                {new Date(event.date_start).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
              </div>
              <div className="event-name">
                <span style={{ marginRight: 8 }}>{flag}</span>
                {displayName}
              </div>
            </div>
          );
        })}
      </div>

      {selectedMeetingKey && (
        <div className="session-tabs">
          {eventSessions
            .filter(s => !onlyRaces || s.session_name.includes('Race') || s.session_name.includes('Sprint'))
            .map(session => (
              <button
                key={session.session_key}
                className={`session-tab ${selectedSessionType === session.session_name ? 'active' : ''}`}
                onClick={() => handleSessionTypeClick(session)}
              >
                {session.session_name.replace('Practice', 'FP').replace('Qualifying', 'QUALY').replace('Race', 'ГОНКА').replace('Sprint', 'СПРИНТ').toUpperCase()}
              </button>
          ))}
        </div>
      )}
    </div>
  );
}