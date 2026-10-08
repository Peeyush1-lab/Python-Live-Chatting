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

Planned initial architecture:

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

Record verified skills with file, commit, or test evidence.

No application skills verified yet.

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

- Application code has not been implemented in the current project setup.
- No verified messaging, authentication, or message persistence.
- No deployment or performance measurements.

Update this section as features become verified.

## 11. How to run it

Application run instructions will be recorded after v0.1.0 works.

## 12. Credits

Socket.IO learning reference:
[Miguel Grinberg — Learn Socket.IO with Python and JavaScript in 90 Minutes](https://blog.miguelgrinberg.com/post/learn-socket-io-with-python-and-javascript-in-90-minutes).

Engineering log and learning workflow:
The Resume Project Vault 2026, curated by @pratham.codes.