import type { TelemetryResponse, SessionInfo, DriverInfo, SessionDetail } from './types/telemetry';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchSessions(year: number): Promise<SessionInfo[]> {
  const res = await fetch(`${API_BASE}/sessions?year=${year}`);
  if (!res.ok) throw new Error('Не удалось загрузить список сессий');
  return res.json();
}

export async function fetchDrivers(sessionKey: number): Promise<DriverInfo[]> {
  const res = await fetch(`${API_BASE}/drivers?session_key=${sessionKey}`);
  if (!res.ok) throw new Error('Не удалось загрузить пилотов');
  return res.json();
}

export async function fetchSessionInfo(sessionKey: number): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/session_info?session_key=${sessionKey}`);
  if (!res.ok) throw new Error('Не удалось загрузить инфо о сессии');
  return res.json();
}

export async function fetchTelemetry(
  sessionKey: number,
  driverNumber: number,
  startMin?: number,
  endMin?: number,
  limit = 1000
): Promise<TelemetryResponse> {
  const params = new URLSearchParams({
    session_key: sessionKey.toString(),
    driver_number: driverNumber.toString(),
    limit: limit.toString(),
  });
  if (startMin !== undefined) params.append('start_min', startMin.toString());
  if (endMin !== undefined) params.append('end_min', endMin.toString());

  const res = await fetch(`${API_BASE}/telemetry?${params.toString()}`);
  if (!res.ok) throw new Error('Не удалось загрузить телеметрию');
  return res.json();
}

export async function fetchLapsInfo(sessionKey: number): Promise<{ is_race: boolean; total_laps: number }> {
  const res = await fetch(`${API_BASE}/session_laps_info?session_key=${sessionKey}`);
  if (!res.ok) throw new Error('Не удалось загрузить инфо о кругах');
  return res.json();
}

export async function fetchTelemetryByLap(
  sessionKey: number,
  driverNumber: number,
  lapNumber: number
): Promise<TelemetryResponse> {
  const res = await fetch(`${API_BASE}/telemetry?session_key=${sessionKey}&driver_number=${driverNumber}&lap_number=${lapNumber}&limit=1000`);
  if (!res.ok) throw new Error('Не удалось загрузить телеметрию за круг');
  return res.json();
}

// ==========================================
// СРАВНЕНИЕ ПО КРУГУ (С АНОМАЛИЯМИ)
// ==========================================

export interface AnomalyData {
  index: number;
  date: string;
  value: number;
  z_score: number;
}

export interface CompareDataPoint {
  time_sec: number;
  speed: number | null;
}

export interface DriverCompareData {
  points: CompareDataPoint[];
  anomalies: AnomalyData[]; // <-- Добавили аномалии сюда
}

export interface CompareResponse {
  session_key: number;
  lap_number: number;
  total_laps: number;
  data: Record<string, DriverCompareData>; // <-- Теперь это объект, а не массив
}

export async function fetchCompareTelemetry(
  sessionKey: number,
  driverNumbers: number[],
  lapNumber: number
): Promise<CompareResponse> {
  const params = new URLSearchParams();
  params.append('session_key', sessionKey.toString());
  params.append('lap_number', lapNumber.toString());
  driverNumbers.forEach(num => params.append('driver_numbers', num.toString()));

  const res = await fetch(`${API_BASE}/telemetry/compare?${params.toString()}`);
  if (!res.ok) throw new Error('Не удалось загрузить данные для сравнения');
  return res.json();
}

// ==========================================
// СРАВНЕНИЕ ПО ВРЕМЕНИ
// ==========================================

export interface TimeComparePoint {
  sample_index: number;
  speed: number | null;
}

export interface TimeCompareResponse {
  session_key: number;
  data: Record<string, TimeComparePoint[]>;
}

export async function fetchTimeCompareTelemetry(
  sessionKey: number,
  driverNumbers: number[],
  startMin?: number,
  endMin?: number
): Promise<TimeCompareResponse> {
  const params = new URLSearchParams();
  params.append('session_key', sessionKey.toString());
  driverNumbers.forEach(num => params.append('driver_numbers', num.toString()));
  
  if (startMin !== undefined) params.append('start_min', startMin.toString());
  if (endMin !== undefined) params.append('end_min', endMin.toString());

  const res = await fetch(`${API_BASE}/telemetry/time/compare?${params.toString()}`);
  if (!res.ok) throw new Error('Не удалось загрузить сравнение по времени');
  return res.json();
}

// ==========================================
// ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ
// ==========================================

export async function fetchSessionResults(sessionKey: number) {
  const res = await fetch(`${API_BASE}/session_results?session_key=${sessionKey}`);
  return res.json();
}
export async function fetchFastestLap(sessionKey: number) {
  const res = await fetch(`${API_BASE}/fastest_lap?session_key=${sessionKey}`);
  return res.json();
}
export async function fetchTeamRadio(sessionKey: number) {
  const res = await fetch(`${API_BASE}/team_radio?session_key=${sessionKey}`);
  return res.json();
}
export async function fetchStints(sessionKey: number) {
  const res = await fetch(`${API_BASE}/stints?session_key=${sessionKey}`);
  return res.json();
}
export async function fetchWeather(sessionKey: number) {
  const res = await fetch(`${API_BASE}/weather?session_key=${sessionKey}`);
  return res.json();
}
export async function fetchChampionship(meetingKey: number) {
  const res = await fetch(`${API_BASE}/championship?meeting_key=${meetingKey}`);
  return res.json();
}
export async function fetchChampionshipTeams(meetingKey: number) {
  const res = await fetch(`${API_BASE}/championship_teams?meeting_key=${meetingKey}`);
  return res.json();
}