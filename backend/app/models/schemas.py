from pydantic import BaseModel
from typing import List, Optional

class TelemetryPoint(BaseModel):
    date: str
    speed: Optional[float] = None
    rpm: Optional[float] = None
    n_gear: Optional[int] = None
    throttle: Optional[float] = None
    brake: Optional[float] = None

class Anomaly(BaseModel):
    index: int
    date: str
    value: float
    z_score: float

class TelemetryResponse(BaseModel):
    driver_number: int
    session_key: int
    points: List[TelemetryPoint]
    anomalies: List[Anomaly]
    total_points: int
    anomaly_count: int