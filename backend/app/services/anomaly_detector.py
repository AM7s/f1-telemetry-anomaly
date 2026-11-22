import pandas as pd
import numpy as np
from typing import List
from app.models.schemas import Anomaly
from app.config import settings

def detect_anomalies_zscore(
    df: pd.DataFrame,
    column: str = "speed",
    window: int = 30,
    threshold: float = 2.5,
) -> List[Anomaly]:
    """
    Поиск аномалий исключительно методом скользящего Z-score.
    """
    if df.empty or column not in df.columns:
        return []
    
    # Работаем с копией, чтобы не мутировать исходный DataFrame
    series = df[column].copy()
    
    # Скользящее среднее и стандартное отклонение
    rolling_mean = series.rolling(window=window, center=True, min_periods=window // 2).mean()
    rolling_std = series.rolling(window=window, center=True, min_periods=window // 2).std()
    
    # Защита от деления на ноль (когда машина едет с постоянной скоростью)
    rolling_std = rolling_std.replace(0, np.nan)
    
    # Вычисляем Z-score
    z_scores = np.abs((series - rolling_mean) / rolling_std)
    
    # Находим индексы, где Z-score превышает порог
    anomaly_mask = z_scores > threshold
    
    raw_anomalies = []
    for idx in df.index[anomaly_mask]:
        raw_anomalies.append({
            "index": int(idx),
            "z": round(float(z_scores.loc[idx]), 2)
        })

    # --- ГРУППИРОВКА (Чтобы не было красных полос) ---
    if not raw_anomalies:
        return []

    raw_anomalies.sort(key=lambda x: x["index"])
    
    grouped = []
    current_group = [raw_anomalies[0]]

    # Объединяем близкие точки (например, если между ними меньше 8 сэмплов)
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

    # Формируем итоговый список: берем центр каждой группы
    final_anomalies = []
    for group in grouped:
        # Берем точку с максимальным Z-score (самую аномальную)
        best_item = max(group, key=lambda x: x["z"])
        idx = best_item["index"]
        
        final_anomalies.append(Anomaly(
            index=idx,
            date=str(df.loc[idx, "date"]),
            value=float(df.loc[idx, column]),
            z_score=best_item["z"],
        ))

    return final_anomalies