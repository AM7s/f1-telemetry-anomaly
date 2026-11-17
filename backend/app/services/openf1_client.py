from openf1_client import OpenF1Client
import requests
from app.config import settings
from typing import List, Dict, Any

class TelemetryFetcher:
    def __init__(self):
        if settings.OPENF1_TOKEN:
            self.client = OpenF1Client(access_token=settings.OPENF1_TOKEN)
        else:
            self.client = OpenF1Client()
    
    def fetch_car_data(
        self,
        session_key: int,
        driver_number: int,
        date_gt: str | None = None,
        date_lt: str | None = None,
        limit: int | None = None,
    ) -> List[Dict[str, Any]]:
        url = "https://api.openf1.org/v1/car_data"
        params = {
            "session_key": session_key,
            "driver_number": driver_number,
        }
        if date_gt:
            params["date>"] = date_gt
        if date_lt:
            params["date<"] = date_lt
            
        resp = requests.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        
        if limit:
            data = data[:limit]
            
        # Оставляем только нужные поля для DataFrame
        records = []
        for item in data:
            records.append({
                "date": item.get("date"),
                "speed": item.get("speed"),
                "rpm": item.get("rpm"),
                "n_gear": int(item["n_gear"]) if item.get("n_gear") is not None else None,
                "throttle": item.get("throttle"),
                "brake": item.get("brake"),
            })
            
        return records
    
    def close(self):
        self.client.close()