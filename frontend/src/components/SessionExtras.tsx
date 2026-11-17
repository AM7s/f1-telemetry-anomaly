import { useEffect, useState } from 'react';
import {
  fetchSessionResults, fetchFastestLap,
  fetchStints, fetchWeather, fetchChampionship, fetchChampionshipTeams
} from '../api';

interface Props {
  sessionKey: number;
  sessionName: string;
  meetingKey: number;
}

const formatTime = (seconds: number | null | undefined) => {
  if (!seconds) return 'N/A';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export function SessionExtras({ sessionKey, sessionName, meetingKey }: Props) {
  const [results, setResults] = useState<any[]>([]);
  const [fastestLap, setFastestLap] = useState<any>(null);
  const [stints, setStints] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [teamStandings, setTeamStandings] = useState<any[]>([]);

  const isRaceOrSprint = sessionName.includes('Race') || sessionName.includes('Sprint');

  useEffect(() => {
    if (!sessionKey) return;
    
    Promise.all([
      fetchSessionResults(sessionKey).then(setResults).catch(console.error),
      fetchFastestLap(sessionKey).then(setFastestLap).catch(console.error),
      fetchStints(sessionKey).then(setStints).catch(console.error),
      fetchWeather(sessionKey).then(setWeather).catch(console.error),
    ]);

    if (meetingKey && isRaceOrSprint) {
      fetchChampionship(meetingKey).then(setStandings).catch(console.error);
      fetchChampionshipTeams(meetingKey).then(setTeamStandings).catch(console.error);
    }
  }, [sessionKey, meetingKey, isRaceOrSprint]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      
      {/* Погода */}
      {weather && !weather.error && (
        <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 8, borderLeft: '4px solid #00d2be', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, color: '#00d2be', textTransform: 'uppercase', fontSize: '1rem' }}>🌤️ Погода</h3>
          <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            Воздух: <b>{weather.air_temperature}°C</b> | Трасса: <b>{weather.track_temperature}°C</b> | Влажность: <b>{weather.humidity}%</b>
          </p>
        </div>
      )}

      {/* Быстрейший круг */}
      {fastestLap && !fastestLap.error && (
        <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 8, borderLeft: '4px solid #8b5cf6', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, color: '#8b5cf6', textTransform: 'uppercase', fontSize: '1rem' }}>⚡ Быстрейший круг</h3>
          <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            Пилот <b>#{fastestLap.driver_number}</b> | Круг <b>{fastestLap.lap_number}</b> | Время: <b>{formatTime(fastestLap.lap_duration)}</b>
          </p>
        </div>
      )}

      {/* Подиум */}
      {isRaceOrSprint && results.length >= 3 && (
        <div style={{ 
          padding: 20, 
          background: 'var(--bg-card)', // <-- ИСПРАВЛЕНО: теперь цвет берется из переменной
          borderRadius: 8, 
          border: '1px solid var(--border-color)' 
        }}>
          <h3 style={{ marginTop: 0, textTransform: 'uppercase', textAlign: 'center', color: 'var(--text-main)' }}>🏆 Подиум</h3>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-end', marginTop: 20 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-main)' }}>
              <div style={{ fontSize: '3em' }}>🥈</div>
              <div style={{ fontWeight: 'bold' }}>{results[1]?.driver_name}</div>
            </div>
            <div style={{ textAlign: 'center', transform: 'scale(1.2)', color: 'var(--text-main)' }}>
              <div style={{ fontSize: '4em' }}>🥇</div>
              <div style={{ fontWeight: 'bold', color: '#f1c40f' }}>{results[0]?.driver_name}</div>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-main)' }}>
              <div style={{ fontSize: '3em' }}>🥉</div>
              <div style={{ fontWeight: 'bold' }}>{results[2]?.driver_name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Таблица результатов */}
      {results.length > 0 && (
        <div>
          <h3 className="f1-header-text" style={{ marginTop: 20 }}>🏁 Результаты</h3>
          <table className="f1-table">
            <thead>
              <tr>
                <th>Поз</th>
                <th>№</th>
                <th>Пилот</th>
                {isRaceOrSprint && <th>Круги</th>}
                {isRaceOrSprint && <th>Быстр. круг</th>}
                {isRaceOrSprint ? <th>Очки</th> : <th>Время</th>}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'bold' }}>{r.position || '-'}</td>
                  <td>#{r.driver_number}</td>
                  <td>{r.driver_name}</td>
                  {isRaceOrSprint && <td>{r.total_laps || '-'}</td>}
                  {isRaceOrSprint && <td style={{ color: '#8b5cf6' }}>{formatTime(r.fastest_lap)}</td>}
                  <td style={{ fontWeight: 'bold', color: '#00d2be' }}>
                    {isRaceOrSprint ? r.points : formatTime(r.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Чемпионаты */}
      {(standings.length > 0 || teamStandings.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
          {standings.length > 0 && (
            <div>
              <h3 className="f1-header-text">🏆 Чемпионат пилотов</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {standings.slice(0, 5).map((s, i) => (
                  <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                    <span><b>P{s.position}</b> | #{s.driver_number}</span>
                    <span style={{ color: '#00d2be', fontWeight: 'bold' }}>{s.points} PTS</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {teamStandings.length > 0 && (
            <div>
              <h3 className="f1-header-text">🏆 Кубок конструкторов</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {teamStandings.slice(0, 5).map((s, i) => (
                  <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)' }}>
                    <span><b>P{s.position}</b> | {s.team_name}</span>
                    <span style={{ color: '#00d2be', fontWeight: 'bold' }}>{s.points} PTS</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Стратегии (Шины) */}
      {stints.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 className="f1-header-text">🛞 Стратегии (Шины)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stints.slice(0, 40).map((s, i) => (
              <div key={i} style={{ 
                padding: '6px 12px', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 4, 
                fontSize: '0.85em', 
                display: 'flex', 
                gap: 8,
                color: 'var(--text-main)' 
              }}>
                <span style={{ fontWeight: 'bold' }}>#{s.driver_number}</span>
                <span style={{ 
                  color: s.compound === 'SOFT' ? '#e10600' : s.compound === 'MEDIUM' ? '#f1c40f' : s.compound === 'HARD' ? 'var(--text-main)' : '#00d2be' 
                }}>
                  {s.compound}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{s.lap_start}-{s.lap_end}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}