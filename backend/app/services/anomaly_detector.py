import pandas as pd
import numpy as np
from typing import List
from app.models.schemas import Anomaly

def detect_anomalies_zscore(df: pd.DataFrame, column: str = "speed", window: int = 20, threshold: float = 2.5) -> List[Anomaly]:
    if df.empty or column not in df.columns:
        return []
    
    raw_anomalies = []
    
    # --- 1. Поиск резкого торможения ---
    df['delta_speed'] = df[column].diff()
    hard_braking_mask = df['delta_speed'] < -15.0
    for idx in df.index[hard_braking_mask]:
        raw_anomalies.append({"index": int(idx), "z": -99.0})

    # --- 2. Поиск статистических выбросов (Z-score) ---
    series = df[column].copy()
    rolling_mean = series.rolling(window=window, center=True, min_periods=window//2).mean()
    rolling_std = series.rolling(window=window, center=True, min_periods=window//2).std()
    rolling_std = rolling_std.replace(0, np.nan)
    z_scores = np.abs((series - rolling_mean) / rolling_std)
    
    stat_mask = z_scores > threshold
    for idx in df.index[stat_mask]:
        raw_anomalies.append({"index": int(idx), "z": round(float(z_scores.loc[idx]), 2)})

    # --- 3. ГРУППИРОВКА АНОМАЛИЙ ---
    if not raw_anomalies:
        return []

    # Сортируем по индексу
    raw_anomalies.sort(key=lambda x: x["index"])
    
    grouped = []
    current_group = [raw_anomalies[0]]

    # Если между аномалиями меньше 8 сэмплов (около 2 секунд), считаем это одной зоной
    for i in range(1, len(raw_anomalies)):
        prev_idx = current_group[-1]["index"]
        curr_idx = raw_anomalies[i]["index"]

        if curr_idx - prev_idx <= 8:
            current_group.append(raw_anomalies[i])
        else:
            grouped.append(current_group)
            current_group = [raw_anomalies[i]]
            
    if current_group:
        grouped.append(current_group)

    # Формируем итоговый список: берем только центр каждой группы
    final_anomalies = []
    for group in grouped:
        # Находим индекс самой "сильной" аномалии в группе (минимальная скорость)
        best_item = min(group, key=lambda x: df.loc[x["index"], column])
        idx = best_item["index"]
        
        final_anomalies.append(Anomaly(
            index=idx,
            date=str(df.loc[idx, "date"]),
            value=float(df.loc[idx, column]),
            z_score=best_item["z"],
        ))

    return final_anomalies