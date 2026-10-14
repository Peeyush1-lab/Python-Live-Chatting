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

Implemented v0.5.0 architecture:

- Browser frontend: provides username entry, a room selector,
  room conversation, timestamps, and history controls.
- JavaScript Socket.IO client: tracks the confirmed room, sends
  join and message requests, and filters incoming events by room.
- Python Socket.IO server: validates room selection and stores
  the username and room in each connection's session.
- Socket.IO rooms: use chat:general, chat:study, and chat:coding
  to route messages and notices to room members.
- SQLite: stores message ID, username, text, UTC timestamp, and room.
- database.py: migrates existing messages to General and retrieves
  recent messages using a room filter and a room/id index.
- FastAPI: serves frontend assets and the /health endpoint.
- Uvicorn: runs the combined ASGI application.

### Join and Switch Flow

1. The browser sends username and room through join_chat.
2. The server validates both values.
3. When switching, the connection leaves its previous room.
4. The connection enters the selected Socket.IO room.
5. The server saves the username and room in its session.
6. After acknowledgement, the frontend clears the previous
   conversation and requests the joined room's history.

### Message and History Flow

1. The server takes the sender and room from the connection session.
2. Valid messages are committed to SQLite before broadcasting.
3. chat_message is sent only to members of that room.
4. get_history returns the joined room's latest 100 messages,
   ordered oldest first.
5. The frontend rejects stale history responses and filters
   live events by the confirmed room.
6. Database message IDs prevent duplicate display.

### Storage and Temporary State

Existing messages were assigned to General without deleting them.
Database operations run in worker threads.

Messages persist in data/chat.db. Connection sessions and system
notices are temporary. Users must rejoin after reconnecting.

All rooms are public. Room membership provides message routing,
not private access control.

## 4. Key decisions and trade-offs

| Decision | Options considered | Choice | Reason | Trade-off |
|---|---|---|---|---|
| Frontend | Streamlit or HTML/CSS/JavaScript | HTML/CSS/JavaScript | Direct browser event handling and control over the interface | Requires writing frontend code |
| Delivery | Complete app at once or incremental releases | Incremental releases | Understand and verify each feature before adding another | Full functionality arrives gradually |
| Username storage | Browser-provided sender or server session | Server session | Server selects the sender name from the joined connection | Users must rejoin after reconnecting |
| Message display | HTML rendering or plain text | textContent | User messages display literally | Rich-text formatting is unavailable |
| Timestamp source | Browser clock or server clock | Server UTC clock | Uses one timestamp source across clients | Depends on the server clock being accurate |
| Message storage | Memory, SQLite, or a separate database server | SQLite | Simple local persistence without another service | Concurrent writes are serialized; no multi-server design implemented |
| Save order | Broadcast before saving or save first | Save and commit first | Avoid broadcasting messages that failed to save | Delivery waits for database completion |
| History loading | Entire database or bounded history | Latest 100 messages | Bounds the initial response size | Older history is not accessible in the UI |
| Duplicate display | Compare text or use message IDs | Database message IDs | Distinguishes separate messages with identical text | Does not prevent duplicate submissions |
| Room scope | Multiple simultaneous rooms or one active room | One active room per connection | Simplifies switching and conversation state | Cannot follow several rooms simultaneously |
| Room identifiers | Plain names or prefixed names | chat: prefix | Separates chat rooms from automatic connection rooms | Requires consistent naming |
| Existing messages | Delete or migrate | Assign to General | Preserves saved conversations | Old messages have no original room information |

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
- [x] Stored display names in Socket.IO sessions.
  Evidence: main.py join_chat handler.
- [x] Validated usernames and messages on the server.
  Evidence: main.py join_chat and send_message handlers.
- [x] Implemented broadcasts and acknowledgement callbacks.
  Evidence: main.py and frontend/script.js; two-tab messaging verified.
- [x] Rendered user content as plain text.
  Evidence: frontend/script.js; literal HTML text check passed.
- [x] Disabled sending after disconnection until users rejoin.
  Evidence: server stop/restart check passed.
- [x] Generated UTC timestamps and displayed local times.
  Evidence: main.py and frontend/script.js; two-tab check passed.
- [x] Implemented join, name-change, and leave notices.
  Evidence: system_message events; verified with two browser tabs.
- [x] Implemented SQLite storage with parameterized SQL.
  Evidence: database.py.
- [x] Moved database reads and writes to worker threads.
  Evidence: asyncio.to_thread calls in main.py.
- [x] Verified history across page refreshes and server restarts.
  Evidence: manual browser and server restart checks.
- [x] Verified history/live message deduplication.
  Evidence: two-tab messaging and manual history reload checks.
- [x] Implemented room membership and room-scoped broadcasts.
  Evidence: main.py; cross-room messaging checks passed.
- [x] Implemented room-filtered SQLite history.
  Evidence: database.py; switching and restart checks passed.
- [x] Migrated existing messages without deletion.
  Evidence: room column migration and General history.
- [x] Managed frontend room switching and stale history responses.
  Evidence: frontend/script.js.

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

### First join blocked by an incorrect guard

- Symptom: Clicking Join / switch room did nothing.
- Cause: The join handler required joined to already be true.
- Fix: Removed !joined from the join guard while retaining it
  in the message-send guard.
- Lesson: A transition must not require its destination state.

### Message submission handler missing

- Symptom: The script had no handler to submit the message form.
- Cause: The handler was omitted during frontend edits.
- Fix: Restored the message-form submit listener.
- Lesson: Verify existing interactions after replacing code blocks.

## 8. What I would do differently at 100x scale

To be assessed after building and measuring the working application.

## 9. Interview answers I have rehearsed

Questions to study and answer in my own words:

1. What is the difference between Socket.IO and plain WebSocket?
2. What responsibilities do FastAPI, Socket.IO, and Uvicorn each have?
3. What happens when a client disconnects or the server restarts?

Answers not rehearsed yet.

## 10. Honest limitations

- Display names are not authenticated or unique.
- All connected browsers can receive messages and request shared history.
- History retrieval is limited to the latest 100 messages; older messages
  remain in the database but cannot be browsed through the interface.
- Join, name-change, and leave notices are temporary.
- Reloading history clears previously displayed temporary notices.
- Users must rejoin after reconnecting to send messages.
- Retrying a message after an acknowledgement timeout can create
  another stored message.
- No multiple rooms, private messaging, or deployment.
- No performance measurements or load tests yet.
- The browser Socket.IO client loads from an external CDN.

## 11. How to run it

Prerequisites: Python with pip, Git, and internet access to load
the browser Socket.IO client.

The server automatically creates data/chat.db on startup.
No additional database installation or environment variables are required.

The data/ directory is ignored by Git. Retaining data/chat.db
preserves stored messages across server restarts.

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