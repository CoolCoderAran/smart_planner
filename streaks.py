from datetime import datetime, timedelta
import db

#
# =====================================
# GET ALL STUDY DAYS
# =====================================

def get_study_days(username):
    conn = db.get_db()
    cursor = conn.cursor()

    # Fix 28: DISTINCT DATE filtering ensures single daily bucket for streaks
    cursor.execute(
        """
        SELECT DISTINCT DATE(completed_at)
        FROM study_sessions
        WHERE username = ? AND completed_at IS NOT NULL
        ORDER BY DATE(completed_at) DESC
        """,
        (username,)
    )

    rows = cursor.fetchall()
    conn.close()

    return [
        datetime.strptime(row[0], "%Y-%m-%d").date()
        for row in rows
        if row[0]
    ]


# =====================================
# CURRENT STREAK
# =====================================

def get_current_streak(username):

    dates = get_study_days(username)

    if not dates:
        return 0

    today = datetime.now().date()

    streak = 0

    # Allow studying today or yesterday
    if dates[0] == today:

        current_date = today

    elif dates[0] == today - timedelta(days=1):

        current_date = today - timedelta(days=1)

    else:

        return 0


    for date in dates:

        if date == current_date:

            streak += 1

            current_date -= timedelta(days=1)

        else:

            break


    return streak



# =====================================
# BEST STREAK EVER
# =====================================

def get_best_streak(username):

    dates = get_study_days(username)

    if not dates:
        return 0


    # Reverse into chronological order

    dates = sorted(dates)


    best = 1
    current = 1


    for i in range(1, len(dates)):

        difference = (
            dates[i] -
            dates[i-1]
        ).days


        if difference == 1:

            current += 1

        else:

            current = 1


        if current > best:

            best = current


    return best



# =====================================
# GET BOTH STREAK VALUES
# =====================================

def get_streak_data(username):

    return {

        "current_streak":
            get_current_streak(username),

        "best_streak":
            get_best_streak(username)

    }
