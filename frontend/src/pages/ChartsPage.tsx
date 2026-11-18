import { useState } from 'react';
import { SessionSelector } from '../components/SessionSelector';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { MultiDriverSelector } from '../components/MultiDriverSelector';
import { CompareChart } from '../components/CompareChart';
import { TimeCompareChart } from '../components/TimeCompareChart';
import { fetchCompareTelemetry, fetchTimeCompareTelemetry } from '../api';
import type { CompareResponse, TimeCompareResponse } from '../api';

export function ChartsPage() {
  // ===== Стейт для анализа по времени =====
  const [timeSessionKey, setTimeSessionKey] = useState<number>(0);
  const [timeSelectedDrivers, setTimeSelectedDrivers] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState({ start: 0, end: 30 });
  const [timeCompareData, setTimeCompareData] = useState<TimeCompareResponse | null>(null);

  // ===== Стейт для анализа по кругу =====
  const [compareSessionKey, setCompareSessionKey] = useState<number>(0);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [compareLap, setCompareLap] = useState<number>(1);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);

  // ===== Стейт для переключателя аномалий =====
  const [showAnomalies, setShowAnomalies] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);

  // ===== Обработчики =====
  const handleTimeCompare = async (startMin: number, endMin: number) => {
    if (!timeSessionKey || timeSelectedDrivers.length === 0) {
      alert('Выберите хотя бы одного пилота!');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTimeCompareTelemetry(timeSessionKey, timeSelectedDrivers, startMin, endMin);
      setTimeCompareData(data);
      setTimeRange({ start: startMin, end: endMin });
    } catch (e) {
      console.error(e);
      alert('Ошибка при загрузке данных сравнения по времени');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareSessionKey || selectedDrivers.length === 0) {
      alert('Выберите хотя бы одного пилота!');
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCompareTelemetry(compareSessionKey, selectedDrivers, compareLap);
      setCompareData(data);
    } catch (e) {
      console.error(e);
      alert('Ошибка при загрузке данных сравнения по кругу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* ================= СЕКЦИЯ 1: Сравнение по времени ================= */}
      <div className="f1-card" style={{ padding: 20 }}>
        <h2 className="f1-header-text" style={{ fontSize: '1rem', marginBottom: 16 }}>Анализ по времени</h2>
        
        {/* Сетка выбора этапа и сессии */}
        <SessionSelector
          onSessionSelected={(key) => {
            setTimeSessionKey(key);
            setTimeCompareData(null);
          }}
        />
        
        {timeSessionKey > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
            {/* Выбор пилотов в виде тегов */}
            <MultiDriverSelector
              sessionKey={timeSessionKey}
              selectedDrivers={timeSelectedDrivers}
              onChange={setTimeSelectedDrivers}
            />
            
            {/* Выбор временного отрезка */}
            <div style={{ marginTop: 16 }}>
              <TimeRangeSelector
                sessionKey={timeSessionKey}
                onRangeChange={handleTimeCompare}
              />
            </div>
          </div>
        )}
      </div>

      {/* График по времени */}
      {timeCompareData && (
        <div className="f1-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ padding: '16px 20px', background: 'var(--bg-card-header)', borderBottom: '1px solid var(--border-color)' }}>
             <h2 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                TELEMETRY TIME COMPARISON <span style={{ color: 'var(--accent-red)' }}>[{timeRange.start} - {timeRange.end} MIN]</span>
             </h2>
          </div>
          <div style={{ padding: 16 }}>
            <TimeCompareChart data={timeCompareData} />
          </div>
        </div>
      )}


      {/* ================= СЕКЦИЯ 2: Сравнение на круге ================= */}
      <div className="f1-card" style={{ padding: 20 }}>
        <h2 className="f1-header-text" style={{ fontSize: '1rem', marginBottom: 16 }}>Анализ на круге</h2>
        
        <SessionSelector
          onlyRaces={true}
          onSessionSelected={(key) => {
            setCompareSessionKey(key);
            setCompareData(null);
          }}
        />
        
        {compareSessionKey > 0 && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
            <MultiDriverSelector
              sessionKey={compareSessionKey}
              selectedDrivers={selectedDrivers}
              onChange={setSelectedDrivers}
            />
            
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 100px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Номер круга
                </label>
                <input
                  type="number"
                  value={compareLap}
                  onChange={e => setCompareLap(Number(e.target.value))}
                  min={1}
                  className="f1-input"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '1rem' }}
                />
              </div>
              
              <button 
                onClick={handleCompare} 
                className="f1-button"
                style={{ padding: '10px 24px', borderRadius: 8, flex: '1 1 100%' }}
              >
                Построить график
              </button>
            </div>
          </div>
        )}
      </div>

      {/* График по кругу */}
      {compareData && (
        <div className="f1-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
          <div style={{ 
            padding: '16px 20px', 
            background: 'var(--bg-card-header)', 
            borderBottom: '1px solid var(--border-color)', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
             <h2 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                LAP TELEMETRY <span style={{ color: 'var(--accent-red)' }}>[LAP {compareLap}]</span>
             </h2>
             
             <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', userSelect: 'none' }}>
               <input 
                 type="checkbox" 
                 checked={showAnomalies} 
                 onChange={(e) => setShowAnomalies(e.target.checked)} 
                 style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-red)' }}
               />
               Показать аномалии
             </label>
          </div>
          <div style={{ padding: 16 }}>
            <CompareChart data={compareData} showAnomalies={showAnomalies} />
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--accent-red)', fontWeight: 'bold', marginTop: 20, letterSpacing: '1px' }}>
          ЗАГРУЗКА ДАННЫХ...
        </div>
      )}
    </div>
  );
}