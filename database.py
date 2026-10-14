import sqlite3
from contextlib import closing
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
DATABASE_PATH = PROJECT_ROOT / "data" / "chat.db"


def init_db():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with closing(sqlite3.connect(DATABASE_PATH)) as connection:
        with connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY,
                    username TEXT NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    room TEXT NOT NULL DEFAULT 'general'
                )
                """
            )

            columns = {
                row[1]
                for row in connection.execute(
                    "PRAGMA table_info(messages)"
                ).fetchall()
            }

            if "room" not in columns:
                connection.execute(
                    """
                    ALTER TABLE messages
                    ADD COLUMN room TEXT NOT NULL DEFAULT 'general'
                    """
                )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_messages_room_id
                ON messages (room, id)
                """
            )


def save_message(username, message, timestamp, room="general"):
    with closing(sqlite3.connect(DATABASE_PATH)) as connection:
        with connection:
            cursor = connection.execute(
                """
                INSERT INTO messages (username, message, timestamp, room)
                VALUES (?, ?, ?, ?)
                """,
                (username, message, timestamp, room),
            )

            message_id = cursor.lastrowid

    return {
        "id": message_id,
        "username": username,
        "message": message,
        "timestamp": timestamp,
        "room": room,
    }


def get_recent_messages(limit=100, room="general"):
    if not isinstance(limit, int) or isinstance(limit, bool):
        raise ValueError("Limit must be an integer.")

    if not 1 <= limit <= 100:
        raise ValueError("Limit must be between 1 and 100.")

    with closing(sqlite3.connect(DATABASE_PATH)) as connection:
        connection.row_factory = sqlite3.Row

        rows = connection.execute(
            """
            SELECT id, username, message, timestamp, room
            FROM messages
            WHERE room = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (room, limit),
        ).fetchall()

    return [dict(row) for row in reversed(rows)]