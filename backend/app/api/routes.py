from fastapi import APIRouter, HTTPException, Query
from app.services.openf1_client import TelemetryFetcher
from app.services.anomaly_detector import detect_anomalies_zscore
from app.models.schemas import TelemetryResponse, TelemetryPoint
from openf1_client import OpenF1Client
from datetime import datetime, timedelta
from typing import List
import pandas as pd
import random
import requests




router = APIRouter()

@router.get("/session_info")
async def get_session_info(session_key: int = Query(...)):
    """Возвращает время старта сессии, чтобы фронт мог рассчитать длительность."""
    client = OpenF1Client()
    try:
        sessions = client.sessions.list(session_key=session_key)
        if not sessions:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        s = sessions[0]
        return {
            "session_key": s.session_key,
            "date_start": s.date_start,
            "date_end": s.date_end,
            "session_name": s.session_name,
        }
    finally:
        client.close()

@router.get("/session_laps_info")
async def get_session_laps_info(session_key: int = Query(...)):
    """Возвращает тип сессии и общее количество кругов (если это гонка/спринт)."""
    client = OpenF1Client()
    try:
        sessions = client.sessions.list(session_key=session_key)
        if not sessions:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        s = sessions[0]
        
        # Проверяем, гонка это или спринт
        is_race = "Race" in s.session_name or "Sprint" in s.session_name
        
        total_laps = 0
        if is_race:
            # Берем круги любого пилота (например, первого в списке)
            drivers = client.drivers.list(session_key=session_key)
            if drivers:
                laps_data = client.laps.list(session_key=session_key, driver_number=drivers[0].driver_number)
                if laps_data:
                    total_laps = max(lap.lap_number for lap in laps_data)
        
        return {
            "is_race": is_race,
            "total_laps": total_laps,
            "session_name": s.session_name
        }
    finally:
        client.close()

@router.get("/telemetry", response_model=TelemetryResponse)
async def get_telemetry(
    session_key: int = Query(..., description="OpenF1 session key"),
    driver_number: int = Query(..., description="Номер пилота"),
    lap_number: int | None = Query(None, description="Номер круга (для гонок/спринтов)"),
    start_min: float | None = Query(None, description="Начало отрезка в минутах от старта сессии"),
    end_min: float | None = Query(None, description="Конец отрезка в минутах от старта сессии"),
    limit: int = Query(1000, ge=50, le=10000, description="Максимум точек"),
    anomaly_column: str = Query("speed", description="Канал для детекции аномалий"),
):
    fetcher = TelemetryFetcher()
    date_gt = None
    date_lt = None

    try:
        # 1. Если выбран конкретный круг, вычисляем его временные рамки
        if lap_number is not None:
            lap_data = fetcher.client.laps.list(
                session_key=session_key,
                driver_number=driver_number,
                lap_number=lap_number
            )
            if not lap_data:
                raise HTTPException(status_code=404, detail=f"Круг {lap_number} не найден для пилота {driver_number}")
            
            lap = lap_data[0]
            
            # Берем время начала круга. Если OpenF1 не отдает date_start, 
            # вычисляем его из времени старта сессии + время прохождения предыдущих кругов.
            # В большинстве случаев OpenF1 отдает date_start для круга.
            if hasattr(lap, "date_start") and lap.date_start:
                lap_start_dt = datetime.fromisoformat(lap.date_start.replace("Z", "+00:00"))
                date_gt = lap_start_dt.isoformat()
                # Ограничиваем круг примерно 2-3 минутами (максимальное время круга), 
                # чтобы не захватить следующий круг, если API не дает точное время окончания.
                date_lt = (lap_start_dt + timedelta(minutes=3)).isoformat()
            else:
                # Если API не отдал date_start, используем ограничение по времени (грубый метод)
                sessions = fetcher.client.sessions.list(session_key=session_key)
                session_start = datetime.fromisoformat(sessions[0].date_start.replace("Z", "+00:00"))
                # Приблизительно: номер круга * 1.5 минуты
                date_gt = (session_start + timedelta(minutes=lap_number * 1.5)).isoformat()
                date_lt = (session_start + timedelta(minutes=(lap_number + 1) * 1.5)).isoformat()

        # 2. Если выбран временной отрезок, вычисляем абсолютное время
        elif start_min is not None or end_min is not None:
            sessions = fetcher.client.sessions.list(session_key=session_key)
            if not sessions:
                raise HTTPException(status_code=404, detail="Сессия не найдена")
                
            session_start_str = sessions[0].date_start.replace("Z", "+00:00")
            session_start = datetime.fromisoformat(session_start_str)
            
            if start_min is not None:
                date_gt = (session_start + timedelta(minutes=start_min)).isoformat()
            if end_min is not None:
                date_lt = (session_start + timedelta(minutes=end_min)).isoformat()

        # 3. Запрашиваем телеметрию с учетом вычисленных рамок времени
        records = fetcher.fetch_car_data(
            session_key=session_key,
            driver_number=driver_number,
            date_gt=date_gt,
            date_lt=date_lt,
            limit=limit,
        )
    finally:
        fetcher.close()
    
    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"Нет данных для session_key={session_key}, driver={driver_number} в указанном интервале/круге."
        )
    
    # 4. Обработка данных
    df = pd.DataFrame(records)
    
    # Сортируем по времени, чтобы график рисовался слева направо
    if "date" in df.columns:
        df = df.sort_values("date").reset_index(drop=True)
    
    # Ищем аномалии
    anomalies = detect_anomalies_zscore(df, column=anomaly_column)
    
    # 5. Собираем точки для ответа
    points = []
    for _, row in df.iterrows():
        points.append(TelemetryPoint(
            date=str(row.get("date", "")),
            speed=row.get("speed") if pd.notna(row.get("speed")) else None,
            rpm=row.get("rpm") if pd.notna(row.get("rpm")) else None,
            n_gear=int(row["n_gear"]) if pd.notna(row.get("n_gear")) else None,
            throttle=row.get("throttle") if pd.notna(row.get("throttle")) else None,
            brake=row.get("brake") if pd.notna(row.get("brake")) else None,
        ))
    
    return TelemetryResponse(
        driver_number=driver_number,
        session_key=session_key,
        points=points,
        anomalies=anomalies,
        total_points=len(points),
        anomaly_count=len(anomalies),
    )

@router.get("/telemetry/compare")
async def compare_telemetry(
    session_key: int = Query(...),
    driver_numbers: List[int] = Query(...),
    lap_number: int = Query(...),
):
    results = {}
    
    try:
        # 1. Узнаем общее количество кругов
        laps_url = f"https://api.openf1.org/v1/laps?session_key={session_key}"
        laps_resp = requests.get(laps_url)
        laps_data = laps_resp.json() if laps_resp.ok else []
        
        total_laps = 0
        if laps_data:
            total_laps = max(l.get("lap_number", 0) for l in laps_data if l.get("lap_number"))
        
        # 2. Получаем телеметрию для каждого пилота
        for driver_num in driver_numbers:
            # Ищем время начала круга
            driver_lap = next((l for l in laps_data if l.get("driver_number") == driver_num and l.get("lap_number") == lap_number), None)
            
            if not driver_lap or not driver_lap.get("date_start"):
                continue 
            
            lap_start = driver_lap.get("date_start")
            lap_start_dt = datetime.fromisoformat(lap_start.replace("Z", "+00:00"))
            lap_end_dt = lap_start_dt + timedelta(minutes=3) # Запас на круг
            
            # Запрашиваем телеметрию
            car_url = f"https://api.openf1.org/v1/car_data?session_key={session_key}&driver_number={driver_num}&date>{lap_start}&date<{lap_end_dt.isoformat()}"
            car_resp = requests.get(car_url)
            car_data = car_resp.json() if car_resp.ok else []
            
            if car_data:
                df = pd.DataFrame(car_data)
                df = df.sort_values("date").reset_index(drop=True)
                
                # Рассчитываем время от начала круга
                start_time = datetime.fromisoformat(df["date"].iloc[0].replace("Z", "+00:00"))
                df['time_sec'] = (pd.to_datetime(df['date']) - start_time).dt.total_seconds()
                
                # Ищем аномалии
                anomalies = detect_anomalies_zscore(df, column="speed")
                
                points = []
                for _, row in df.iterrows():
                    points.append({
                        "time_sec": round(row['time_sec'], 3),
                        "speed": row.get("speed") if pd.notna(row.get("speed")) else None,
                    })
                
                results[driver_num] = {
                    "points": points,
                    "anomalies": [a.model_dump() for a in anomalies] # Pydantic v2
                }
                
        return {
            "session_key": session_key,
            "lap_number": lap_number,
            "total_laps": total_laps,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/telemetry/time/compare")
async def compare_telemetry_time(
    session_key: int = Query(...),
    driver_numbers: List[int] = Query(..., description="Список номеров пилотов"),
    start_min: float | None = Query(None, description="Начало отрезка в минутах"),
    end_min: float | None = Query(None, description="Конец отрезка в минутах"),
    limit: int = Query(2000, ge=50, le=5000),
):
    fetcher = TelemetryFetcher()
    results = {}
    
    try:
        # Вычисляем абсолютное время начала и конца, если заданы минуты
        date_gt = None
        date_lt = None
        if start_min is not None or end_min is not None:
            sessions = fetcher.client.sessions.list(session_key=session_key)
            if sessions:
                session_start = datetime.fromisoformat(sessions[0].date_start.replace("Z", "+00:00"))
                if start_min is not None:
                    date_gt = (session_start + timedelta(minutes=start_min)).isoformat()
                if end_min is not None:
                    date_lt = (session_start + timedelta(minutes=end_min)).isoformat()

        # Запрашиваем данные для каждого пилота
        for driver_num in driver_numbers:
            records = fetcher.fetch_car_data(
                session_key=session_key,
                driver_number=driver_num,
                date_gt=date_gt,
                date_lt=date_lt,
                limit=limit,
            )
            if records:
                points = []
                for i, row in enumerate(records):
                    points.append({
                        "sample_index": i,
                        "speed": row.get("speed") if row.get("speed") is not None else None,
                    })
                results[driver_num] = points
    finally:
        fetcher.close()

    return {
        "session_key": session_key,
        "data": results,
    }

@router.get("/sessions")
async def get_sessions(year: int = Query(...)):
    client = OpenF1Client()
    try:
        sessions = client.sessions.list(year=year)
        return [
            {
                "session_key": s.session_key,
                "session_name": s.session_name,
                "country_name": s.country_name,
                "year": s.year,
                "date_start": s.date_start,
                "meeting_key": s.meeting_key,
            }
            for s in sessions
        ]
    finally:
        client.close()

@router.get("/drivers")
async def get_drivers(session_key: int = Query(...)):
    try:
        url = f"https://api.openf1.org/v1/drivers?session_key={session_key}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        return [
            {
                "driver_number": d.get("driver_number"),
                "full_name": d.get("full_name"),
                "name_acronym": d.get("name_acronym"),
                "team_name": d.get("team_name"),
            }
            for d in data
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# --- 1. Результаты сессии ---
@router.get("/session_results")
async def get_session_results(session_key: int = Query(...)):
    client = OpenF1Client()
    try:
        results = client.session_result.list(session_key=session_key)
        drivers = client.drivers.list(session_key=session_key)
        driver_names = {d.driver_number: d.full_name for d in drivers}
        
        # Получаем все круги в сессии, чтобы посчитать статистику
        all_laps = client.laps.list(session_key=session_key)
        
        # Группируем круги по пилотам
        laps_by_driver = {}
        for lap in all_laps:
            if lap.driver_number not in laps_by_driver:
                laps_by_driver[lap.driver_number] = []
            laps_by_driver[lap.driver_number].append(lap)
            
        results_list = []
        for r in results:
            driver_laps = laps_by_driver.get(r.driver_number, [])
            
            # Считаем круги
            total_laps = len(driver_laps)
            
            # Ищем быстрейший круг
            valid_laps = [l.lap_duration for l in driver_laps if getattr(l, "lap_duration", None) is not None]
            fastest_lap = min(valid_laps) if valid_laps else None
            
            results_list.append({
                "position": getattr(r, "position", None),
                "driver_number": r.driver_number,
                "driver_name": driver_names.get(r.driver_number, f"#{r.driver_number}"),
                "points": getattr(r, "points", 0),
                "duration": getattr(r, "duration", None),
                "total_laps": total_laps,
                "fastest_lap": fastest_lap,
            })
        
        results_list.sort(key=lambda x: (x["position"] is None, x["position"] or 999))
        return results_list
    finally:
        client.close()

# --- 2. Быстрейший круг сессии ---
@router.get("/fastest_lap")
async def get_fastest_lap(session_key: int = Query(...)):
    client = OpenF1Client()
    try:
        # Получаем все круги и ищем самый быстрый
        laps = client.laps.list(session_key=session_key)
        timed_laps = [l for l in laps if l.lap_duration is not None]
        if not timed_laps:
            return {"error": "Нет данных о времени кругов"}
        
        fastest = min(timed_laps, key=lambda l: l.lap_duration)
        return {
            "driver_number": fastest.driver_number,
            "lap_number": fastest.lap_number,
            "lap_duration": fastest.lap_duration,
        }
    finally:
        client.close()

# --- 3. Радиопереговоры (рандом) ---
@router.get("/team_radio")
async def get_team_radio(session_key: int = Query(...)):
    client = OpenF1Client()
    try:
        radios = client.team_radio.list(session_key=session_key)
        return [
            {
                "driver_number": r.driver_number,
                "date": r.date,
                # Убедимся, что ссылка полная
                "recording_url": r.recording_url if r.recording_url.startswith('http') else f"https://api.openf1.org{r.recording_url}",
            }
            for r in radios
        ]
    finally:
        client.close()

# --- 4. Стратегии (Шины) ---
@router.get("/stints")
async def get_stints(session_key: int = Query(...)):
    client = OpenF1Client()
    try:
        stints = client.stints.list(session_key=session_key)
        return [
            {
                "driver_number": s.driver_number,
                "stint_number": s.stint_number,
                "compound": s.compound,
                "lap_start": s.lap_start,
                "lap_end": s.lap_end,
            }
            for s in stints
        ]
    finally:
        client.close()

# --- 5. Погода ---
@router.get("/weather")
async def get_weather(session_key: int = Query(...)):
    client = OpenF1Client()
    try:
        weather = client.weather.list(session_key=session_key)
        # Возвращаем последнюю запись (или список, если нужно)
        if not weather:
            return {"error": "Нет данных о погоде"}
        w = weather[-1] # Самая свежая
        return {
            "air_temperature": w.air_temperature,
            "track_temperature": w.track_temperature,
            "humidity": w.humidity,
            "rainfall": w.rainfall,
            "wind_speed": w.wind_speed,
        }
    finally:
        client.close()

# --- 6. Чемпионат (для гонок/спринтов) ---
@router.get("/championship")
async def get_championship(meeting_key: int = Query(...)):
    try:
        # Прямой запрос к API OpenF1 (эндпоинт для пилотов)
        url = f"https://api.openf1.org/v1/championship_drivers?meeting_key={meeting_key}"
        response = requests.get(url)
        response.raise_for_status() # Вызовет исключение, если статус не 200
        data = response.json()
        
        # Если API вернул пустой список, возвращаем пустой массив
        if not data:
            return []
            
        return [
            {
                "position": item.get("position_current"),
                "driver_number": item.get("driver_number"),
                "points": item.get("points_current", 0),
            }
            for item in data
        ]
    except requests.exceptions.RequestException as e:
        # Если OpenF1 недоступен или вернул ошибку, возвращаем 500 с понятным текстом
        raise HTTPException(status_code=500, detail=f"Ошибка при запросе чемпионата пилотов: {str(e)}")

@router.get("/championship_teams")
async def get_championship_teams(meeting_key: int = Query(...)):
    try:
        url = f"https://api.openf1.org/v1/championship_teams?meeting_key={meeting_key}"
        response = requests.get(url)
        response.raise_for_status() # Если ошибка - выбросит исключение
        data = response.json()
        
        if not data:
            return []
            
        return [
            {
                "position": item.get("position_current"),
                "team_name": item.get("team_name", "Unknown"),
                "points": item.get("points_current", 0),
            }
            for item in data
        ]
    except Exception as e:
        # Возвращаем пустой список вместо падения с 500, чтобы не ломать CORS
        return []