from pathlib import Path

import socketio
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
import asyncio
import sqlite3
from database import init_db, save_message, get_recent_messages

PROJECT_ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_ROOT / "Frontend"

init_db()
api = FastAPI()
api.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

sio = socketio.AsyncServer(async_mode="asgi")
app = socketio.ASGIApp(sio, other_asgi_app=api)


@api.get("/")
async def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@api.get("/health")
async def health():
    return {"status": "ok", "version": "0.4.0"}


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
    session = await sio.get_session(sid)
    username = session.get("username")

    if username:
        await sio.emit(
            "system_message",
            {
                "message": f"{username} left the chat.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            skip_sid=sid,
        )

    print(f"Disconnected: {sid} | Reason: {reason}")


@sio.event
async def join_chat(sid, data):
    if not isinstance(data, dict):
        return {"ok": False, "error": "Invalid username request."}

    username = data.get("username")

    if not isinstance(username, str):
        return {"ok": False, "error": "Username must be text."}

    username = username.strip()

    if not 2 <= len(username) <= 24:
        return {
            "ok": False,
            "error": "Username must contain 2 to 24 characters.",
        }

    session = await sio.get_session(sid)
    previous_username = session.get("username")

    session["username"] = username
    await sio.save_session(sid, session)

    if previous_username != username:
        message = (
            f"{previous_username} is now known as {username}."
            if previous_username
            else f"{username} joined the chat."
        )

        await sio.emit(
            "system_message",
            {
                "message": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    return {"ok": True, "username": username}


@sio.event
async def send_message(sid, data):
    session = await sio.get_session(sid)
    username = session.get("username")

    if not username:
        return {"ok": False, "error": "Join the chat before sending messages."}

    if not isinstance(data, dict):
        return {"ok": False, "error": "Invalid message request."}

    message = data.get("message")

    if not isinstance(message, str):
        return {"ok": False, "error": "Message must be text."}

    message = message.strip()

    if not 1 <= len(message) <= 1000:
        return {
            "ok": False,
            "error": "Message must contain 1 to 1000 characters.",
        }

    timestamp = datetime.now(timezone.utc).isoformat()

    try:
        saved_message = await asyncio.to_thread(
            save_message,
            username,
            message,
            timestamp,
        )
    except sqlite3.Error:
        return {
            "ok": False,
            "error": "Message could not be saved. Please try again.",
        }

    await sio.emit("chat_message", saved_message)

    return {"ok": True, "id": saved_message["id"]}

@sio.event
async def get_history(sid):
    try:
        history = await asyncio.to_thread(get_recent_messages)
    except sqlite3.Error:
        return {
            "ok": False,
            "error": "Message history could not be loaded. Please retry.",
        }

    return {"ok": True, "messages": history}