import os

class Settings:
    # OpenF1: исторические данные доступны без токена.
    # Для live-режима нужен sponsor tier (€9.90/мес) — тогда добавь OPENF1_TOKEN.
    OPENF1_TOKEN: str | None = os.getenv("OPENF1_TOKEN")
    
    # Параметры детектора аномалий
    ZSCORE_WINDOW: int = 30          # скользящее окно (в сэмплах телеметрии)
    ZSCORE_THRESHOLD: float = 3.0    # порог срабатывания
    
    # Кэш (в продакшене заменить на Redis)
    CACHE_TTL_SECONDS: int = 300

settings = Settings()