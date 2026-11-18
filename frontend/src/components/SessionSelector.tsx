import { useEffect, useState } from 'react';
import type { SessionInfo } from '../types/telemetry';
import { fetchSessions } from '../api';

interface Props {
  onSessionSelected: (sessionKey: number, meetingKey: number, sessionName: string) => void;
  onlyRaces?: boolean;
}

const YEARS = [2023, 2024, 2025, 2026];

export function SessionSelector({ onSessionSelected, onlyRaces = false }: Props) {
  const [year, setYear] = useState(2026);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetchSessions(year)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  // Группируем по названию Гран-При
  const events = Array.from(new Set(sessions.map(s => s.country_name)));
  const eventSessions = sessions.filter(s => s.country_name === selectedEvent);

  const handleEventClick = (eventName: string) => {
    setSelectedEvent(eventName);
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

      {/* Сетка этапов */}
      <div className="event-grid">
        {events.map(eventName => {
          const eventInfo = sessions.find(s => s.country_name === eventName);
          return (
            <div 
              key={eventName}
              className={`event-card ${selectedEvent === eventName ? 'active' : ''}`}
              onClick={() => handleEventClick(eventName)}
            >
              <div className="event-date">
                {eventInfo ? new Date(eventInfo.date_start).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : ''}
              </div>
              <div className="event-name">{eventName}</div>
            </div>
          );
        })}
      </div>

      {/* Кнопки сессий */}
      {selectedEvent && (
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