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

    # Streak TABLE
def get_streak(username):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT DATE(completed_at)
        FROM study_sessions
        WHERE username = ?
        ORDER BY DATE(completed_at) DESC
    """, (username,))

    dates = cursor.fetchall()

    conn.close()

    
    return dates

get_streak()
     if not dates:
        return 0  # No study sessions → streak is 0

    streak = 0
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
        return 0  # No streak if last study was before yesterday

    # Loop through the rest of the dates
    for date in dates[1:]:
        if date == last_date - timedelta(days=1):
            streak += 1
            last_date = date
        else:
            break  # Gap found → streak ends

    return streak
    
    conn.commit()
    conn.close()
