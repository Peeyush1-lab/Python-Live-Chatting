from pathlib import Path

import socketio
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

PROJECT_ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_ROOT / "Frontend"

api = FastAPI()
api.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

sio = socketio.AsyncServer(async_mode="asgi")
app = socketio.ASGIApp(sio, other_asgi_app=api)


@api.get("/")
async def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@api.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@sio.event
async def connect(sid, environ, auth):
    print(f"Connected: {sid}")
    await sio.emit(
        "server_message",
        {"message": "Your browser is connected to the Python chat server."},
        to=sid,
    )


@sio.event
async def disconnect(sid, reason):
    print(f"Disconnected: {sid} | Reason: {reason}")