from pathlib import Path

import socketio
from fastapi import FastAPI
from fastapi.responses import FileResponse

PROJECT_ROOT = Path(__file__).resolve().parent

api = FastAPI()

sio = socketio.AsyncServer(async_mode="asgi")

app = socketio.ASGIApp(sio, other_asgi_app=api)


@api.get("/")
async def home():
    return FileResponse(PROJECT_ROOT / "Frontend" / "index.html")


@sio.event
async def connect(sid, environ, auth):
    print(f"Connected: {sid}")
    await sio.emit(
        "server_message",
        {"message": "Connected to the Python chat server."},
        to=sid,
    )


@sio.event
async def disconnect(sid, reason):
    print(f"Disconnected: {sid} | Reason: {reason}")