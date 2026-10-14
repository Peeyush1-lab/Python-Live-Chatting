# Python Live Chatting

A real-time chat application built with Python, FastAPI, and Socket.IO.

This project is developed through incremental releases. Each release adds
a manageable feature, verification steps, and an engineering log update.

## Project Status

v0.5.0 — Multiple public chat rooms verified locally.

### Working Features

- Responsive frontend with separate HTML, CSS, and JavaScript files.
- Live connection status and a server welcome message.
- Automatic reconnection and manual retry.
- Keyboard focus indicators and reduced-motion support.
- HTTP health endpoint at /health.
- Display names stored per Socket.IO connection.
- Live messaging across connected browser sessions.
- Username and message validation on the server.
- Sending enabled only after joining.
- Messages rendered as plain text.
- Server-generated UTC timestamps displayed in the viewer’s local timezone.
- Join, username-change, and leave notices in the conversation.
- Repeated submission of the same username does not create another notice.
- Chat messages saved in SQLite before broadcasting.
- Latest 100 saved messages loaded oldest first on connection.
- Message history retained across page refreshes and server restarts.
- Manual history reload with error and timeout feedback.
- Message IDs prevent duplicate display between history and live events.
- General, Study, and Coding public chat rooms.
- One joined room per browser connection.
- Messages and conversation notices delivered only within their room.
- Latest 100 saved messages retrieved for the joined room.
- Switching rooms clears the previous conversation and loads room history.
- Existing messages preserved in General through a database migration.

Multiple chat rooms are planned for v0.5.0.

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python and FastAPI |
| Real-time communication | Python Socket.IO |
| Frontend | HTML, CSS, and JavaScript |
| Browser client | JavaScript Socket.IO |
| Server | Uvicorn |
| Planned message storage | SQLite |

## Release Roadmap

Versions v0.1.0–v0.5.0 are implemented and verified locally.
Later versions describe planned work.

| Version | Scope | Status |
|---|---|---|
| v0.1.0 | Project setup and connection status | Completed |
| v0.2.0 | Usernames, shared messaging, and input validation | Completed |
| v0.3.0 | Timestamps and join/name-change/leave notices | Completed |
| v0.4.0 | SQLite persistence and message history | Completed |
| v0.5.0 | Public chat rooms and room-specific history | Completed |
| v0.6.0 | Registration and login | Planned |
| v0.7.0 | Private conversations | Planned |
| v1.0.0 | Reliability, testing, documentation, and deployment | Planned |

Release notes are available in the repository's GitHub Releases.

## Development Workflow

1. Define the scope and architecture before coding.
2. Build one release at a time and understand the implementation.
3. Verify normal behavior and deliberately test relevant failures.
4. Record actual decisions, issues, and measured results in SKILL.md.
5. Update this README to match the working application.
6. Commit changes and tag verified releases.

## Running Locally

Prerequisites: Python with pip, Git, and internet access to load the
browser Socket.IO client from its CDN.

```powershell
git clone https://github.com/Peeyush1-lab/Python-Live-Chatting.git
cd Python-Live-Chatting
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Open http://127.0.0.1:8000.

### Local Database

The application automatically creates data/chat.db on startup.
Python's built-in sqlite3 module is used; no separate database
installation is required.

The data/ directory is excluded from Git. A fresh clone starts
with an empty database.

Keep this database file to preserve message history.

### Manual Verification

- Confirm the connected status and server welcome message.
- Open a second tab and check for a separate server connection.
- Stop the server and observe the disconnected status.
- Restart the server and confirm automatic reconnection.
- Check the layout at mobile width and keyboard focus visibility.

## Engineering Log

SKILL.md will document the problem, architecture, trade-offs, demonstrated
skills, measurements, fixes, interview preparation, and honest limitations.

## Current Limitations

- Rooms are public; anyone can join any available room.
- Display names are not authenticated or unique.
- Only three predefined rooms are available.
- History retrieval is limited to the latest 100 messages per room.
- System notices are temporary.
- Users must rejoin after reconnecting.
- The joining client may not display its own join or rename notice.
- Retrying an unconfirmed message can create another stored message.
- No private messaging, deployment, or load testing.
- The browser Socket.IO client loads from an external CDN.

## Credits

Socket.IO learning reference:
[Miguel Grinberg — Learn Socket.IO with Python and JavaScript in 90 Minutes](https://blog.miguelgrinberg.com/post/learn-socket-io-with-python-and-javascript-in-90-minutes).

Project learning and documentation workflow:
The Resume Project Vault 2026, curated by @pratham.codes.