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
CHAT_ROOMS = {"general", "study", "coding"}

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
    return {"status": "ok", "version": "0.5.0"}

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
    room = session.get("room")

    if username and room in CHAT_ROOMS:
        await sio.emit(
            "system_message",
            {
                "message": f"{username} left the room.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "room": room,
            },
            to=f"chat:{room}",
            skip_sid=sid,
        )

    print(f"Disconnected: {sid} | Reason: {reason}")


@sio.event
async def join_chat(sid, data):
    if not isinstance(data, dict):
        return {"ok": False, "error": "Invalid join request."}

    username = data.get("username")
    room = data.get("room", "general")

    if not isinstance(username, str):
        return {"ok": False, "error": "Username must be text."}

    username = username.strip()

    if not 2 <= len(username) <= 24:
        return {
            "ok": False,
            "error": "Username must contain 2 to 24 characters.",
        }

    if not isinstance(room, str) or room not in CHAT_ROOMS:
        return {"ok": False, "error": "Choose a valid chat room."}

    session = await sio.get_session(sid)
    previous_username = session.get("username")
    previous_room = session.get("room")

    if previous_room and previous_room != room:
        await sio.leave_room(sid, f"chat:{previous_room}")

        await sio.emit(
            "system_message",
            {
                "message": f"{previous_username} left the room.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "room": previous_room,
            },
            to=f"chat:{previous_room}",
        )

    await sio.enter_room(sid, f"chat:{room}")

    session["username"] = username
    session["room"] = room
    await sio.save_session(sid, session)

    notice = None

    if previous_room != room:
        notice = f"{username} joined the room."
    elif previous_username != username:
        notice = f"{previous_username} is now known as {username}."

    if notice:
        await sio.emit(
            "system_message",
            {
                "message": notice,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "room": room,
            },
            to=f"chat:{room}",
        )

    return {"ok": True, "username": username, "room": room}


@sio.event
async def send_message(sid, data):
    session = await sio.get_session(sid)
    username = session.get("username")
    room = session.get("room")

    if not username or room not in CHAT_ROOMS:
        return {"ok": False, "error": "Join a room before sending messages."}

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
            room,
        )
    except sqlite3.Error:
        return {
            "ok": False,
            "error": "Message could not be saved. Please try again.",
        }

    await sio.emit("chat_message", saved_message, to=f"chat:{room}")

    return {"ok": True, "id": saved_message["id"], "room": room}

@sio.event
async def get_history(sid):
    session = await sio.get_session(sid)
    room = session.get("room")

    if room not in CHAT_ROOMS:
        return {"ok": False, "error": "Join a room before loading history."}

    try:
        history = await asyncio.to_thread(
            get_recent_messages,
            room=room,
        )
    except sqlite3.Error:
        return {
            "ok": False,
            "error": "Message history could not be loaded. Please retry.",
        }

    return {"ok": True, "room": room, "messages": history}