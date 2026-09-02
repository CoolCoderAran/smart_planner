from datetime import datetime
import db
import streaks


# =====================================
# UNLOCK ACHIEVEMENT
# =====================================

def unlock(username, achievement_id):

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO user_achievements
        (
            username,
            achievement_id,
            earned_at
        )
        VALUES (?, ?, ?)
        """,
        (
            username,
            achievement_id,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    )

    conn.commit()
    conn.close()


# =====================================
# CHECK ALL ACHIEVEMENTS
# =====================================

def check_achievements(username):
    if not username:
        return

    conn = db.get_db()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, requirement_type, requirement_value
            FROM achievements
            """
        )
        achievements_list = cursor.fetchall()

        for achievement_id, req_type, req_value in achievements_list:
            unlocked = False

            if req_type == "sessions":
                cursor.execute(
                    "SELECT COUNT(*) FROM study_sessions WHERE username = ?", (username,)
                )
                unlocked = cursor.fetchone()[0] >= req_value

            elif req_type == "minutes":
                cursor.execute(
                    "SELECT COALESCE(SUM(minutes), 0) FROM study_sessions WHERE username = ?", (username,)
                )
                unlocked = cursor.fetchone()[0] >= req_value

            elif req_type == "streak":
                unlocked = streaks.get_current_streak(username) >= req_value

            # Save earned achievement bound strictly to username
            if unlocked:
                unlock(cursor, username, achievement_id)

        conn.commit()
    finally:
        conn.close
        
#Copyright Aran Rath 2026
