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

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            id,
            requirement_type,
            requirement_value
        FROM achievements
        """
    )

    achievements = cursor.fetchall()

    for achievement_id, req_type, req_value in achievements:

        unlocked = False

        # -----------------------------
        # TOTAL STUDY SESSIONS
        # -----------------------------

        if req_type == "sessions":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username = ?
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # TOTAL MINUTES
        # -----------------------------

        elif req_type == "minutes":

            cursor.execute(
                """
                SELECT COALESCE(SUM(minutes),0)
                FROM study_sessions
                WHERE username = ?
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # CURRENT STREAK
        # -----------------------------

        elif req_type == "streak":

            unlocked = (
                streaks.get_current_streak(username)
                >= req_value
            )


        # -----------------------------
        # POMODORO
        # -----------------------------

        elif req_type == "pomodoro":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username=?
                AND mode='pomodoro'
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # DEEP WORK
        # -----------------------------

        elif req_type == "deepwork":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username=?
                AND mode='deepwork'
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # QUICK BURST
        # -----------------------------

        elif req_type == "quickburst":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username=?
                AND mode='quickburst'
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # EXAM CRUNCH
        # -----------------------------

        elif req_type == "examcrunch":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username=?
                AND mode='examcrunch'
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # EARLY BIRD
        # -----------------------------

        elif req_type == "early":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username=?
                AND CAST(strftime('%H', completed_at) AS INTEGER) < 8
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # NIGHT OWL
        # -----------------------------

        elif req_type == "night":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM study_sessions
                WHERE username=?
                AND CAST(strftime('%H', completed_at) AS INTEGER) >= 22
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # DAILY MINUTES
        # -----------------------------

        elif req_type == "dailyminutes":

            cursor.execute(
                """
                SELECT MAX(total)
                FROM
                (
                    SELECT
                        SUM(minutes) AS total
                    FROM study_sessions
                    WHERE username=?
                    GROUP BY DATE(completed_at)
                )
                """,
                (username,)
            )

            result = cursor.fetchone()[0] or 0

            unlocked = result >= req_value


        # -----------------------------
        # DAILY SESSIONS
        # -----------------------------

        elif req_type == "dailysessions":

            cursor.execute(
                """
                SELECT MAX(total)
                FROM
                (
                    SELECT
                        COUNT(*) AS total
                    FROM study_sessions
                    WHERE username=?
                    GROUP BY DATE(completed_at)
                )
                """,
                (username,)
            )

            result = cursor.fetchone()[0] or 0

            unlocked = result >= req_value


        # -----------------------------
        # ACCOUNT AGE
        # -----------------------------

        elif req_type == "account_age":

            cursor.execute(
                """
                SELECT MIN(DATE(completed_at))
                FROM study_sessions
                WHERE username=?
                """,
                (username,)
            )

            first = cursor.fetchone()[0]

            if first:

                first = datetime.strptime(
                    first,
                    "%Y-%m-%d"
                ).date()

                days = (
                    datetime.now().date()
                    - first
                ).days

                unlocked = days >= req_value


        # -----------------------------
        # TASKS
        # -----------------------------

        elif req_type == "tasks":

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM tasks
                WHERE username=?
                """,
                (username,)
            )

            unlocked = cursor.fetchone()[0] >= req_value


        # -----------------------------
        # SAVE IF EARNED
        # -----------------------------

        if unlocked:

            unlock(
                username,
                achievement_id
            )

    conn.close()
