from datetime import datetime, timedelta
import db


def get_current_streak(username):

    conn = db.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT DISTINCT DATE(completed_at)
    FROM study_sessions
    WHERE username=?
    ORDER BY DATE(completed_at) DESC
    """,(username,))

    rows = cursor.fetchall()

    conn.close()

    if not rows:
        return 0

    dates = [
        datetime.strptime(r[0],"%Y-%m-%d").date()
        for r in rows
    ]

    today = datetime.now().date()

    if dates[0] == today:
        streak = 1
        last = today

    elif dates[0] == today - timedelta(days=1):
        streak = 1
        last = today - timedelta(days=1)

    else:
        return 0

    for d in dates[1:]:

        if d == last - timedelta(days=1):
            streak += 1
            last = d

        else:
            break

  def get_best_streak(username):

    conn=db.get_db()
    cursor=conn.cursor()

    cursor.execute("""
    SELECT DISTINCT DATE(completed_at)
    FROM study_sessions
    WHERE username=?
    ORDER BY DATE(completed_at)
    """,(username,))

    rows=cursor.fetchall()

    conn.close()

    if not rows:
        return 0

    dates=[
        datetime.strptime(r[0],"%Y-%m-%d").date()
        for r in rows
    ]

    best=1
    current=1

    for i in range(1,len(dates)):

        if dates[i]==dates[i-1]+timedelta(days=1):

            current+=1

            best=max(best,current)

        else:

            current=1

    return best
    return streak
