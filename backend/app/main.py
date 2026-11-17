from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from fastapi import Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="F1 Telemetry Anomaly Service",
    description="Сервис телеметрии с детекцией аномалий на данных OpenF1",
    version="0.1.0",
)

# CORS для React-фронтенда (localhost:5173 — Vite по умолчанию)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )
    # Принудительно добавляем CORS заголовок
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    return response

app.include_router(router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}