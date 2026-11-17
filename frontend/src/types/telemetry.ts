export interface TelemetryPoint {
  date: string;
  speed: number | null;
  rpm: number | null;
  n_gear: number | null;
  throttle: number | null;
  brake: number | null;
}

export interface Anomaly {
  index: number;
  date: string;
  value: number;
  z_score: number;
}

export interface TelemetryResponse {
  driver_number: number;
  session_key: number;
  points: TelemetryPoint[];
  anomalies: Anomaly[];
  total_points: number;
  anomaly_count: number;
}

export interface SessionInfo {
  session_key: number;
  session_name: string;
  country_name: string;
  year: number;
  date_start: string;
  meeting_key: number;
}

export interface DriverInfo {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
}

export interface SessionDetail {
  session_key: number;
  date_start: string;
  date_end: string;
  session_name: string;
}