from datetime import datetime, timedelta
import sqlite3

DB_NAME = "database.db"


def get_db():
    conn = sqlite3.connect(DB_NAME)
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # USERS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # TASKS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        task TEXT NOT NULL
    )
    """)

    # EMAIL SUBSCRIBERS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL
    )
    """)

    # STUDY SESSIONS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        mode TEXT NOT NULL,
        task TEXT,
        minutes INTEGER NOT NULL,
        completed_at TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()


def get_streak(username):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT DISTINCT DATE(completed_at)
        FROM study_sessions
        WHERE username = ?
        ORDER BY DATE(completed_at) DESC
    """,
        (username,),
    )

    # SQLite returns a list of tuples like [('2026-03-30',), ('2026-03-29',)]
    raw_dates = cursor.fetchall()
    conn.close()

    if not raw_dates:
        return 0  # No study sessions -> streak is 0

    # Parse raw text dates into datetime.date objects
    dates = [
        datetime.strptime(row[0], "%Y-%m-%d").date()
        for row in raw_dates
        if row[0]
    ]

    today = datetime.now().date()

    # If the most recent study date is today, start from today
    # If it's yesterday, start from yesterday
    if dates[0] == today:
        streak = 1
        last_date = today
    elif dates[0] == today - timedelta(days=1):
        streak = 1
        last_date = today - timedelta(days=1)
    else:
        return 0  # Streak lost if last study was before yesterday

    # Loop through the remaining dates to check for consecutive days
    for date in dates[1:]:
        if date == last_date - timedelta(days=1):
            streak += 1
            last_date = date
        elif date == last_date:
            continue  # Ignore multiple entries on the same date
        else:
            break  # Gap found -> streak ends

    return streak
