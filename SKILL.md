---
name: python-live-chatting
description: Engineering log for Python Live Chatting, recording architecture, decisions, verified skills, measurements, and fixes.
track: "backend-development"
started: "2026-10-08"
shipped: ""
repo: "https://github.com/Peeyush1-lab/Python-Live-Chatting"
live: ""
---

# Python Live Chatting Engineering Log

## 1. What this project is

A browser-based application intended to let people exchange messages
without refreshing the page.

The planned implementation uses a Python backend with FastAPI and
Socket.IO, connected to an HTML, CSS, and JavaScript frontend.

## 2. Problem it solves

Small groups need a shared conversation where new messages appear
automatically. This project will begin with a shared chat room and
gradually add message history, multiple rooms, and user accounts.

The current stage is repository setup; messaging is not implemented yet.

## 3. Architecture

Implemented v0.1.0 architecture:

- Browser frontend: displays the interface and connection status.
- JavaScript Socket.IO client: sends and receives real-time events.
- Python Socket.IO server: manages connections and handles events.
- FastAPI: serves the frontend and supports future HTTP endpoints.
- Uvicorn: runs the combined ASGI application.

FastAPI and Socket.IO will run together in one application.
SQLite is planned for a later release.

## 4. Key decisions and trade-offs

| Decision | Options considered | Choice | Reason | Trade-off |
|---|---|---|---|---|
| Frontend | Streamlit or HTML/CSS/JavaScript | HTML/CSS/JavaScript | Direct browser event handling and control over the interface | Requires writing frontend code |
| Delivery | Complete app at once or incremental releases | Incremental releases | Understand and verify each feature before adding another | Full functionality arrives gradually |

Add further decisions when they occur.

## 5. Skills demonstrated

- [x] Combined FastAPI and Socket.IO through ASGI.
  Evidence: main.py; browser connection verified.
- [x] Served HTML and static frontend assets.
  Evidence: main.py and frontend/.
- [x] Handled connection, disconnection, and reconnection events.
  Evidence: frontend/script.js; server stop/restart check passed.
- [x] Built a responsive interface with accessible controls.
  Evidence: frontend/index.html and frontend/style.css;
  mobile layout and keyboard focus checks passed.

## 6. Numbers I measured

| Metric | Before | After | Measurement method |
|---|---|---|---|
| Not measured yet | — | — | — |

Record actual measurements; do not use estimated results.

## 7. Things that broke and how I fixed them

### Python cache uploaded to GitHub

- Symptom: __pycache__ appeared in the repository.
- Cause: Cache files were already tracked; adding ignore rules did not untrack them.
- Fix: Removed the folder from Git tracking with git rm --cached and pushed the cleanup.
- Lesson: Review staged files before committing. Ignore rules do not remove previously tracked files.

## 8. What I would do differently at 100x scale

To be assessed after building and measuring the working application.

## 9. Interview answers I have rehearsed

Questions to study and answer in my own words:

1. What is the difference between Socket.IO and plain WebSocket?
2. What responsibilities do FastAPI, Socket.IO, and Uvicorn each have?
3. What happens when a client disconnects or the server restarts?

Answers not rehearsed yet.

## 10. Honest limitations

- No message sending, usernames, rooms, or message history yet.
- No authentication or deployment.
- The browser Socket.IO client loads from an external CDN.
- No performance measurements or load tests yet.

## 11. How to run it

Prerequisites: Python with pip, Git, and internet access to load
the browser Socket.IO client.

### First-time setup — Windows PowerShell

```powershell
git clone https://github.com/Peeyush1-lab/Python-Live-Chatting.git
cd Python-Live-Chatting
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### Start the application

From the project root:

```powershell
.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```
</br>

> Open http://127.0.0.1:8000.
Health endpoint: http://127.0.0.1:8000/health.

Stop the server with Ctrl+C.

Required environment variables: none for **v0.1.0**.

The application was verified locally. A fresh-clone setup check
has not yet been recorded.

## 12. Credits

Socket.IO learning reference: [Miguel Grinberg — Learn Socket.IO with Python and JavaScript in 90 Minutes](https://blog.miguelgrinberg.com/post/learn-socket-io-with-python-and-javascript-in-90-minutes).

Engineering log and learning workflow:
The Resume Project Vault 2026, curated by @pratham.codes.